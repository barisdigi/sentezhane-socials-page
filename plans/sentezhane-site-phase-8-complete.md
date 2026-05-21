## Phase 8 Complete: Share Buttons with Pixel Events

Added a Paylaş section to release and track pages with X, WhatsApp, Facebook share intents and a "Linki Kopyala" button. Every click fires a `Share` custom event through the existing tracking helper, with `network`, `releaseSlug`, and optional `trackSlug` params.

**Files created/changed:**
- `src/lib/share.ts`
- `src/components/ShareButtons.astro`
- `src/styles/global.css`
- `src/pages/[slug].astro`
- `src/pages/[album]/[track].astro`

**Functions created/changed:**
- `buildShareUrl(network, target)` — URL builder for X, WhatsApp, Facebook intents.
- Exported `SHARE_NETWORKS` canonical order.

**Tests created/changed:**
- None.

**Review Status:** APPROVED (one minor UX note about the copy label appearing on clipboard-unavailable browsers — non-blocking).

**Git Commit Message:**
```
feat: add share buttons with pixel tracking

- Add share URL builders for X, WhatsApp, and Facebook intents
- Add ShareButtons component with copy-to-clipboard fallback
- Fire Meta Pixel Share event with network and slug params on click
- Render on release and track pages, with absolute canonical URLs
```
