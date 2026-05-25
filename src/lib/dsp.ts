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
      // /track/<id> -> spotify:track:<id> ; /album/<id> -> spotify:album:<id>
      const path = u.pathname.replace(/^\/+|\/+$/g, '');
      if (!path) return url;
      return `spotify:${path.replace(/\//g, ':')}`;
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

