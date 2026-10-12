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
