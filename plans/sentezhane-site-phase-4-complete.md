## Phase 4 Complete: Release & Track Page Templates

Built the dynamic release page (covers albums and singles), the album-track sub-page, and supporting components (`DspButtons`, `YouTubeEmbed`, `TrackList`, `Breadcrumb`). Made `title` fully optional with a slug-to-title fallback (`displayTitle`) and relaxed the CSV loader so missing trailing columns become `undefined` instead of aborting the build. 13 routes generated, lint clean.

**Files created/changed:**
- `src/lib/dsp.ts`
- `src/lib/format.ts`
- `src/lib/csvLoader.ts`
- `src/content/config.ts`
- `src/components/DspButtons.astro`
- `src/components/YouTubeEmbed.astro`
- `src/components/TrackList.astro`
- `src/components/Breadcrumb.astro`
- `src/pages/[slug].astro`
- `src/pages/[album]/[track].astro`
- `src/pages/index.astro`
- `src/styles/global.css`
- `astro.config.mjs`

**Functions created/changed:**
- `getDspLinks`
- `slugToTitle`
- `displayTitle`
- Loosened `csvLoader` parse-error handling (filters `FieldMismatch`)
- Schemas: `releases.title`, `tracks.title` → optional

**Tests created/changed:**
- None (no test infrastructure per plan).

**Review Status:** APPROVED.

**Git Commit Message:**
```
feat: add release and track pages with DSP and YouTube blocks

- Add dynamic [slug] and [album]/[track] routes with shared template
- Add DspButtons, YouTubeEmbed, TrackList, and Breadcrumb components
- Centralize DSP list and link filtering in src/lib/dsp.ts
- Make title optional and fall back to a humanized slug via displayTitle
- Treat CSV missing trailing columns as undefined instead of fatal
- Enforce trailing slashes for consistent URLs
```
