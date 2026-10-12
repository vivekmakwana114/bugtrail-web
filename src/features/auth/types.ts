import type { RoleKey } from '@/types/api';

export type UserStatus = 'pending' | 'active' | 'suspended' | 'rejected';

/** GET /auth/me and the login response: the signed-in user with what their role allows. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: RoleKey | null;
  status: UserStatus;
  avatarUrl: string | null;
  /** permission keys from the role, e.g. "bug:create" (the API is still the one that enforces them) */
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
};

export type LoginResponse = {
  user: SessionUser;
  tokens: { access: { token: string; expires: string } };
};

export type RegisterResponse = {
  user: { id: string; name: string; email: string; status: UserStatus };
  message: string;
};
