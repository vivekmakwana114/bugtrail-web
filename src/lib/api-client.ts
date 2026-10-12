import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

/*
 * The one HTTP client for bugtrail-api.
 *
 *   access token  → kept in this module's memory only (never localStorage: an XSS could read it)
 *   refresh token → an httpOnly cookie the browser sends to /v1/auth/* (JS can't read it at all)
 *
 * On a 401 the client silently gets a new access token with the cookie and retries the request
 * once. If that fails too, the session is over and the AuthProvider sends the user to /login.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/v1';

let accessToken: string | null = null;

export const accessTokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
};

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send the refresh cookie (only /auth routes receive it)
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/* ------------------------------------------------------------------ silent refresh */

type RefreshResponse = { tokens: { access: { token: string; expires: string } } };

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Get a new access token using the refresh cookie. Concurrent callers share one request: the
 * API rotates the refresh token on every use, so two parallel refreshes would race and the
 * second would present an already-rotated cookie and fail (logging the user out).
 * @returns the new access token, or null when there's no valid session
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= axios
    // Plain axios, not `api`: a failing refresh must not trigger the 401 interceptor again.
    .post<RefreshResponse>(`${API_URL}/auth/refresh-tokens`, null, { withCredentials: true })
    .then(({ data }) => {
      accessToken = data.tokens.access.token;
      return accessToken;
    })
    .catch(() => {
      accessToken = null;
      return null;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

let sessionExpiredHandler: (() => void) | null = null;

/** The AuthProvider registers what happens when a session can't be renewed. */
export function onSessionExpired(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

// These answer 401 for reasons a refresh can't fix (wrong password, bad token).
const NO_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-tokens',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/change-password',
];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as RetriableConfig | undefined;
  const skip =
    !original || original._retried || NO_REFRESH.some((path) => original.url?.startsWith(path));
  if (error.response?.status !== 401 || skip) throw error;

  original._retried = true;
  const token = await refreshAccessToken();
  if (token) return api(original);
  sessionExpiredHandler?.();
  throw error;
});

/* ------------------------------------------------------------------ errors */

/** HTTP status of a failed request, or undefined when the server never answered. */
export function getErrorStatus(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

/**
 * A sentence to show the user. The API's own messages are written for people ("Email already
 * taken"), so they're used as-is; network problems and server errors get a plain explanation.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Try again.',
): string {
  if (error instanceof AxiosError) {
    if (!error.response)
      return "Can't reach the BugTrail server. Check your connection and try again.";
    if (error.response.status === 429)
      return 'Too many attempts. Wait a few minutes and try again.';
    if (error.response.status >= 500) return 'The server had a problem. Try again in a moment.';
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
