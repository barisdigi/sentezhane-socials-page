## Phase 5 Complete: Discography Home Page

Replaced the placeholder home with a hero, three filter chips (Hepsi / Albümler / Singlelar) that toggle visibility via a `data-filter` attribute on the grid, a responsive release-card grid, and an `ArtistBio` section pulling name / bio / socials from `artist.csv`. Build is at 13 pages, lint is clean.

**Files created/changed:**
- `src/components/ReleaseCard.astro`
- `src/components/ReleaseGrid.astro`
- `src/components/FilterChips.astro`
- `src/components/ArtistBio.astro`
- `src/pages/index.astro`
- `src/styles/global.css`

**Functions created/changed:**
- Inline filter script in `FilterChips.astro` (toggles `aria-pressed`, sets `dataset.filter` on `.release-grid`).

**Tests created/changed:**
- None.

**Review Status:** APPROVED.

**Git Commit Message:**
```
feat: build discography home with grid, filters, and bio

- Replace placeholder home with hero, filter chips, and release grid
- Add ReleaseCard, ReleaseGrid, FilterChips, and ArtistBio components
- Filter chips toggle data-filter on the grid; CSS hides off-type cards
- Render artist bio and social links pulled from artist.csv
- Drop now-unused .release-list styles
```
