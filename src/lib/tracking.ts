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
  if (typeof window.fbq !== 'function') return;
  const eventId = genEventId();
  const fbq = window.fbq;

  // Custom event preserves the detailed parameters we already use in reporting.
  fbq('trackCustom', event.name, event.params, { eventID: eventId });

  // Mirror ClickDsp as a Meta standard event so the ad optimizer can use it
  // for conversion bidding / lookalike seeding. Standard events outperform
  // custom events as optimization signals. `ViewContent` matches the
  // semantics of "tapped to listen to this track/release" and keeps the
  // `Lead` bucket free for future email/signup captures.
  if (event.name === 'ClickDsp') {
    const p = event.params;
    const contentId = p.trackSlug || p.releaseSlug;
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
      },
      { eventID: eventId },
    );
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
