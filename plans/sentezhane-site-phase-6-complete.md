## Phase 6 Complete: Meta Pixel & Event Tracking

Added Meta Pixel initialization (only when `metaPixelId` is set in `artist.csv`), a typed `track()` helper, a delegated DSP click listener that emits `ClickDsp`, and converted the YouTube embed to use the IFrame API so it emits a single `VideoPlay` event per video on first play. Build still produces 13 pages and lint is clean.

**Files created/changed:**
- `src/lib/tracking.ts`
- `src/components/MetaPixel.astro`
- `src/layouts/BaseLayout.astro`
- `src/components/DspButtons.astro`
- `src/components/YouTubeEmbed.astro`
- `src/pages/[slug].astro`
- `src/pages/[album]/[track].astro`
- `.eslintrc.cjs` (added `dist/` to `ignorePatterns`)

**Functions created/changed:**
- `track(event)` — discriminated-union tracker safe-guarded by `window`/`fbq` checks.
- Delegated `document` click listener in `DspButtons` script.
- IFrame API loader + per-iframe `data-fired` guard in `YouTubeEmbed` script.

**Tests created/changed:**
- None.

**Review Status:** APPROVED (after applying the reviewer's minor recommendation — moved the `VideoPlay` "already fired" flag from the wrapper element to the iframe itself for multi-embed robustness).

**Git Commit Message:**
```
feat: add Meta Pixel and event tracking

- Initialize Meta Pixel only when metaPixelId is set in artist.csv
- Add typed track() helper with ClickDsp, VideoPlay, and Share events
- Emit ClickDsp via delegated click listener on DSP buttons
- Switch YouTube embed to IFrame API and emit VideoPlay once per video
- Pass release and track slugs through to tracking call sites
```
