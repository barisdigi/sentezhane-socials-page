# Sentezhane

Static Astro site for the artist **Sentezhane**, deployed to GitHub Pages at [sentezhane.com](https://sentezhane.com). Dark-themed discography page with DSP links, embedded YouTube videos, share buttons, and Meta Pixel tracking.

## Prerequisites

- Node 20+
- npm

## Local Development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # produces dist/
npm run preview
npm run lint
```

## Content Management

All content lives in three CSV files at the repo root under `content/`:

### `content/artist.csv`

Single row with artist metadata.

| Column | Required | Notes |
|--------|----------|-------|
| `name` | yes | Artist display name |
| `bio` | no | Short biography text |
| `metaPixelId` | no | Meta (Facebook) Pixel ID for tracking |
| `twitter` | no | Twitter/X profile URL |
| `instagram` | no | Instagram profile URL |
| `tiktok` | no | TikTok profile URL |
| `youtube` | no | YouTube channel URL |
| `website` | no | External website URL |

### `content/releases.csv`

One row per album or single. Each release gets a page at `/<slug>/`.

| Column | Required | Notes |
|--------|----------|-------|
| `slug` | yes | URL slug (e.g. `film-seridi`) |
| `type` | yes | `album` or `single` |
| `title` | no | Display title; if blank, slug is humanized (e.g. `gece-yarisi` → `Gece Yarisi`) |
| `releaseDate` | no | ISO date (YYYY-MM-DD) |
| `cover` | no | Path to cover image (e.g. `/covers/film-seridi.jpg`) |
| `youtubeVideoId` | no | YouTube video ID for embed |
| `spotify` | no | Spotify URL |
| `appleMusic` | no | Apple Music URL |

### `content/tracks.csv`

One row per song belonging to an album. Singles do **not** need track rows.

| Column | Required | Notes |
|--------|----------|-------|
| `albumSlug` | yes | Must match a `slug` in `releases.csv` |
| `slug` | yes | Track URL slug; page at `/<albumSlug>/<slug>/` |
| `title` | no | Display title; humanized from slug if blank |
| `cover` | no | Track-specific cover; falls back to album cover |
| `youtubeVideoId` | no | YouTube video ID |
| `spotify` | no | Spotify URL |
| `appleMusic` | no | Apple Music URL |

## Adding a New Release

1. Add a row to `content/releases.csv`.
2. Drop a cover image at `public/covers/<slug>.jpg` (recommended 1400×1400, square, JPG or PNG).
3. For albums, add track rows to `content/tracks.csv`.
4. Push to `main` — the site rebuilds and deploys automatically.

## Cover Images

Convention: `public/covers/<slug>.jpg`. Reference in CSV as `/covers/<slug>.jpg`.

Track-level covers are optional — tracks without a cover inherit the album cover.

## Meta Pixel Tracking

Set `metaPixelId` in `content/artist.csv` to enable tracking. Events emitted:

- `ClickDsp` — user clicks a streaming platform link
- `VideoPlay` — user plays an embedded YouTube video
- `Share` — user clicks a share button

## Deployment

GitHub Actions workflow at `.github/workflows/deploy.yml` deploys to GitHub Pages on every push to `main`.

The custom domain `sentezhane.com` is configured via `public/CNAME`. Repository settings must have Pages enabled with source set to **GitHub Actions**.

## Project Structure

```
src/
├── components/       # Astro components (ReleaseCard, TrackList, DspButtons, etc.)
├── content/
│   └── config.ts    # Content collection config
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── csvLoader.ts # CSV parsing & data loading
│   ├── dsp.ts       # DSP link helpers
│   ├── format.ts    # Formatting utilities
│   ├── releases.ts  # Release data access
│   ├── seo.ts       # SEO/meta helpers
│   ├── share.ts     # Share URL generation
│   ├── tracking.ts  # Pixel event helpers
│   └── types.ts     # TypeScript types
├── pages/
│   ├── index.astro          # Discography listing
│   ├── [slug].astro         # Release detail page
│   ├── [album]/[track].astro # Track detail page
│   └── 404.astro            # Turkish 404 page
└── styles/
    └── global.css
```
