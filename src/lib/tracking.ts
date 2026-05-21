declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type TrackEvent =
  | { name: 'ClickDsp'; params: { dsp: string; releaseSlug: string; trackSlug?: string } }
  | { name: 'VideoPlay'; params: { releaseSlug: string; trackSlug?: string } }
  | { name: 'Share'; params: { network: string; releaseSlug: string; trackSlug?: string } };

export function track(event: TrackEvent): void {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') return;
  window.fbq('trackCustom', event.name, event.params);
}

export {};
