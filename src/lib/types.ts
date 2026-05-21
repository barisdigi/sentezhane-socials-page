import type { CollectionEntry } from 'astro:content';

export type Release = CollectionEntry<'releases'>;
export type Track = CollectionEntry<'tracks'>;
export type ArtistData = CollectionEntry<'artist'>['data'];
