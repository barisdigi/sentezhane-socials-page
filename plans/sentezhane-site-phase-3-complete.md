## Phase 3 Complete: Core Layout, Theme & PWA Basics

Established the visual shell: dark-theme tokens, `BaseLayout` with header/footer, a CLS-safe `Cover` image component, Inter font via `@fontsource`, and PWA assets (favicon, manifest, 192/512 icons). Accent color locked to `#7c3aed`.

**Files created/changed:**
- `src/styles/global.css`
- `src/layouts/BaseLayout.astro`
- `src/components/SiteHeader.astro`
- `src/components/SiteFooter.astro`
- `src/components/Cover.astro`
- `public/favicon.svg`
- `public/site.webmanifest`
- `public/icon-192.png`
- `public/icon-512.png`
- `src/pages/index.astro`
- `package.json` (added `@fontsource/inter`)

**Functions created/changed:**
- None (components only).

**Tests created/changed:**
- None (no test infrastructure per plan).

**Review Status:** APPROVED.

**Git Commit Message:**
```
feat: add base layout, dark theme, and PWA basics

- Introduce CSS tokens and dark theme with Inter font via fontsource
- Add BaseLayout, SiteHeader, and SiteFooter components
- Add Cover component with explicit width/height to prevent CLS
- Ship favicon SVG, web manifest, and 192/512 PWA icons
- Wire placeholder home page through BaseLayout
```
