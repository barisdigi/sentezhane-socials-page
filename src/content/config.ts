import { z, defineCollection } from 'astro:content';
import { csvLoader } from '../lib/csvLoader';

const optionalUrl = z.string().url().optional();
const optionalStr = z.string().min(1).optional();

const linksSchema = z.object({
  spotify: optionalUrl,
  appleMusic: optionalUrl,
});

const artist = defineCollection({
  loader: csvLoader('content/artist.csv', {
    idStrategy: { kind: 'fixed', id: 'artist' },
    transform: (row) => ({
      name: row.name,
      bio: row.bio,
      bioEn: row.bioEn,
      metaPixelId: row.metaPixelId,
      socials: {
        twitter: row.twitter,
        instagram: row.instagram,
        tiktok: row.tiktok,
        youtube: row.youtube,
        website: row.website,
      },
    }),
  }),
  schema: z.object({
    name: z.string().min(1),
    bio: optionalStr,
    bioEn: optionalStr,
    metaPixelId: optionalStr,
    socials: z.object({
      twitter: optionalUrl,
      instagram: optionalUrl,
      tiktok: optionalUrl,
      youtube: optionalUrl,
      website: optionalUrl,
    }),
  }),
});

const releases = defineCollection({
  loader: csvLoader('content/releases.csv', {
    idStrategy: { kind: 'column', column: 'slug' },
    transform: (row) => ({
      slug: row.slug,
      type: row.type,
      title: row.title,
      releaseDate: row.releaseDate,
      cover: row.cover,
      youtubeVideoId: row.youtubeVideoId,
      links: {
        spotify: row.spotify,
        appleMusic: row.appleMusic,
      },
    }),
  }),
  schema: z.object({
    slug: z.string().min(1),
    type: z.enum(['album', 'single']),
    title: optionalStr,
    releaseDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    cover: optionalStr,
    youtubeVideoId: optionalStr,
    links: linksSchema,
  }),
});

const tracks = defineCollection({
  loader: csvLoader('content/tracks.csv', {
    idStrategy: { kind: 'composite', columns: ['albumSlug', 'slug'], separator: '::' },
    transform: (row) => ({
      albumSlug: row.albumSlug,
      slug: row.slug,
      title: row.title,
      cover: row.cover,
      youtubeVideoId: row.youtubeVideoId,
      links: {
        spotify: row.spotify,
        appleMusic: row.appleMusic,
      },
    }),
  }),
  schema: z.object({
    albumSlug: z.string().min(1),
    slug: z.string().min(1),
    title: optionalStr,
    cover: optionalStr,
    youtubeVideoId: optionalStr,
    links: linksSchema,
  }),
});

export const collections = { artist, releases, tracks };
