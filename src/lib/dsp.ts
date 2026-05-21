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
