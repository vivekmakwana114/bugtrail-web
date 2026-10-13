# 08: Building a design system (Phase 7, frontend)

## What we did

| Change                                                                       | Why                                                                                                             |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Style tile approved before any screen                                        | Agreeing the look on one page is cheap; changing 20 finished screens isn't.                                     |
| Tokens in `globals.css` with Tailwind 4 `@theme`, stock palette switched off | A colour that isn't a token can't be used, so the design can't drift.                                           |
| Fonts with `next/font/google`                                                | Self-hosted at build time: no request to Google, no layout shift.                                               |
| Theme set by an inline `<head>` script, not next-themes                      | The Next 16 docs pattern: correct theme before the first paint, works with Cache Components, no dependency.     |
| Primitives written shadcn-style on Radix                                     | Radix gives keyboard and focus behaviour; we own every class. The shadcn CLI would have overwritten our tokens. |
| Templates: `ListPage`, `DetailPage`, `FormDialog`                            | A screen built from them can't forget its loading, empty, error or no-access state.                             |
| ESLint guardrail                                                             | Raw colours and off-scale values fail the build, which is cheaper than catching them in review.                 |
| `/design` preview route (dev only)                                           | Every component in its real states, in both themes, in one place.                                               |

## How the pieces connect

```
globals.css
  :root / [data-theme='dark']      --bt-ink, --bt-failed ...      (the values, per theme)
  @theme inline                    --color-ink: var(--bt-ink)      (Tailwind utilities → tokens)
        │
        ▼
  className="text-ink bg-failed/10"   ← Tailwind generates these from the @theme names
        │
cn() (tailwind-merge, taught our scale)   merges classes so later ones win
        │
ui/ primitives  →  shared/ domain pieces  →  templates/  →  screens
```

The `<head>` script picks `light` or `dark` before the first paint, then `[data-theme='dark']` swaps every token at once. Components never mention themes.

## Concepts worth knowing

### 1. Tokens are a contract, not a palette

A token names a **role** (`ink-2` = secondary text), not a colour (`gray-600`). When you design dark mode, you change what `ink-2` points to, and every screen follows. If components used `gray-600` directly, dark mode would be a search-and-replace across the whole app.

### 2. Make the wrong thing impossible, not just discouraged

`--color-*: initial` removes Tailwind's palette, so `bg-red-500` generates nothing. ESLint then fails on raw hex and arbitrary values. A rule in a document is a suggestion; a rule in the build is a guarantee. That's what "encode the standards" in the plan means.

### 3. Why the theme script runs before React

React renders on the server, which can't see the user's saved theme. If the theme were applied in `useEffect`, dark-mode users would see a flash of light. The inline script sets `data-theme` while the HTML is still being parsed, before anything is painted. `suppressHydrationWarning` on `<html>` tells React to accept that attribute. `useSyncExternalStore` then lets the toggle read the real preference without a hydration mismatch.

### 4. Templates over components

Components make screens _look_ consistent. Templates make them _behave_ consistently. `ListPage` takes one `state` value (`loading | error | forbidden | empty | ready`), so a screen can't render a table and an error at once, or skip the empty state. TypeScript checks the union for you.

### 5. Accessibility you get for free, and what you don't

Radix handles focus trapping in dialogs, arrow keys in menus, and ARIA roles. You still own:

- visible focus (`:focus-visible` in globals.css);
- names for icon buttons (`aria-label`);
- not relying on colour (the glyphs);
- writing `role="alert"` on errors.

### 6. One mark, two kinds of file (2026-10-13)

The sidebar logo is **inline SVG code** (`logo.tsx`): it uses `currentColor` and `var(--bt-bg)`, so it flips with light and dark mode for free. A favicon or a file you email can't use CSS variables, so those are **generated** by `npm run brand:icons` (`scripts/brand/build-icons.mjs`): the browser icons in `src/app/` (Next.js adds the `<link>` tags for `icon.svg`, `favicon.ico` and `apple-icon.png` by file name), and shareable files in `public/assets/` (served as static files at `/assets/...`; the guide is `docs/brand/README.md`). No design tool is needed, because the geometry already exists as code; a script makes it repeatable and deterministic.

Three lessons from the editing pass on the icon:

- **A favicon isn't the logo shrunk.** The 40×20 mark is too wide for a square, so the icon is a redraw on an ink tile with thicker strokes. The first version still had stations so big they touched and read as bubbles; it only worked once there was air between them.
- **Simplify the smallest size.** At 16px a 1px ring hole blurs into grey, so the 16px frame inside `favicon.ico` uses solid stations. Icon designers do this on purpose.
- **Transparent files need truly hollow shapes.** In the app the rings are "hollow" because they're filled with the page colour. On a transparent background that trick shows a line through each ring, so the files draw the line as segments that stop at each ring.

The wordmark in the logo files is converted to outlines (with `opentype.js`, a dev dependency used only by the script) so it looks right on machines without Instrument Sans.

## Try it yourself

1. `npm run dev`, open `/design`, and switch System / Light / Dark. Reload in dark: there's no flash of light first. Why?
2. In any component, write `className="text-red-500"`, then run `npm run lint`. Read the message, then undo it.
3. **Exercise:** add a token `--bt-warning` for a future "ageing" signal. Which three places do you touch (`globals.css` twice, `utils.ts`), and why does `cn()` need to know about it?
4. **Exercise:** build a tiny "Users" list on the `/design` page using `ListPage` with each `state.kind` in turn. Notice how little each state costs once the template exists.
