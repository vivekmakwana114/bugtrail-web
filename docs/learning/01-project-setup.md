# 01: Project setup (Phase 0, frontend)

## What we did

| Change                                                                           | Why                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Deleted the whole Kooji codebase and re-scaffolded with `create-next-app@16.4.0` | Kooji was a marketing site (hero video, vendor listings, i18n, `localStorage` tokens, Vercel auto-deploy). A panel has different bones. Editing it down would leave subtle leftovers. The old code is still in Git history if ever needed. |
| **Next.js 16** instead of the 15 in the plan                                     | 16.4 is the current stable. Starting a new project one major behind means an upgrade before the first release.                                                                                                                             |
| Kept the scaffold's `cacheComponents` / `partialPrefetching` config              | These are Next 16's caching and prefetch model. We don't change framework defaults we haven't measured.                                                                                                                                    |
| `typecheck` = `next typegen && tsc --noEmit`                                     | Next 16 generates **global route types** (e.g. `LayoutProps<'/'>`) into `.next/types`. On a fresh clone (CI) they don't exist yet, so plain `tsc` fails.                                                                                   |
| Prettier + `eslint-config-prettier` (last in the ESLint config)                  | ESLint checks code quality and Prettier owns formatting. The prettier config switches off ESLint style rules that would fight it.                                                                                                          |
| `.gitattributes` with `eol=lf`                                                   | Your Git converts LF↔CRLF on Windows. Pinning LF in the repo keeps diffs clean across Windows, Linux CI, and the VPS.                                                                                                                      |
| `.env.example` with `NEXT_PUBLIC_API_URL`                                        | Documents config. Only variables prefixed `NEXT_PUBLIC_` are exposed to browser code, so **never** put secrets in them.                                                                                                                    |
| `CLAUDE.md` + Next's generated `AGENTS.md`                                       | Encodes our rules for AI-assisted work ("encode your standards into the machine"). The Phase 7 design system is added here too.                                                                                                            |
| No UI libraries yet                                                              | shadcn/TanStack/Recharts arrive in Phase 7 **with** the design tokens. Installing a UI kit before a design direction exists is how apps end up looking like every other AI dashboard.                                                      |

## Concepts worth knowing

### Server vs client components (App Router)

In the App Router every component is a **Server Component** by default. It renders on the server and ships no JS for itself. Add `'use client'` only where you need state, effects, or browser APIs (forms, the chat, sockets). Our panel will be mostly client-heavy (live data), but layouts and static shells stay server-side.

### `NEXT_PUBLIC_*` is baked in at build time

`NEXT_PUBLIC_API_URL` is inlined into the JS bundle during `next build`. Changing it on Railway/VPS means **rebuilding**, not just restarting.

## Try it yourself

1. `npm run dev` and open http://localhost:3000. That's the placeholder page.
2. Delete `.next/`, run `npx tsc --noEmit` directly, and see the `LayoutProps` error. Then run `npm run typecheck`.
3. Open `node_modules/next/dist/docs/` and skim the folder list. That's the version-matched documentation we'll use in Phase 7.
