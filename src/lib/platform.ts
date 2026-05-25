export type Platform = 'ios' | 'android' | 'other';

export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  // iPadOS 13+ reports as Macintosh; disambiguate via touch points.
  if (/Macintosh/.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1) {
    return 'ios';
  }
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export function isMobile(p: Platform = detectPlatform()): boolean {
  return p === 'ios' || p === 'android';
}
