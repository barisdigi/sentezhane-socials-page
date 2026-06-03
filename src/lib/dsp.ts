import type { Release, Track } from './types';

// Primary DSPs get full-size CTA buttons and the sticky mobile bar treatment.
// Secondary DSPs render as compact icon-only chips below the primaries so the
// main page stays focused on the platforms most users will use.
export type PrimaryDspKey = 'spotify' | 'appleMusic';
export type SecondaryDspKey = 'youtubeMusic' | 'deezer' | 'amazonMusic' | 'tidal';
export type DspKey = PrimaryDspKey | SecondaryDspKey;

export interface DspEntry {
  key: DspKey;
  label: string;
  url: string;
}

const PRIMARY_ORDER: { key: PrimaryDspKey; label: string }[] = [
  { key: 'spotify', label: 'Spotify' },
  { key: 'appleMusic', label: 'Apple Music' },
];

const SECONDARY_ORDER: { key: SecondaryDspKey; label: string }[] = [
  { key: 'youtubeMusic', label: 'YouTube Music' },
  { key: 'deezer', label: 'Deezer' },
  { key: 'amazonMusic', label: 'Amazon Music' },
  { key: 'tidal', label: 'Tidal' },
];

type LinkMap = Release['data']['links'] | Track['data']['links'];

export function getDspLinks(links: LinkMap): DspEntry[] {
  return PRIMARY_ORDER.flatMap((d) => {
    const url = links[d.key];
    return url ? [{ ...d, url }] : [];
  });
}

export function getSecondaryDspLinks(links: LinkMap): DspEntry[] {
  return SECONDARY_ORDER.flatMap((d) => {
    const url = links[d.key];
    return url ? [{ ...d, url }] : [];
  });
}

export function isPrimaryDsp(key: string): key is PrimaryDspKey {
  return key === 'spotify' || key === 'appleMusic';
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
      // Preserve the `context` query param (e.g. ?context=spotify:playlist:<id>)
      // so the Spotify app starts playback inside the given playlist/album
      // instead of as a one-off track. The native URI scheme accepts the same
      // query string the web player uses. `si` is the share identifier used
      // for attribution — keep it so analytics line up with the shared link.
      const params = new URLSearchParams();
      const context = u.searchParams.get('context');
      if (context && /^spotify:(playlist|album|artist|show|episode):[A-Za-z0-9]+$/.test(context)) {
        params.set('context', context);
      }
      const si = u.searchParams.get('si');
      if (si && /^[A-Za-z0-9_-]+$/.test(si)) {
        params.set('si', si);
      }
      const query = params.toString();
      return query ? `spotify:${type}:${id}?${query}` : `spotify:${type}:${id}`;
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

