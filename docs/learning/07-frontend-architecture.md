# 07: Frontend architecture and sign-in (Phase 7, frontend)

## What we did

| Change                                                              | Why                                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/lib/api-client.ts`: one axios instance, access token in memory | One place for the base URL, auth header, errors and silent refresh.                   |
| Silent refresh on 401, one shared request                           | Sessions last 30 days without anyone seeing a 401. See concept 2.                     |
| `AuthProvider` restores the session on load                         | The access token dies with the tab; the httpOnly cookie brings it back.               |
| `RequireAuth` / `RedirectIfAuthenticated` guards                    | Signed-out users can't see the panel; signed-in users skip the login page.            |
| `safeNextPath()` for `?next=`                                       | Without it, `/login?next=//evil.com` would send people to another site after sign-in. |
| zod schemas mirroring the API's Joi rules, react-hook-form          | Mistakes show before a round trip, and the API still validates everything.            |
| TanStack Query provider (no retries on 4xx)                         | Ready for the data screens; a 403 or 404 doesn't get retried pointlessly.             |
| `features/auth/` (api, schemas, types, components)                  | Each feature keeps its calls, rules and UI together.                                  |

## The flow: opening the app in a new tab

```
GET /projects  (HTML is static: the server knows nothing about the session)
   │
AuthProvider mounts → status: loading → <Logo/> placeholder
   │
POST /v1/auth/refresh-tokens   (browser sends the httpOnly refreshToken cookie)
   ├─ 200 → access token kept in memory → GET /v1/auth/me → status: authenticated → page renders
   └─ 401 → status: anonymous → RequireAuth → /login?next=%2Fprojects
                                   │
                    sign in → signIn(user) → RedirectIfAuthenticated → safeNextPath(next)
```

## Concepts worth knowing

### 1. Where the tokens live, and why

| Token        | Lives in                            | Lifetime   | XSS can read it?            |
| ------------ | ----------------------------------- | ---------- | --------------------------- |
| Access (JWT) | a JS variable in `api-client.ts`    | 30 minutes | only while the page is open |
| Refresh      | an httpOnly cookie, `Path=/v1/auth` | 30 days    | **no**                      |

`localStorage` would be simpler and worse: any injected script could copy a token that works for 30 days from anywhere. The cost of our way is one refresh call on every page load.

### 2. Silent refresh without a stampede

When the access token expires, several requests can fail with 401 at once. If each one refreshed on its own, the first would rotate the refresh cookie and the others would present the old one and fail, logging the user out. So `refreshAccessToken()` keeps one in-flight promise and every caller waits on it. React's StrictMode runs effects twice in development, which is the same race in miniature. The single shared promise handles that too.

### 3. Guards protect the UI, the API protects the data

The Next server can't see the session (the cookie belongs to the API's address, `Path=/v1/auth`), so guards run in the browser after the session check. That's fine: hiding the panel is only about experience. Every API request is checked independently, so someone who bypasses the guard sees empty screens and 401s, not data.

### 4. Never trust a redirect target

`?next=` comes from the URL, so anyone can craft it. `//evil.com` looks like a path but is a protocol-relative URL to another site, and `javascript:...` would run code. `safeNextPath()` accepts only same-site paths. The Next docs warn about the same thing for `router.push`.

### 5. Don't leak who has an account

- Wrong password and unknown email get the same message.
- Forgot-password always says "if this email has an account".
- Only once the password is right does the API say the account is pending or suspended. Knowing the password proves it's yours.

### 6. Suspense around URL reads

`useSearchParams()` makes a component depend on the request URL, which a prerendered (static) page doesn't have at build time. Wrapping it in `<Suspense>` lets Next prerender everything else and fill that part in the browser. Without it, the production build fails.

## Try it yourself

1. Run the API and the web app, sign in, then open DevTools → Application → Cookies: find `refreshToken` and notice it's `HttpOnly`. In the console, `document.cookie` doesn't show it.
2. Reload the page and watch the Network tab: `refresh-tokens` then `me`, then the page.
3. Visit `/login?next=//example.com` and sign in. Where do you land, and which function decided that?
4. **Exercise:** open the app in two tabs and leave them for over 30 minutes, then click around in both. Both refresh at about the same time with the same cookie. What happens to the second tab, and how could a `BroadcastChannel` let tabs share one refresh? (This is a known gap, noted for later.)

## Added with the panel layout and projects grid

### 7. Filters belong in the URL

The projects grid keeps its status and search in the address (`?status=completed&q=chk`). Refresh, the Back button and a pasted link all show the same view, and nothing needs to be stored. The cost is that the component reads `useSearchParams()`, so it sits inside `<Suspense>` (concept 6).

### 8. Infinite lists without page jumps

`useInfiniteQuery` loads 24 cards at a time behind "Show more projects", and `placeholderData: keepPreviousData` keeps the old cards on screen while a new filter loads. Without it, every keystroke in the search box would flash the grid to a skeleton.

### 9. Why panel pages say `instant = false`

Next 16 checks in development that every page can render on the server for "instant" navigations. Our panel pages only render after the browser has restored the session (the cookie isn't visible to the Next server), so that check can never see them and warns. `export const instant = false` on the panel layout and each panel page tells Next this is deliberate. Navigation inside the panel is client-side, so it stays fast.

### 10. Empty states must be true

The first version told a developer with no projects "No active projects", and could have told someone with only finished projects "You're not on any project", which was wrong for both. The default view only knows there are no **active** projects, so it now says exactly that and offers "Show all projects". Write empty states from what the query actually proves.

## Added with the ticket grid

### 11. When not to add a library

The plan listed TanStack Table for the grid. Sorting, filtering and paging all happen on the server, so a headless table library would only have mapped columns to cells. A typed `Column[]` list (`ticket-grid.tsx`) does that in a few lines, with no new dependency to learn and upgrade. Add a library when it does real work; reach for it again if the grid ever sorts or groups in the browser.

### 12. Keyboard shortcuts that don't fight the user

`useGridKeyboard` listens on `document` but ignores keys while you're typing (inputs, textareas), inside menus and dialogs, or holding Ctrl/Cmd/Alt. `useEffectEvent` lets the listener read the latest row count without being re-attached on every render. Try typing "j" in the search box: it types, it doesn't move the cursor.

### 13. A real bug the screen found in the API

Filtering by **Unassigned** made the API answer 500. The cause was one line in `bug.service.js`: `{ me: id, none: null }[assignee] ?? new ObjectId(assignee)`. `??` treats `null` as missing, so "none" fell through to `new ObjectId('none')`, which throws. Lookup tables that can legitimately hold `null` don't mix with `??`; explicit branches don't have that trap.
