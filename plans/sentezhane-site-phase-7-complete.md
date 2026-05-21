## Phase 7 Complete: SEO Meta, JSON-LD, Sitemap & Robots

Added per-page canonical + Open Graph + Twitter meta, three JSON-LD builders (`MusicGroup` on home, `MusicAlbum` on album pages, `MusicRecording` on singles + album tracks), the `@astrojs/sitemap` integration, and a `robots.txt` pointing at the generated sitemap index. All 13 routes still build clean and lint is clean.

**Files created/changed:**
- `astro.config.mjs`
- `public/robots.txt`
- `src/lib/seo.ts`
- `src/components/JsonLd.astro`
- `src/components/SeoMeta.astro`
- `src/pages/index.astro`
- `src/pages/[slug].astro`
- `src/pages/[album]/[track].astro`
- `package.json` (added `@astrojs/sitemap`)

**Functions created/changed:**
- `abs(path)` — resolves a relative path against the site URL; passes through full URLs.
- `buildMusicGroupJsonLd(artist)`
- `buildMusicAlbumJsonLd({ album, tracks, artistName })`
- `buildMusicRecordingJsonLd({ recording, artistName })`

**Tests created/changed:**
- None.

**Review Status:** APPROVED (no issues).

**Git Commit Message:**
```
feat: add SEO meta, JSON-LD, sitemap, and robots

- Configure @astrojs/sitemap and add robots.txt pointing at it
- Add SeoMeta with canonical, Open Graph, and Twitter card tags
- Add JsonLd component and schema.org builders for music entities
- Emit MusicGroup on home, MusicAlbum on albums, MusicRecording on
  singles and album tracks with absolute URLs and album linkage
```
