# BugTrail design system

**Point of view: a calm instrument for triage.** People live in BugTrail all day. It should feel quiet, dense and precise. Approved style tile: 2026-10-12. Living reference: run `npm run dev` and open **`/design`** (development only).

## Where things live

| What                                                                  | Where                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Tokens (colours, type scale, radii, shadows)                          | `src/app/globals.css`, the only place a colour value may be written |
| Primitives (button, input, dialog, menu, select, table...)            | `src/components/ui/`                                                |
| Domain pieces (status glyph/badge, ring, Trail, project card, states) | `src/components/shared/`                                            |
| Page templates                                                        | `src/components/templates/` (ListPage, DetailPage, FormDialog)      |
| Status labels, order, colour classes, trouble threshold               | `src/config/statuses.ts`                                            |
| Theme (light / dark / system)                                         | `src/components/theme/`                                             |

## Colour

Colour means something, or it isn't used.

| Token class                                          | Role                                                |
| ---------------------------------------------------- | --------------------------------------------------- |
| `bg-bg`                                              | page ground                                         |
| `bg-surface`                                         | panels, rows, inputs                                |
| `bg-sunken`                                          | wells, avatars, the card's chart box                |
| `border-line` / `border-line-strong`                 | hairlines / input borders and hover                 |
| `text-ink` / `text-ink-2` / `text-ink-3`             | text / secondary / meta and captions                |
| `text-reported` `ongoing` `resolved` `pass` `failed` | the five statuses, nothing else                     |
| `text-danger`                                        | destructive actions and errors (same hue as failed) |

- **No brand colour.** The primary button is ink.
- Tints are opacity on a token: `bg-failed/10`, `border-danger/40`, `bg-ink/6`.
- Tailwind's stock palette is switched off: `bg-red-500` doesn't exist, and ESLint flags it.

## Status

Status is shown as **colour + glyph**, never colour alone. Use `<StatusBadge status="...">` in lists and `<StatusGlyph>` next to a label.

| Status   | Glyph             | Meaning                         |
| -------- | ----------------- | ------------------------------- |
| Reported | empty circle      | logged, nobody has picked it up |
| Ongoing  | half circle       | a developer is working on it    |
| Resolved | circle with a dot | fixed, waiting for QA           |
| Pass     | check             | verified; the clock stops       |
| Failed   | loop-back arrow   | QA sent it back (+1 fail)       |

## Type

- **Instrument Sans** (`font-sans`) for everything people read.
- **IBM Plex Mono** (`font-mono`) for anything a machine produces: keys `CHK-142`, durations `6d 4h`, timestamps, counts. Mono gets tabular numbers automatically.
- Scale (raised 2026-10-14 for readability): `text-xs` 13.5 · `text-sm` 14 · `text-md` 15 (body) · `text-lg` 17 · `text-xl` 20 (page title) · `text-2xl` 26 (at most once per screen) · `text-display` 48 (headline numbers only: dashboard tiles, project cards).
- Small-caps labels (dashboard tiles): `font-mono text-xs uppercase tracking-widest text-ink-3`.
- Hierarchy comes from size and weight, not from boxes.

## Shape and depth

- Radii: `rounded-sm` (3px) for controls and badges, `rounded-md` (5px) for panels, cards and dialogs. Nothing rounder, except `rounded-full` on status rings and dots (the project status flow, lifelines), spinners and the pill toggles (`<Segmented variant="pill">`: dashboard filters, projects status tabs).
- Separate with hairlines and spacing before reaching for a box.
- One shadow, `shadow-pop`, only for things that float (menus, dialogs, toasts). `shadow-cursor` marks the keyboard cursor row.

## Every screen

- Build lists with `ListPage` and records with `DetailPage`, so loading, error, no access and empty states can't be forgotten.
- **Loading:** a skeleton shaped like the content (rows, cards), never a spinner on a blank page.
- **Empty:** say what will appear and give the next action ("Report the first bug").
- **Error:** say what failed in plain words, with Retry.
- **No access:** say who can help ("Ask an Admin").
- Buttons are verbs ("Report bug", "Add members"), never "Submit" or "OK". One primary per view.
- Check it with real data before calling it done: 80-character titles, 0 and 500 rows, a fail count of 7, no avatar, both themes, keyboard only.

## Do / don't

| Do                                       | Don't                                                  |
| ---------------------------------------- | ------------------------------------------------------ |
| Token classes only                       | Hex values, `bg-red-500`, `text-[13px]`, `rounded-2xl` |
| Glyph + label for status                 | Colour alone for meaning                               |
| Mono for machine values                  | Mono for prose                                         |
| Hairlines and spacing                    | Gradients, glass, glow, decorative shadows             |
| A sentence and an action in empty states | Stock illustrations, emoji                             |
| Exact numbers next to charts             | A chart without its numbers                            |

## Signature pieces

- **The Trail** (`MiniTrail`, `TrailPath`): a ticket's life as a path. One loop per QA fail. Small in the grid, large on the bug page.
- **Project card** (`ProjectCard`): the Reported / Ongoing / Resolved ring with the open count in the middle and exact counts beside it. The trouble line (failing QA, or open longer than `TROUBLE_AGE_DAYS`) is the card's only accent.
- **Keyboard first** (coming with the grid): `j`/`k` move, `Enter` opens, `c` reports a bug, `⌘K` jumps anywhere.

## Guardrails

`npm run lint` fails on raw hex colours, arbitrary colour values, the stock palette, and arbitrary type/radius/shadow values in `src/`. Layout values (`lg:grid-cols-[minmax(0,1fr)_24rem]`, `80vh`) are allowed: they aren't design decisions. To add a colour, add a token to `globals.css` and to `src/lib/utils.ts` (so `cn()` knows it), then use its class.
