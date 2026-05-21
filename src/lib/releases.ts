import { getCollection } from 'astro:content';
import type { Release, Track } from './types';

function compareReleaseDateDesc(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return b.localeCompare(a);
}

export function sortByDateDesc<T extends { releaseDate?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) =>
    compareReleaseDateDesc(a.releaseDate, b.releaseDate),
  );
}

export async function getAllReleases(): Promise<Release[]> {
  const releases = await getCollection('releases');
  return [...releases].sort((a, b) =>
    compareReleaseDateDesc(a.data.releaseDate, b.data.releaseDate),
  );
}

export async function getReleaseBySlug(
  slug: string,
): Promise<Release | undefined> {
  const releases = await getCollection('releases');
  return releases.find((r) => r.data.slug === slug);
}

export async function getTracksForAlbum(
  albumSlug: string,
): Promise<(Track & { resolvedCover: string | undefined })[]> {
  const tracks = await getCollection('tracks');
  const album = await getReleaseBySlug(albumSlug);
  const albumCover = album?.data.cover;

  return tracks
    .filter((t) => t.data.albumSlug === albumSlug)
    .map((t) => ({
      ...t,
      resolvedCover: t.data.cover ?? albumCover,
    }));
}

export async function getTrack(
  albumSlug: string,
  trackSlug: string,
): Promise<
  { track: Track; album: Release; resolvedCover: string | undefined } | undefined
> {
  const album = await getReleaseBySlug(albumSlug);
  if (!album) return undefined;

  const tracks = await getCollection('tracks');
  const track = tracks.find(
    (t) => t.data.albumSlug === albumSlug && t.data.slug === trackSlug,
  );
  if (!track) return undefined;

  return {
    track,
    album,
    resolvedCover: track.data.cover ?? album.data.cover,
  };
}
