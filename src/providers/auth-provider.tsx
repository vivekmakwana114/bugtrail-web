'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onSessionExpired, refreshAccessToken } from '@/lib/api-client';
import * as authApi from '@/features/auth/api';
import type { SessionUser } from '@/features/auth/types';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: SessionUser };

type AuthContextValue = AuthState & {
  /** After a successful login (the login call already stored the access token). */
  signIn: (user: SessionUser) => void;
  /** Ends the session on the server and here. */
  signOut: () => Promise<void>;
  /** Re-read the user, e.g. after editing your own profile. */
  reloadUser: () => Promise<void>;
  /**
   * What to SHOW. The API checks every request on its own, so hiding a button is a courtesy,
   * never the security.
   */
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * On page load the access token is gone (it only ever lived in memory), so we ask for a new one
 * with the httpOnly refresh cookie. If that works we're signed in; if not, anonymous.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });
  const queryClient = useQueryClient();

  const becomeAnonymous = useCallback(() => {
    setState({ status: 'anonymous', user: null });
    queryClient.clear(); // nothing from the previous session may linger in the cache
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await refreshAccessToken();
      if (!token) {
        if (!cancelled) setState({ status: 'anonymous', user: null });
        return;
      }
      try {
        const user = await authApi.getMe();
        if (!cancelled) setState({ status: 'authenticated', user });
      } catch {
        if (!cancelled) setState({ status: 'anonymous', user: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onSessionExpired(becomeAnonymous);
    return () => onSessionExpired(null);
  }, [becomeAnonymous]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn: (user) => setState({ status: 'authenticated', user }),
      signOut: async () => {
        try {
          await authApi.logout();
        } finally {
          becomeAnonymous();
        }
      },
      reloadUser: async () => {
        const user = await authApi.getMe();
        setState({ status: 'authenticated', user });
      },
      hasPermission: (permission) => state.user?.permissions.includes(permission) ?? false,
    }),
    [state, becomeAnonymous],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
