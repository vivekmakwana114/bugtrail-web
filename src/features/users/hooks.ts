'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { projectKeys } from '@/features/projects/hooks';
import * as usersApi from './api';
import type { UserListFilters } from './types';

export const USERS_PAGE_SIZE = 50;

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserListFilters) => [...userKeys.all, 'list', filters] as const,
  pendingCount: () => [...userKeys.all, 'pending-count'] as const,
};

export function useUserList(filters: UserListFilters) {
  return useInfiniteQuery({
    queryKey: userKeys.list(filters),
    queryFn: ({ pageParam }) => usersApi.getUsers(filters, pageParam, USERS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

/** The number on the "Waiting for approval" tab. */
export function usePendingCount() {
  return useQuery({
    queryKey: userKeys.pendingCount(),
    queryFn: async () => (await usersApi.getUsers({ status: 'pending' }, 1, 1)).totalResults,
  });
}

/**
 * Every user change can move someone between lists (pending → active), change the pending count,
 * and change what project member lists show (role, status), so all of those refetch.
 */
function useUserMutation<TInput>(request: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
      ]),
  });
}

export const useSetUserStatus = () =>
  useUserMutation((input: { userId: string } & Parameters<typeof usersApi.setUserStatus>[1]) =>
    usersApi.setUserStatus(input.userId, {
      status: input.status,
      role: input.role,
      designation: input.designation,
    }),
  );
export const useChangeUserRole = () =>
  useUserMutation(
    ({ userId, ...input }: { userId: string } & Parameters<typeof usersApi.changeUserRole>[1]) =>
      usersApi.changeUserRole(userId, input),
  );
export const useCreateUser = () => useUserMutation(usersApi.createUser);
export const useDeleteUser = () => useUserMutation(usersApi.deleteUser);
