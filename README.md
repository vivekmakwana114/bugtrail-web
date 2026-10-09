# BugTrail Web

Frontend for **BugTrail**, Invennico's internal bug reporting and QA tracking panel.

> Full product and architecture plan: [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md)
> Learning notes per build phase: [`docs/learning/`](docs/learning)
> API: `bugtrail-api` (runs on `http://localhost:5000/v1` in development)

## Status

**Phase 0: scaffold only.** The panel (auth, projects, ticket grid, bug detail + chat, dashboard) is built in Phase 7. Phase 7 starts with a design style tile for approval.

## Tech stack

| Concern      | Choice                             | Added in    |
| ------------ | ---------------------------------- | ----------- |
| Framework    | Next.js 16 (App Router) + React 19 | Phase 0     |
| Language     | TypeScript (strict)                | Phase 0     |
| Styling      | Tailwind CSS 4 + design tokens     | Phase 0 / 7 |
| Components   | shadcn/ui, restyled to our tokens  | Phase 7     |
| Server state | TanStack Query                     | Phase 7     |
| Tables       | TanStack Table                     | Phase 7     |
| Forms        | react-hook-form + zod              | Phase 7     |
| Charts       | Recharts                           | Phase 7     |
| Realtime     | socket.io-client                   | Phase 7     |

## Getting started

```bash
npm install
cp .env.example .env.local     # Command Prompt: copy .env.example .env.local
npm run dev                    # http://localhost:3000
```

## Scripts

| Script                            | What it does                                                    |
| --------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                     | Dev server (Turbopack)                                          |
| `npm run build` / `start`         | Production build / serve                                        |
| `npm run lint`                    | ESLint (Next core-web-vitals + TypeScript, Prettier-compatible) |
| `npm run typecheck`               | Generate Next route types, then `tsc --noEmit`                  |
| `npm run format` / `format:check` | Prettier                                                        |

## Code conventions

- **Components under 400 lines.** If a component grows past that, split it.
- **Single responsibility.** One component, one job. Prefer composition over large components.
- **Reusable and configurable** through props, with no hard-coded data inside shared components.
- **One function per action**, even small ones (e.g. `handleSubmit`, `handleStatusChange`).
- **Strict types everywhere:** props, state, API responses, and function signatures.
- **Shared logic goes in custom hooks.**
- **Design tokens only.** No raw hex colours or arbitrary Tailwind values outside the token file (Phase 7).
- Remove unused imports and `console.log`s before a PR, and keep PRs small and focused.

## Branching & releases

```
feature/* ──PR──► development ──PR──► main
                  (staging)           (production)
```

- **`main`**: production. Only receives merges from `development`. Never commit directly.
- **`development`**: staging. Feature branches merge here through a PR, with CI green.
- **Feature branches**: branch off `development`, named by type: `feature/bug-chat`, `fix/login-cookie`, `chore/ci-tests`.
- Releasing = open a PR `development → main`. Hotfixes branch off `main` as `hotfix/*`, merge into `main`, then back into `development`.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
