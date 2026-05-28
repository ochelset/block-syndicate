# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use `pnpm` as the package manager.

```bash
pnpm dev          # start dev server (Vite HMR)
pnpm build        # type-check + production build
pnpm check        # Biome CI lint/format + test:run — all generated code must pass this
pnpm lint         # Biome lint
pnpm format       # Biome format (writes in place)
pnpm test         # Vitest watch mode
pnpm test:run     # Vitest single run
```

## Architecture

**Stack**: React 19, TypeScript, Vite. No router — navigation is handled via state.

**App state** (`src/types.ts`): `Screen` (`'start' | 'game'`) and `Modal` (`null | 'settings' | 'inventory'`) are the two top-level state dimensions. `App.tsx` owns both and passes callbacks down. Add new modal values to the `Modal` union in `types.ts` as features are built.

**Screen flow**: `App.tsx` renders either `<StartScreen>` or `<Layout>` depending on `screen` state. Modals render on top of `<Layout>`.

**Component structure**:
- `src/components/` — shared UI: `header/`, `layout/`, `logo/`. All use CSS Modules (`.module.css`).
- `src/features/` — feature modules, one folder per feature (e.g. `start/`).

**Linting/Formatting**: Biome (not ESLint). Single quotes for JS, double quotes for JSX, semicolons required, trailing commas, space indentation. Imports are auto-organized by Biome assist.

**Planned**: `src/api/` (excluded from Biome lint in biome.json) for API client code. Mapbox GL JS will be added to the game screen as a full-screen canvas inside `<main>` in `Layout`.
