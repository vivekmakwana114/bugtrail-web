'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ROLE_LABELS } from '@/config/roles';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import type { RoleKey } from '@/types/api';
import type { UserListFilters, UserStatus } from './types';

export type UsersTab = 'pending' | 'all';

const isRole = (value: string | null): value is RoleKey => value !== null && value in ROLE_LABELS;
const FILTER_STATUSES: UserStatus[] = ['active', 'suspended', 'rejected'];
const isFilterStatus = (value: string | null): value is UserStatus =>
  FILTER_STATUSES.includes(value as UserStatus);

/**
 * ?status=pending is the approval queue tab (the "waiting for approval" notification links
 * there). Any other ?status, ?role and ?q filter the All users tab.
 */
export function useUsersUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tab: UsersTab = params.get('status') === 'pending' ? 'pending' : 'all';
  const roleParam = params.get('role');
  const statusParam = params.get('status');
  const filters: UserListFilters = {
    search: params.get('q') ?? undefined,
    role: isRole(roleParam) ? roleParam : undefined,
    status: isFilterStatus(statusParam) ? statusParam : undefined,
  };

  const replace = (query: URLSearchParams) => {
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setTab = (next: UsersTab) => {
    // Filters belong to the All tab; switching starts each tab clean.
    setSearchInput('');
    replace(new URLSearchParams(next === 'pending' ? { status: 'pending' } : {}));
  };

  const update = (next: Partial<UserListFilters>) => {
    const query = new URLSearchParams(params.toString());
    const set = (key: string, value: string | undefined) =>
      value ? query.set(key, value) : query.delete(key);
    if ('search' in next) set('q', next.search?.trim());
    if ('role' in next) set('role', next.role);
    if ('status' in next) set('status', next.status);
    replace(query);
  };

  // The search box updates the URL once typing pauses, not on every key.
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const syncSearch = useEffectEvent((value: string) => {
    if (tab === 'all' && value !== (filters.search ?? '')) update({ search: value });
  });
  useEffect(() => syncSearch(debouncedSearch), [debouncedSearch]);

  const clearAll = () => {
    setSearchInput('');
    replace(new URLSearchParams());
  };
  const isFiltered = !!filters.search || !!filters.role || !!filters.status;

  return { tab, setTab, filters, update, searchInput, setSearchInput, clearAll, isFiltered };
}
