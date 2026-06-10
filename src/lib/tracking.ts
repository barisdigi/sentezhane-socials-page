declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type TrackEvent =
  | { name: 'PageView'; params: { lang?: string } }
  | { name: 'ClickDsp'; params: { dsp: string; releaseSlug: string; trackSlug?: string; lang?: string; placement?: string } }
  | { name: 'VideoPlay'; params: { releaseSlug: string; trackSlug?: string; lang?: string } }
  | { name: 'Share'; params: { network: string; releaseSlug: string; trackSlug?: string; lang?: string } }
  | { name: 'Engaged15s'; params: { lang?: string; thresholdMs?: number } };

function genEventId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* noop */
  }
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Returns a single ViewContent event id that is shared between the browser
 * Pixel and the server (CAPI) for the whole session. Persisting it guarantees
 * both halves use the *same* event_id even when they fire on different clicks
 * (e.g. the browser Pixel fires now but CAPI only succeeds on a later retry),
 * which is what Meta needs to deduplicate the two events.
 */
function getViewContentEventId(): string {
  try {
    const existing = sessionStorage.getItem('vc_event_id');
    if (existing) return existing;
  } catch { /* private browsing or storage full */ }
  const id = genEventId();
  try { sessionStorage.setItem('vc_event_id', id); } catch { /* noop */ }
  return id;
}

/**
 * Returns a stable first-party identifier (`external_id`) persisted in
 * localStorage. The same raw value is passed to the browser Pixel as advanced
 * matching (see MetaPixel.astro) and forwarded to CAPI, giving Meta a reliable
 * deduplication / matching key that survives ad blockers and missing cookies.
 */
function getExternalId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = localStorage.getItem('ext_id');
    if (existing) return existing;
    const id = genEventId().toLowerCase();
    localStorage.setItem('ext_id', id);
    return id;
  } catch {
    return undefined;
  }
}

/**
 * Fires a standard `PageView` to both the browser Pixel and CAPI, sharing a
 * single event id so Meta deduplicates the two halves. Pixel initialization
 * (`fbq('init', ...)`) happens in MetaPixel.astro before this runs.
 */
export function trackPageView(): void {
  if (typeof window === 'undefined') return;
  const fbq = typeof window.fbq === 'function' ? window.fbq : null;
  const lang = typeof document !== 'undefined' ? document.documentElement.lang || undefined : undefined;
  const eventId = genEventId();
  if (fbq) {
    fbq('track', 'PageView', {}, { eventID: eventId });
  }
  void sendToCapi({ name: 'PageView', params: { lang } }, eventId);
}

export function track(event: TrackEvent): void {
  if (typeof window === 'undefined') return;
  const fbq = typeof window.fbq === 'function' ? window.fbq : null;

  // A DSP click is reported to Meta as a single ViewContent (browser + CAPI),
  // deduplicated once per session. The raw `ClickDsp` custom event is no longer
  // emitted — ViewContent supersedes it.
  if (event.name === 'ClickDsp') {
    const p = event.params;
    const contentId = p.trackSlug || p.releaseSlug;

    // Shared, persisted event id so browser ViewContent and server ViewContent
    // always deduplicate, even when they fire on different clicks.
    const vcEventId = getViewContentEventId();

    let browserSent = false;
    let serverSent = false;
    try {
      browserSent = !!sessionStorage.getItem('vc_browser_sent');
      serverSent = !!sessionStorage.getItem('vc_server_sent');
    } catch { /* private browsing or storage full */ }

    // Fire browser ViewContent once per session
    if (!browserSent && fbq) {
      fbq(
        'track',
        'ViewContent',
        {
          content_name: contentId,
          content_category: p.dsp,
          content_type: 'music',
          content_ids: [contentId],
          value: 1,
          currency: 'TRY',
          dsp: p.dsp,
          placement: p.placement || 'inline',
        },
        { eventID: vcEventId },
      );
      try { sessionStorage.setItem('vc_browser_sent', '1'); } catch { /* noop */ }
    }

    // CAPI fires independently — once per session, even if ad blocker kills fbq.
    // Shares the same eventID so Meta deduplicates when both fire. The flag is
    // claimed *synchronously before* sending so two near-simultaneous track()
    // calls can never each fire a CAPI request for the same eventID (which
    // would surface as 2 server events / 1 browser event in Meta's dedup view).
    if (!serverSent) {
      try { sessionStorage.setItem('vc_server_sent', '1'); } catch { /* noop */ }
      void sendToCapi(event, vcEventId).then((sent) => {
        if (sent) return;
        // Send failed — release the claim so a later click can retry.
        try { sessionStorage.removeItem('vc_server_sent'); } catch { /* noop */ }
      });
    }
    return;
  }

  // Every other event is mirrored to both the browser Pixel and CAPI, sharing a
  // single event id so Meta deduplicates the two halves.
  const eventId = genEventId();
  if (fbq) {
    fbq('trackCustom', event.name, event.params, { eventID: eventId });
  }
  void sendToCapi(event, eventId);
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Reads a cookie value *without* URL-decoding it. Meta's `_fbc` cookie must be
 * forwarded byte-for-byte: decoding it can alter the embedded `fbclid` (e.g.
 * `%`, `+` or other reserved characters), which Meta rejects as a "modified
 * fbclid".
 */
function readRawCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
  return match ? match[1] : undefined;
}

/**
 * Returns the raw, still-encoded value of a query-string parameter. Using
 * `URLSearchParams.get()` would URL-decode the value and mutate the `fbclid`,
 * so we extract the substring verbatim instead.
 */
function rawQueryParam(search: string, key: string): string | undefined {
  const pairs = search.replace(/^\?/, '').split('&');
  for (const pair of pairs) {
    if (pair.startsWith(key + '=')) return pair.slice(key.length + 1);
  }
  return undefined;
}

/**
 * Returns the Meta click identifier (`fbc`). Prefers the `_fbc` cookie set by
 * the Pixel, but falls back to constructing it from the `fbclid` URL parameter
 * when the cookie has not been written yet (or the Pixel was blocked). The
 * derived value is persisted to `_fbc` so the browser Pixel and CAPI stay
 * consistent for subsequent events. Both the cookie and the `fbclid` parameter
 * are read raw so the value Meta receives is never modified.
 */
function getFbc(): string | undefined {
  const cookie = readRawCookie('_fbc');
  if (cookie) return cookie;
  if (typeof window === 'undefined') return undefined;
  try {
    const fbclid = rawQueryParam(window.location.search, 'fbclid');
    if (!fbclid) return undefined;
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    try {
      document.cookie = `_fbc=${fbc}; max-age=7776000; path=/; samesite=lax`;
    } catch { /* noop */ }
    return fbc;
  } catch {
    return undefined;
  }
}

function sendToCapi(event: TrackEvent, eventId: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const payload = JSON.stringify({
    name: event.name,
    eventId,
    params: event.params,
    url: window.location.href,
    fbp: readCookie('_fbp'),
    fbc: getFbc(),
    externalId: getExternalId(),
  });
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon('/api/track/', blob)) return Promise.resolve(true);
      console.warn('[capi] sendBeacon returned false, falling back to fetch');
    }
    return fetch('/api/track/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    })
      .then((res) => {
        console.debug('[capi] /api/track/ responded', res.status, res.statusText);
        if (!res.ok) console.error('[capi] /api/track/ responded', res.status, res.statusText);
        return res.ok;
      })
      .catch((err) => {
        console.error('[capi] /api/track/ fetch failed', err);
        return false;
      });
  } catch (err) {
    console.error('[capi] sendToCapi threw', err);
    return Promise.resolve(false);
  }
}

let engagementInitialized = false;
let engagementFired = false;

/**
 * Fires a Meta custom event `Engaged15s` once the visitor has spent at least
 * `thresholdMs` of foreground time on the page. Pauses while the tab is
 * hidden so background tabs do not count.
 */
export function initEngagementTimer(thresholdMs = 15000): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (engagementInitialized) return;
  engagementInitialized = true;

  let elapsed = 0;
  let lastResume = Date.now();
  let active = !document.hidden;

  const fire = () => {
    if (engagementFired) return;
    engagementFired = true;
    const lang = document.documentElement.lang || undefined;
    track({ name: 'Engaged15s', params: { lang, thresholdMs } });
  };

  const foregroundMs = () => elapsed + (active ? Date.now() - lastResume : 0);

  let timerId: ReturnType<typeof setTimeout> | null = null;
  const scheduleCheck = () => {
    if (engagementFired) return;
    if (timerId !== null) clearTimeout(timerId);
    const remaining = Math.max(0, thresholdMs - foregroundMs());
    timerId = setTimeout(() => {
      if (foregroundMs() >= thresholdMs) fire();
      else scheduleCheck();
    }, remaining || 250);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (active) elapsed += Date.now() - lastResume;
      active = false;
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    } else {
      lastResume = Date.now();
      active = true;
      scheduleCheck();
    }
  });

  if (active) scheduleCheck();
}

export {};
