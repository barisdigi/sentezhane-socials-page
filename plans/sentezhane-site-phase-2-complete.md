## Phase 2 Complete: Content Schema & Sample Data

Wired up CSV-backed content collections (artist / releases / tracks) parsed with `papaparse`, validated with Zod, and exposed via typed helpers. Sample album (3 tracks, one with its own cover) and one single are loaded; `npm run build` and `npm run lint` are clean.

**Files created/changed:**
- `content/artist.csv`
- `content/releases.csv`
- `content/tracks.csv`
- `public/covers/ilk-album.jpg`
- `public/covers/yaz-gecesi.jpg`
- `public/covers/gece-yarisi.jpg`
- `src/content/config.ts`
- `src/lib/csvLoader.ts`
- `src/lib/releases.ts`
- `src/lib/types.ts`
- `src/pages/index.astro`
- `package.json` (added `papaparse` + `@types/papaparse`)

**Functions created/changed:**
- `csvLoader` (generic CSV → Astro Content Layer loader with `idStrategy` and optional `transform`)
- `getAllReleases`
- `getReleaseBySlug`
- `getTracksForAlbum`
- `getTrack` (resolves track cover with fallback to album cover)
- `sortByDateDesc`
- `compareReleaseDateDesc` (internal)

**Tests created/changed:**
- None (no test infrastructure per plan).

**Review Status:** APPROVED (after revision — unsafe cast in `getAllReleases` replaced with a direct comparator).

**Git Commit Message:**
```
feat: load albums, tracks, and artist data from CSV

- Add CSV files for artist, releases, and tracks with optional fields
- Implement papaparse-backed Content Layer loader with id strategies
- Add Zod schemas grouping flat columns into links and socials objects
- Expose release helpers with track cover fallback to album cover
- Seed sample album with three tracks and one single
```
