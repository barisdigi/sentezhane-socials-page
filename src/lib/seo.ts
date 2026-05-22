import type { ArtistData, Release } from './types';
import { normalizeBioText } from './format';

const SITE_URL = 'https://sentezhane.com';

export function abs(path: string): string {
  if (!path) return SITE_URL + '/';
  if (path.startsWith('http')) return path;
  return new URL(path, SITE_URL).toString();
}

export function buildMusicGroupJsonLd(artist: ArtistData, lang: 'tr' | 'en' = 'tr'): Record<string, unknown> {
  const sameAs = Object.values(artist.socials ?? {}).filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );

  const ld: Record<string, unknown> = {
    '@type': 'MusicGroup',
    name: artist.name,
    url: SITE_URL,
  };

  const bio = lang === 'en' ? (artist.bioEn ?? artist.bio) : artist.bio;
  if (bio) ld.description = normalizeBioText(bio);
  if (sameAs.length > 0) ld.sameAs = sameAs;

  return ld;
}

export function buildMusicAlbumJsonLd(params: {
  album: Release['data'];
  tracks: Array<{ title: string; slug: string }>;
  artistName: string;
}): Record<string, unknown> {
  const { album, tracks, artistName } = params;

  const ld: Record<string, unknown> = {
    '@type': 'MusicAlbum',
    name: album.title ?? album.slug,
    url: abs('/' + album.slug + '/'),
    byArtist: { '@type': 'MusicGroup', name: artistName },
    numTracks: tracks.length,
    track: tracks.map((t) => ({
      '@type': 'MusicRecording',
      name: t.title,
      url: abs('/' + album.slug + '/' + t.slug + '/'),
    })),
  };

  if (album.cover) ld.image = abs(album.cover);
  if (album.releaseDate) ld.datePublished = album.releaseDate;

  return ld;
}

export function buildMusicRecordingJsonLd(params: {
  recording: { title: string; slug: string; cover?: string; albumSlug?: string; albumTitle?: string };
  artistName: string;
}): Record<string, unknown> {
  const { recording, artistName } = params;

  const url = recording.albumSlug
    ? abs('/' + recording.albumSlug + '/' + recording.slug + '/')
    : abs('/' + recording.slug + '/');

  const ld: Record<string, unknown> = {
    '@type': 'MusicRecording',
    name: recording.title,
    url,
    byArtist: { '@type': 'MusicGroup', name: artistName },
  };

  if (recording.cover) ld.image = abs(recording.cover);
  if (recording.albumSlug && recording.albumTitle) {
    ld.inAlbum = { '@type': 'MusicAlbum', name: recording.albumTitle };
  }

  return ld;
}
