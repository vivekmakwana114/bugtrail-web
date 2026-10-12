@AGENTS.md

# BugTrail web: notes for AI-assisted work

- Product and architecture plan: `docs/PROJECT_PLAN.md`. Follow its decisions.
- This is **Next.js 16**. Check `node_modules/next/dist/docs/` before using any Next API from memory.
- Design rules live in `docs/design/DESIGN_SYSTEM.md`; tokens live in `src/app/globals.css`. Use token classes only (`bg-surface`, `text-ink-2`, `text-failed`). ESLint fails on raw colours, the stock Tailwind palette and arbitrary type/radius/shadow values. No generic "AI dashboard" patterns (see the plan's "no zombie UI" section).
- Build screens from the templates in `src/components/templates/` (ListPage, DetailPage, FormDialog) so every screen has loading, empty, error and no-access states. Check new components on `/design` in both themes.
- Conventions: components under 400 lines, single responsibility, strict types for props/state/API responses, shared logic in custom hooks, one function per action.
- The backend is the source of truth for permissions. UI gating (`<Can>`, `usePermission`) only controls what users see.
