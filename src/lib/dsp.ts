import type { Release, Track } from './types';

export type DspKey = 'spotify' | 'appleMusic';

export interface DspEntry {
  key: DspKey;
  label: string;
  url: string;
}

const DSP_ORDER: { key: DspKey; label: string }[] = [
  { key: 'spotify', label: 'Spotify' },
  { key: 'appleMusic', label: 'Apple Music' },
];

export function getDspLinks(links: Release['data']['links'] | Track['data']['links']): DspEntry[] {
  return DSP_ORDER.flatMap((d) => {
    const url = links[d.key];
    return url ? [{ ...d, url }] : [];
  });
}

/**
 * Convert an https DSP URL to its native-app deep link so that mobile devices
 * with the app installed open it directly instead of going through the web
 * player. Falls back to the original URL when no safe scheme exists for the
 * platform, so the link is always clickable.
 *
 * Platform notes:
 *  - iOS: `spotify:` and `music://` are both registered by their apps and
 *    safely break out of in-app webviews (Instagram/Facebook) via the OS.
 *  - Android: `spotify:` is registered by Spotify and works via intent. The
 *    `music://` scheme is NOT registered on Android (Apple Music Android uses
 *    https app links), so we keep the https URL there — otherwise the browser
 *    opens a blank page when the user has no handler.
 *  - Desktop / unknown: leave the https URL untouched.
 */
export function getNativeDeepLink(
  key: DspKey,
  url: string,
  platform: 'ios' | 'android' | 'other' = 'other',
): string {
  if (platform === 'other') return url;
  try {
    const u = new URL(url);
    if (key === 'spotify' && u.hostname === 'open.spotify.com') {
      // Strip locale prefix (e.g. /intl-tr/) and trim slashes so we get the
      // canonical <type>/<id> path. Valid URIs look like spotify:track:<id>.
      let path = u.pathname.replace(/^\/+|\/+$/g, '');
      path = path.replace(/^intl-[a-z]{2}(?:-[a-z]{2})?\//i, '');
      if (!path) return url;
      const [type, id] = path.split('/');
      if (!type || !id) return url;
      return `spotify:${type}:${id}`;
    }
    if (key === 'appleMusic' && u.hostname === 'music.apple.com') {
      // Only iOS reliably handles the music:// scheme. Android has no
      // registered handler, so keep the https URL (Apple Music Android app
      // claims the domain via app links when installed).
      if (platform === 'ios') {
        return `music://${u.host}${u.pathname}${u.search}`;
      }
      return url;
    }
  } catch {
    /* noop */
  }
  return url;
}

