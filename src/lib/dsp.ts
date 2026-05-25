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
 * player. Falls back to the original URL if parsing fails or no scheme is
 * known. Safe to call from in-app webviews (Instagram, Facebook): the native
 * scheme is intercepted by the OS and breaks out of the webview.
 */
export function getNativeDeepLink(key: DspKey, url: string): string {
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
      // Apple Music's documented scheme: music://music.apple.com/...
      return `music://${u.host}${u.pathname}${u.search}`;
    }
  } catch {
    /* noop */
  }
  return url;
}

