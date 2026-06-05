declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type TrackEvent =
  | { name: 'ClickDsp'; params: { dsp: string; releaseSlug: string; trackSlug?: string; lang?: string; placement?: string } }
  | { name: 'VideoPlay'; params: { releaseSlug: string; trackSlug?: string; lang?: string } }
  | { name: 'Share'; params: { network: string; releaseSlug: string; trackSlug?: string; lang?: string } };

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

export function track(event: TrackEvent): void {
  if (typeof window === 'undefined') return;
  const eventId = genEventId();
  const fbq = typeof window.fbq === 'function' ? window.fbq : null;

  // Browser pixel events — skipped when ad blocker kills fbevents.js
  if (fbq) {
    fbq('trackCustom', event.name, event.params, { eventID: eventId });
  }

  if (event.name === 'ClickDsp') {
    const p = event.params;
    const contentId = p.trackSlug || p.releaseSlug;

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
        { eventID: eventId },
      );
      try { sessionStorage.setItem('vc_browser_sent', '1'); } catch { /* noop */ }
    }

    // CAPI fires independently — once per session, even if ad blocker kills fbq.
    // Shares the same eventID so Meta deduplicates when both fire.
    if (!serverSent) {
      void sendToCapi(event, eventId).then((sent) => {
        if (!sent) return;
        try { sessionStorage.setItem('vc_server_sent', '1'); } catch { /* noop */ }
      });
    }
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function sendToCapi(event: TrackEvent, eventId: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const payload = JSON.stringify({
    name: event.name,
    eventId,
    params: event.params,
    url: window.location.href,
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc'),
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
    if (typeof window.fbq === 'function') {
      const lang = document.documentElement.lang || undefined;
      window.fbq('trackCustom', 'Engaged15s', { lang, thresholdMs });
    }
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
