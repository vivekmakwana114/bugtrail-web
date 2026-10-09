@AGENTS.md

# BugTrail web: notes for AI-assisted work

- Product and architecture plan: `docs/PROJECT_PLAN.md`. Follow its decisions.
- This is **Next.js 16**. Check `node_modules/next/dist/docs/` before using any Next API from memory.
- Design rules live in `docs/design/DESIGN_SYSTEM.md` (added in Phase 7). Use design tokens only. No raw colours, no generic "AI dashboard" patterns (see the plan's "no zombie UI" section).
- Conventions: components under 400 lines, single responsibility, strict types for props/state/API responses, shared logic in custom hooks, one function per action.
- The backend is the source of truth for permissions. UI gating (`<Can>`, `usePermission`) only controls what users see.
