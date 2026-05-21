## Phase 1 Complete: Project Scaffold

Initialized an Astro + TypeScript (strict) static project at the workspace root with ESLint, Prettier, and a placeholder homepage. `npm install`, `npm run build`, and `npm run lint` all succeed.

**Files created/changed:**
- `package.json`
- `astro.config.mjs`
- `tsconfig.json`
- `.eslintrc.cjs`
- `.prettierrc`
- `.gitignore`
- `.nvmrc`
- `src/pages/index.astro`

**Functions created/changed:**
- None (config-only phase)

**Tests created/changed:**
- None (no test infrastructure per plan)

**Review Status:** APPROVED (one minor non-blocking recommendation to pin `.nvmrc` to a specific LTS patch version)

**Git Commit Message:**
```
chore: scaffold Astro + TypeScript static project

- Initialize Astro with TS strict, ESLint, and Prettier
- Configure site URL and static output
- Add placeholder homepage and standard ignore/version files
```
