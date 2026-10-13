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

## Added with the report-bug form

### 14. Offer only what the API will accept

The API refuses a new bug in any status but Reported unless you hold `bug:set_any_status`, refuses new bugs in archived projects, and only emails the assignee. The form mirrors each rule instead of letting the request fail: the Status picker only renders for QA and Admin, the Report bug button (and `c`) disappear on archived projects and for roles without `bug:create`, and "Email the assignee" stays disabled until someone is assigned. The API still checks everything; the UI just never offers a choice it knows will be refused.

### 15. Variable-length fields with `useFieldArray`

Drive links are a list the user grows and shrinks. `useFieldArray` gives each row a stable `id` for React's `key` (never the index, or removing row 1 would shift row 2's typed text into it), registers fields as `attachments.0.url`, and maps zod's per-row errors back to the right row. `append(..., { shouldFocus: true })` puts the cursor in the new row.

### 16. `<datalist>` before a custom combobox

The module field is free text with suggestions: pick an existing module or type a new one. The browser's `<datalist>` does exactly that with zero JavaScript and full keyboard and screen-reader support. A custom combobox would look more on-brand but needs focus management, filtering and ARIA wiring. Revisit if the suggestion list ever needs rich rows (counts, icons).

### 17. Screenshots catch what assertions don't

All 30 checks passed while the Assignee select sat 10px lower than the Module input beside it: the Module field has a hint, the two-column grid stretched both fields to the same height, and a stretched CSS grid spreads the extra space between its rows. `content-start` on `Field` keeps every field packed to the top. Look at the screen, not only at the test output.

## Added with the bug page

### 18. The server decides what's allowed; the client decides how it looks

`allowedStatuses` comes from the API's transition table, per viewer: a developer who isn't the assignee gets `[]`, QA gets every status. The page never recomputes those rules. It only has a small presentation map (`NEXT_STEPS` in `status-control.tsx`) that picks which allowed moves deserve a button ("Start work", "Pass", "Fail") and which go under "More". If the rules change on the server, the page follows without a deploy. When there are no moves, the page says why in workflow terms ("Waiting for QA to pass or fail it") instead of showing disabled buttons.

### 19. A refused change usually means the page is stale

Status and assignee changes are conditional updates on the server: if the bug changed since you loaded it, you get 409, or 400 "already resolved", or 403 "you can't move it from X". All three mean "what you see is out of date", so every failed bug mutation refetches the bug (`refetchBug` in `hooks.ts`). The toast explains, and the page is already showing the truth by the time you read it.

### 20. One mutation hook, three endpoints

Status, assign and edit hit different endpoints but share what happens after: put the returned bug in the cache (no refetch needed), then invalidate the timeline, the grid rows and the project's counts. `useBugMutation(bug, request)` holds that once; the three hooks are one line each. Same result, and a fourth change type later can't forget a cache key.

### 21. Dialogs that open from state never see "open"

Radix calls `onOpenChange` when the user closes a dialog, not when the parent opens it with `setDialog('edit')`. So "reset the form when it opens" code in `onOpenChange(true)` never runs. Two patterns instead: the edit form uses RHF's `values` option to follow the bug (keeping what the user has typed), and the assign dialog keeps only "what you picked" in state and falls back to the current assignee.

### 22. Don't remove a query that a mounted page is watching

After a delete, `removeQueries` on the bug made the still-mounted bug page fetch it again at once, a pointless 404. `invalidateQueries({ refetchType: 'none' })` marks it stale without fetching; if the user goes Back, it refetches then and shows "isn't available".

## Added with live chat

### 23. Sockets push, REST changes

The socket never changes data. Sending, editing and deleting a message, moving a bug: all REST calls, validated and permission-checked like any other. The server then broadcasts what happened, and the page writes it into the TanStack Query cache (`useBugRoom`). One write path means one place for validation and permissions, and a client that can't open a socket still works: it just learns about changes later (the bell falls back to polling every 60s while disconnected).

### 24. The same message arrives twice; make that harmless

When you send a message, you get it back in the POST response and again as the room broadcast. Both go through `upsertMessage`, which replaces by id or appends. Idempotent updates are simpler than trying to suppress one of the two, and they also cover the reverse order (broadcast first, response second).

### 25. Reconnecting is a gap, not a pause

Socket.IO reconnects by itself, but rooms don't survive a dropped connection and anything broadcast in between is gone. So `useBugRoom` rejoins on every `connect`, and after a successful *re*join it refetches the bug, timeline and chat. The test for this restarts the API mid-session, posts a message before the browser is back, and checks it appears. The handshake token is a function (`auth: (send) => send({ token })`) so a reconnect half an hour later sends the current token, not the expired one from when the tab opened.

### 26. Keeping the reader's place in a chat

Three cases, decided in one `useLayoutEffect` after each render, before the browser paints: first load jumps to the bottom; older messages added on top shift `scrollTop` by exactly the height they added (what you were reading doesn't move); a new message at the bottom follows it only if you were already near the bottom or sent it, and otherwise shows a "New messages" pill. `useLayoutEffect` (not `useEffect`) so the user never sees the jump-then-correct flicker.

### 27. Screen readers and live lists

`aria-live` on the whole message list would read 30 messages aloud every time older ones load. Instead a visually hidden `role="status"` line holds only the newest message from someone else, so the announcement is exactly "New message from Riya Shah: …". (It also tripped a test: the same text existed twice on the page. Scope test selectors to the region you mean.)

## Added with the dashboard

### 28. Query keys must be stable; round time to the day

"Last 7 days" as `now − 7×24h` changes every millisecond, so each render would build a new query key and fire a new request, forever. `rangeStart()` rounds to local midnight, which is also what people mean by "the last 7 days": today and the six before it. Sending a full ISO date-time (with the user's offset baked in) also sidesteps the API's rule that date-only values are UTC days.

### 29. Five bars don't need a chart library

Bugs by status is five numbers. Plain `div`s scaled to the largest count, in the status colour tokens, give the same picture with no dependency, full theme support (dark mode included) and real text a screen reader can read ("Failed 1 (13%)"). Reach for a chart library when you need axes, time series or interaction.

### 30. Grid items don't shrink below their content by default

On a phone the page scrolled sideways by 492px even though every table sits in an `overflow-x-auto` frame. Grid and flex items default to `min-width: auto`, so the section around a 720px-wide table grew to 720px instead of letting the table scroll inside it. `min-w-0` on the section (and its content wrapper) restores the expected behaviour. When something overflows, look up the tree for the first grid/flex item without `min-w-0`.

### 31. Test against the API, not against remembered numbers

The dashboard test doesn't hard-code "5 open bugs". For each view it asks the API the same question (`/dashboard/summary?from=…`) and compares. Seed data can change and the test still means something: "the screen shows what the server says".

### 32. Lay out by what each block is for

The first layout put Longest-running tickets in the narrow right column, and Age, the column the block exists for, was clipped. Compact blocks (status bars, developer numbers) share a row; the list that needs width gets the full width. A layout is right when nothing important needs a sideways scroll at common widths.

## Added with the users screen

### 33. When the API is the bottleneck, fix the API

`GET /users?name=` was an exact match, so a search box on top of it would only find "Riya Shah" typed in full. Filtering 50 rows in the browser would have hidden the problem until the 51st user. Instead the API gained `search` (part of the name or email, case-insensitive, input escaped so "(" is searched literally) and list rows gained `createdAt` / `lastLoginAt`. A small API PR beats a clever client workaround.

### 34. One ConfirmDialog for every "are you sure?"

Reject, suspend, reactivate, delete user and delete bug all ask the same thing. `ConfirmDialog` takes a question, a plain-words description (including whether it can be undone) and an async `onConfirm`. It disables its buttons while running and, when the API refuses ("This user has reported or been assigned bugs. Suspend them instead."), shows that reason in the dialog instead of a toast that disappears. The bug page's delete dialog now uses it too.

### 35. An `sr-only` label can push the whole page sideways

On a phone the users page scrolled sideways by 303px although the table sits in an `overflow-x-auto` frame. The culprit was the 1px screen-reader label in the empty "Actions" header: `sr-only` is `position: absolute`, the frame wasn't positioned, so the label was placed against the page (at the table's far edge, 693px) and the frame's overflow didn't clip it. `relative` on the shared Table frame fixes it for every table. The first guess (`min-w-0`) didn't change the number, so it was reverted: keep only fixes you've measured.

### 36. Features meet: live updates and delete

Deleting a bug broadcasts "deleted" to everyone viewing it, including you, and the page refetched the bug it had just deleted (two 404s). The delete mutation now has a `mutationKey`; the live handler checks the mutation cache, ignores your own delete, and for anyone else's shows "CHK-6 was deleted by someone else" and goes back to the project. Rerun older end-to-end tests after adding cross-cutting behaviour like live updates: one old "stale page" test also had to change, because the page no longer stays stale.

## Added with the roles screen

### 37. Data that only changes on deploy: `staleTime: Infinity`

The role catalog is code in the API (`src/config/roles.js`), so it can't change while the app is open; a deploy reloads the app anyway. `useAccessCatalog` sets `staleTime: Infinity`: one request per session, none on refocus or when you come back to the page (the test counts requests to prove it). Pick `staleTime` by asking "how often can this really change?", not by habit. The same reasoning is why the screen reads labels from `GET /roles` instead of the web's `ROLE_DESCRIPTIONS`: the server is the one place they're defined, so the screen can't drift from what the API enforces.

### 38. A matrix is a table with two kinds of header

Each permission row starts with `<th scope="row">`, each role column with `<th scope="col">`, and each group gets its own `<tbody>` headed by `<th scope="rowgroup">`. With that, a screen reader announces a cell as "Assign bugs, QA, Yes" (the hidden Yes/No is the cell's text; the tick and dash are `aria-hidden` decoration). On a phone the permission column is `sticky left-0` with a solid background, so the roles scroll under it inside the table frame. The group label sits in a full-width cell, so the label itself (a `span`) is the sticky part.

### 39. Hiding a screen isn't protecting it

`GET /roles` is open to any signed-in user: it's labels, not data. The screen is shown only to roles with `user:read` because it's for the people who assign roles. A developer who types `/roles` gets the no-access state and the query is `enabled: false`, so nothing is fetched. That's a UI choice, not security; anything actually secret is guarded by the API, never by hiding a page.

## Added with the notifications page

### 40. One row component, two places

The bell and the page both show a notification. Copying the bell's markup into the page would have worked on day one and drifted by day ten (a new "unread" style in one, not the other). `NotificationItem` now owns the row: the dot, bold title, the hidden "(unread)" and a `<time>` with the exact date in its tooltip. The page adds a "Mark read" button through an `action` slot that sits _beside_ the row's own button, because a button inside a button is invalid HTML and breaks keyboard and screen-reader use.

### 41. Live updates for free when the keys are shaped right

The socket provider already invalidates `notificationKeys.all` when `notification:new` arrives. The page's list key is `['notifications', 'list', { unreadOnly }]`, which starts with that prefix, so a new notification refreshes the open page with no new socket code. The test proves it: an Admin adds the user to a project through the API, and the row appears under Today within a second. Designing query keys as a tree (`all` → `list` → filters) is what makes "refresh everything about notifications" one line.

### 42. Group by the reader's day, and keep groups whole across pages

"Today" means the user's calendar day, not UTC, so `groupByDay` works from local midnight. It walks the newest-first list and starts a new group only when the day changes, so when "Show more" loads the rest of Monday, those rows join Monday's group instead of starting a second "Monday". Labels go from specific to general as they age: Today, Yesterday, a weekday within the week, then "Mon 5 Oct", with the year added only when it isn't this year.

### 43. Reading width for reading screens

The ticket grid and the users table use the full width because they have columns. Notifications are sentences: across 1,100px the eye travels too far from the end of one line to the start of the next. `max-w-3xl` on the page keeps lines readable, and the header's action stays aligned with the list's right edge. Choose width by what the content is, not by how wide the screen is.

## Added with the profile page

### 44. Changing a password replaces the session's tokens

`POST /auth/change-password` deletes every refresh token you have (that's what signs out your other devices) and returns a new pair: the access token in the body, the refresh token as a new cookie. `changePassword()` stores the new access token right away; keeping the old one would work only until it expires and then fail on the next refresh. The test checks both sides: this tab keeps loading data and survives a reload, and a second browser signed in before the change is sent to sign in on its next reload.

### 45. Pin the error to the field it's about

"Current password is incorrect" comes from the API as a 400. Shown as a banner, it makes you work out which of three password fields is wrong. `setError('currentPassword', …, { shouldFocus: true })` puts it under that field and moves the cursor there. Rules the browser can check (new ≠ current, confirmation matches) are in the Zod schema, so they appear before any request.

### 46. User-supplied images break; plan the fallback

A picture link can point to a deleted file or to a Google Drive _share page_, which is HTML, not an image. `Avatar` now remembers which URL failed (`onError`) and shows initials instead of a broken-image icon. That's on every avatar in the app, not just the profile preview. It stores the failed URL rather than a "failed" flag, so pasting a new link gets a fresh try. The preview's hint says what initials mean in each case, and the field hint warns about Drive links before anyone tries one.

### 47. After editing yourself, refresh what shows you

Your name is in the top bar (the session user) and inside cached lists (members, users, bugs, chat). Saving calls `reloadUser()` for the first and `invalidateQueries()` for the rest. A broad invalidation is normally a smell, but profile edits are rare and you can appear almost anywhere. Tracking every query that includes a user would be more code for no visible gain. Only queries on screen refetch; the rest are just marked stale.

### 48. `useWatch`, not `watch()`, with the React Compiler

The live preview needs the current name and link as you type. `watch()` from react-hook-form reads the form's internal state in a way the React Compiler can't safely memoise, so lint warns and the compiler skips the component. `useWatch({ control, name })` subscribes properly, the same as the report-bug dialog. When lint says "Compilation Skipped", fix the cause instead of silencing it.

## Added with the role-based landing page

### 49. One rule for "home", and only the browser can apply it

Admins and Project Managers land on the dashboard; Developers and QA on their projects. That rule lives in one function, `homePathFor(role)`, used by the three places that mean "home": the redirect after sign-in (`RedirectIfAuthenticated`, still the only place that navigates after sign-in), `/`, and the logo. `routes.home` was deleted rather than kept as a fallback, so nothing can quietly link to the old fixed page.

`/` used to be a server `redirect()`. The server can't know your role: the session lives in the browser (the refresh cookie belongs to the API's domain). So `/` now renders `GoToHome`, which waits for the session check like the other guards and then replaces the URL. A `?next=` link still wins over the role's home, because the page someone was heading for matters more than the default. The test signs in as all four roles and checks the landing page, the logo, `/` and a reload for each.
