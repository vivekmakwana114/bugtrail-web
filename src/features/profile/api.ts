import { api } from '@/lib/api-client';
import type { SessionUser } from '@/features/auth/types';

/** Your own name and picture. Email and role aren't editable here: an Admin changes those. */
export async function updateMe(input: {
  name?: string;
  avatarUrl?: string | null;
}): Promise<SessionUser> {
  const { data } = await api.patch<SessionUser>('/users/me', input);
  return data;
}
