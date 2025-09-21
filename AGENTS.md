# Repository Guidelines

## Project Structure & Module Organization
- `src/` — Vite React app.
  - `src/SudokuMRVVisualizer.tsx` — main UI + MRV solver/step generator.
  - `src/App.tsx`, `src/main.tsx` — app entry.
- `index.html` — Vite HTML entry (Tailwind CDN for MVP styling).
- `docs/requirements.md` — product requirements and goals.

## Build, Test, and Development Commands
- Dev server: `pnpm dev` or `bun run dev` (Vite on `http://localhost:5173`).
- Build: `pnpm build` or `bun run build` (outputs to `dist/`).
- Preview: `pnpm preview` or `bun run preview`.
  - Install deps first: `pnpm install` or `bun install`.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; keep semicolons; prefer double quotes to match existing code.
- Naming: `PascalCase` for components, `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for constants.
- File types: prefer `.tsx` for typed components; pure helpers can live in `src/lib/solver.ts` when structuring a larger app.
- Formatting/Linting (recommended): Prettier + ESLint. Example scripts once configured: `npm run lint`, `npm run format`.

## Testing Guidelines
- Framework: Vitest or Jest.
- Scope: unit test the solver generator (selection, place/backtrack events) and a smoke test for the component.
- Naming: co-locate tests as `*.test.ts`/`*.test.tsx` next to source or under `tests/`.
- Commands (once configured): `npm test` for CI and local runs; aim to cover key branches in MRV selection and backtracking.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (e.g., `feat: add MRV step hints`, `fix: correct candidate count`). Keep changes focused and descriptive.
- PRs: include a summary, linked issues, and before/after screenshots or a short GIF for UI changes. Add/adjust tests for solver logic changes. Note any performance impacts.

## Security & Configuration Tips
- This is a client-side demo; do not commit secrets. Validate pasted boards (9 lines × 9 chars) and avoid dangerously setting HTML.
