# BugTrail brand files

The mark is a tiny Trail: four stations on a line and one loop back, the product's own picture of a bug going Reported → Ongoing → Resolved, failing once, and passing.

The files live in **`public/assets/`**, so the running app also serves them as static files (e.g. `https://<web-app>/assets/bugtrail-logo.svg`). They are **generated**: don't edit them by hand. Change `scripts/brand/build-icons.mjs` and run `npm run brand:icons`.

| File (`public/assets/`)   | URL                               | Use it for                                                                        |
| ------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| `bugtrail-logo.svg`       | `/assets/bugtrail-logo.svg`       | The full logo (mark + name) on light backgrounds: docs, slides, emails            |
| `bugtrail-logo-light.svg` | `/assets/bugtrail-logo-light.svg` | The full logo on dark backgrounds                                                 |
| `bugtrail-mark.svg`       | `/assets/bugtrail-mark.svg`       | The mark alone, where the name is already next to it                              |
| `bugtrail-mark-light.svg` | `/assets/bugtrail-mark-light.svg` | The mark alone on dark backgrounds                                                |
| `bugtrail-icon.svg`       | `/assets/bugtrail-icon.svg`       | The square app icon (ink tile): avatars, Slack, anywhere a square image is needed |
| `bugtrail-icon-512.png`   | `/assets/bugtrail-icon-512.png`   | The same icon as a PNG, for tools that don't take SVG                             |

The wordmark is converted to outlines, so the logo looks right without Instrument Sans installed. The SVGs open in Figma if the mark ever needs redesigning.

**Colours:** ink `#1d1e1c` and paper `#efeeea` (the light theme's text and page colours); `#e8e7e1` for the mark on dark backgrounds. The logo stays ink and paper: the status colours (Reported, Ongoing, …) mean something in the product, so they never go into the logo.

**In the app:** the sidebar logo is inline code (`src/components/shared/logo.tsx`) so it follows light and dark mode. The browser-tab icon is `src/app/icon.svg`, with `src/app/favicon.ico` (16/32/48 px; the 16px frame has solid stations so it stays sharp) and `src/app/apple-icon.png` (180 px, iPhone home screen). Next.js adds their `<link>` tags automatically.

The font is Instrument Sans SemiBold (SIL Open Font License, `scripts/brand/fonts/OFL.txt`).
