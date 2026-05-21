## Plan: Sentezhane Static Artist Site

A minimal static smart-link-style site for **sentezhane** (sentezhane.com), built with Astro and deployed to GitHub Pages. Releases (albums + singles) and tracks are authored as CSV files in `content/` (easy to edit in Excel/Sheets); the build generates one page per album, per single, and per track-within-album, plus a discography home page. Includes Meta Pixel tracking on DSP clicks, YouTube plays, and shares, plus SEO (OG/Twitter/JSON-LD/sitemap) and PWA basics. No test infrastructure — content validation via Zod and a clean `astro build` is the bar.

**Phases (9)**

1. **Phase 1: Project Scaffold**
    - **Objective:** Working Astro + TypeScript (strict) project with linting and formatting.
    - **Files/Functions to Modify/Create:** `package.json`, `astro.config.mjs` (`site: 'https://sentezhane.com'`, `output: 'static'`), `tsconfig.json` (extends strict), `.eslintrc.cjs`, `.prettierrc`, `.gitignore`, `.nvmrc`, `src/pages/index.astro` (placeholder).
    - **Tests to Write:** None.
    - **Steps:**
        1. Init Astro minimal template with TS strict.
        2. Add ESLint + Prettier.
        3. Scripts: `dev`, `build`, `preview`, `lint`, `format`.
        4. Run `astro build` and confirm clean output.

2. **Phase 2: Content Schema & Sample Data**
    - **Objective:** Typed content collections loaded from CSV via Zod for `artist` + `releases` (with joined `tracks`); sample album and single loaded.
    - **Files/Functions to Modify/Create:** `src/content/config.ts` (custom CSV `loader`s using `papaparse`), `content/artist.csv` (header + 1 row: `name, bio, metaPixelId, twitter, instagram, tiktok, youtube, website` — only `name` required), `content/releases.csv` (header + rows: `slug, type, title, releaseDate, cover, youtubeVideoId, spotify, appleMusic` — only `slug`, `type` required), `content/tracks.csv` (header + rows: `albumSlug, slug, title, cover, youtubeVideoId, spotify, appleMusic` — only `albumSlug`, `slug` required; `cover` falls back to album cover), `src/lib/releases.ts` (`getAllReleases`, `getReleaseBySlug`, `getTrack`, `sortByDateDesc` — joins tracks to album by `albumSlug`, resolves track cover with fallback to album cover), `public/covers/`.
    - **Tests to Write:** None (Zod validates at build).
    - **Steps:**
        1. Install `papaparse` and write a CSV loader helper for content collections.
        2. Define Zod schemas. Required fields are minimal; everything else is optional. Title is optional too — a display helper humanizes the slug as fallback.
           - release = `{ slug, type: 'album'|'single', title?, releaseDate?, cover?, youtubeVideoId?, links: { spotify?, appleMusic? } }`
           - track = `{ albumSlug, slug, title?, cover?, youtubeVideoId?, links: { spotify?, appleMusic? } }`
           - artist = `{ name, bio?, metaPixelId?, socials: { twitter?, instagram?, tiktok?, youtube?, website? } }`
           - Empty CSV cells become `undefined`; the entire `socials` object may be empty. CSV rows shorter than the header are tolerated (missing trailing columns become `undefined`).
        3. Implement helpers in `src/lib/releases.ts`: joins `tracks.csv` rows onto albums by `albumSlug`, and `getTrack` returns a resolved `cover` (track’s own cover if present, otherwise the album’s cover; may still be `undefined`).
        4. Add sample data: one album with 3 tracks (one track has its own cover, others fall back) and one single (release row only); `astro build` must validate.

3. **Phase 3: Core Layout, Theme & PWA Basics**
    - **Objective:** Visual shell — dark theme default, responsive, image optimization, favicon, manifest.
    - **Files/Functions to Modify/Create:** `src/layouts/BaseLayout.astro`, `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/components/Cover.astro` (uses `astro:assets`), `src/styles/global.css`, `public/favicon.svg`, `public/site.webmanifest`, `public/icon-192.png`, `public/icon-512.png`.
    - **Tests to Write:** None.
    - **Steps:**
        1. Build `BaseLayout.astro` with a `<slot name="head">` and global styles.
        2. Define CSS tokens for the dark theme.
        3. Add manifest, theme-color, viewport meta.
        4. `Cover.astro` uses `astro:assets` for responsive `srcset`.
        5. Verify visually with `astro dev`.

4. **Phase 4: Release & Track Page Templates**
    - **Objective:** Shared release template renders albums + singles; album tracks get sub-pages.
    - **Files/Functions to Modify/Create:** `src/pages/[slug].astro` (releases), `src/pages/[album]/[track].astro` (album tracks), `src/components/DspButtons.astro`, `src/components/YouTubeEmbed.astro` (no-cookie, lazy), `src/components/TrackList.astro`, `src/components/Breadcrumb.astro`, `src/lib/dsp.ts` (Spotify, Apple Music).
    - **Tests to Write:** None.
    - **Steps:**
        1. Add `getStaticPaths` for releases and album tracks.
        2. Implement `DspButtons` — render only links present in the CSV row.
        3. Conditional `YouTubeEmbed` when `youtubeVideoId` is set.
        4. `TrackList` on album pages links to `/[albumSlug]/[trackSlug]`.
        5. `Breadcrumb` on track pages links back to the album.

5. **Phase 5: Discography Home Page**
    - **Objective:** Replace placeholder index with sorted release grid, simple album/single filter chips, and artist bio + socials in the home footer area.
    - **Files/Functions to Modify/Create:** `src/pages/index.astro`, `src/components/ReleaseGrid.astro`, `src/components/ReleaseCard.astro`, `src/components/FilterChips.astro`, `src/components/ArtistBio.astro`.
    - **Tests to Write:** None.
    - **Steps:**
        1. Render all releases sorted newest-first.
        2. Inline `<script>` toggles `data-type` for filtering (no framework).
        3. `ArtistBio` reads from `artist.csv`, shown only on home.

6. **Phase 6: Meta Pixel & Event Tracking**
    - **Objective:** Inject Meta Pixel (`1606102687153657`); fire events on DSP clicks and YouTube plays.
    - **Files/Functions to Modify/Create:** `src/components/MetaPixel.astro` (mounted in `BaseLayout`), `src/lib/tracking.ts` (`track(eventName, params)` safe-guarded by `typeof window.fbq`), update `DspButtons.astro` (click → `track('ClickDsp', { dsp, releaseSlug, trackSlug? })`), update `YouTubeEmbed.astro` to use the YouTube IFrame API (`onStateChange` `PLAYING` → `track('VideoPlay', { releaseSlug, trackSlug? })`).
    - **Tests to Write:** None.
    - **Steps:**
        1. `MetaPixel.astro` is rendered only if `metaPixelId` is set in `artist.csv`; otherwise it is a no-op.
        2. Implement `tracking.ts` with a safe `window.fbq` guard so calls are no-ops when the pixel isn’t loaded.
        3. `MetaPixel.astro` emits the standard snippet + `PageView` when active.
        4. Switch `YouTubeEmbed.astro` to IFrame API.
        5. Wire click handlers on DSP buttons.
        6. Verify with Meta Pixel Helper.

7. **Phase 7: SEO Meta, JSON-LD, Sitemap & Robots**
    - **Objective:** Per-page OG/Twitter meta + JSON-LD; auto sitemap + robots.
    - **Files/Functions to Modify/Create:** `src/components/SeoMeta.astro` (canonical, OG, Twitter), `src/components/JsonLd.astro`, `src/lib/seo.ts` (`buildMusicGroupJsonLd`, `buildMusicAlbumJsonLd`, `buildMusicRecordingJsonLd`), integrate into `[slug].astro`, `[album]/[track].astro`, and `index.astro`, install + configure `@astrojs/sitemap`, `public/robots.txt`.
    - **Tests to Write:** None.
    - **Steps:**
        1. Implement `SeoMeta.astro` and `JsonLd.astro`.
        2. Album → `MusicAlbum`; single → `MusicRecording`; home → `MusicGroup`.
        3. Add sitemap integration; write `robots.txt`.
        4. `astro build` and inspect `dist/` for sitemap + meta.

8. **Phase 8: Share Buttons with Pixel Events**
    - **Objective:** Share buttons (Copy link, X, WhatsApp, Facebook) on release + track pages; fire `Share` pixel events.
    - **Files/Functions to Modify/Create:** `src/components/ShareButtons.astro`, `src/lib/share.ts` (URL builders), integrate into release + track templates.
    - **Tests to Write:** None.
    - **Steps:**
        1. Implement URL builders for X/WhatsApp/Facebook intents.
        2. Copy uses `navigator.clipboard`.
        3. Each button → `track('Share', { network, releaseSlug, trackSlug? })`.

9. **Phase 9: GitHub Pages Deploy + 404 + README**
    - **Objective:** Ship deploy workflow with `sentezhane.com` custom domain; add 404; document content authoring.
    - **Files/Functions to Modify/Create:** `.github/workflows/deploy.yml` (Astro build → `actions/deploy-pages`), `public/CNAME` (`sentezhane.com`), `src/pages/404.astro`, `README.md`.
    - **Tests to Write:** None.
    - **Steps:**
        1. Add workflow (Node from `.nvmrc`, `npm ci`, `astro build`, deploy).
        2. Add `CNAME`.
        3. 404 page links home.
        4. README documents the CSV columns, image conventions (drop high-res into `public/covers/<slug>.jpg`), and how to add an album/single/track row.

**Open Questions** — none.
