import { accessTokenStore, api } from '@/lib/api-client';
import type { LoginResponse, RegisterResponse, SessionUser } from './types';

/* One function per endpoint. Components call these through hooks, never axios directly. */

export async function login(input: { email: string; password: string }): Promise<SessionUser> {
  const { data } = await api.post<LoginResponse>('/auth/login', input);
  accessTokenStore.set(data.tokens.access.token); // the refresh token arrives as an httpOnly cookie
  return data.user;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', input);
  return data;
}

export async function getMe(): Promise<SessionUser> {
  const { data } = await api.get<{ user: SessionUser }>('/auth/me');
  return data.user;
}

/** Ends this session on the server (revokes the refresh cookie). Safe to call when signed out. */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    accessTokenStore.set(null);
  }
}

/** Always succeeds (204), whether or not the email has an account: no account probing. */
export async function forgotPassword(input: { email: string }): Promise<void> {
  await api.post('/auth/forgot-password', input);
}

export async function resetPassword(input: { token: string; password: string }): Promise<void> {
  await api.post(
    '/auth/reset-password',
    { password: input.password },
    { params: { token: input.token } },
  );
}

/**
 * Signed in, knowing the current password. The API revokes every refresh token (signing out
 * your other devices) and issues a new pair for this session: the access token here, the
 * refresh token as a new cookie. Keep using the old access token and the next call fails.
 */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const { data } = await api.post<Pick<LoginResponse, 'tokens'>>('/auth/change-password', input);
  accessTokenStore.set(data.tokens.access.token);
}
