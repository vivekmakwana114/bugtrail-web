'use client';

import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BUG_STATUSES } from '@/config/statuses';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import type { BugStatus } from '@/types/api';
import type { BugListFilters, BugSortField, SortDirection } from './types';

const SORT_FIELDS: BugSortField[] = ['bugNumber', 'failCount', 'age', 'updatedAt'];
const DEFAULT_SORT = { field: 'updatedAt', direction: 'desc' } as const;

function parseSort(value: string | null): BugListFilters['sort'] {
  const [field, direction] = (value ?? '').split(':');
  return SORT_FIELDS.includes(field as BugSortField) &&
    (direction === 'asc' || direction === 'desc')
    ? { field: field as BugSortField, direction }
    : DEFAULT_SORT;
}

type GridUrlUpdate = Partial<{
  statuses: BugStatus[];
  assignee: string | undefined;
  moduleName: string | undefined;
  search: string;
  sort: { field: BugSortField; direction: SortDirection };
}>;

/**
 * The grid's filters and sort, read from and written to the URL:
 *   ?status=failed,resolved&assignee=me&module=Payments&q=coupon&sort=age:desc
 * A refresh, the Back button or a pasted link shows the same view. Search is typed into local
 * state and pushed to the URL once the person pauses (300 ms).
 */
export function useGridUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = useMemo<BugListFilters>(() => {
    const statuses = (params.get('status') ?? '')
      .split(',')
      .filter((s): s is BugStatus => BUG_STATUSES.includes(s as BugStatus));
    return {
      statuses,
      assignee: params.get('assignee') ?? undefined,
      moduleName: params.get('module') ?? undefined,
      search: params.get('q') ?? undefined,
      sort: parseSort(params.get('sort')),
    };
  }, [params]);

  const update = (next: GridUrlUpdate) => {
    const query = new URLSearchParams(params.toString());
    const set = (key: string, value: string | undefined) =>
      value ? query.set(key, value) : query.delete(key);
    if ('statuses' in next) set('status', next.statuses?.join(','));
    if ('assignee' in next) set('assignee', next.assignee);
    if ('moduleName' in next) set('module', next.moduleName);
    if ('search' in next) set('q', next.search?.trim());
    if (next.sort) {
      const isDefault =
        next.sort.field === DEFAULT_SORT.field && next.sort.direction === DEFAULT_SORT.direction;
      set('sort', isDefault ? undefined : `${next.sort.field}:${next.sort.direction}`);
    }
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const syncSearch = useEffectEvent((value: string) => {
    if (value !== (filters.search ?? '')) update({ search: value });
  });
  useEffect(() => syncSearch(debouncedSearch), [debouncedSearch]);

  const clearAll = () => {
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  };

  const isFiltered =
    filters.statuses.length > 0 || !!filters.assignee || !!filters.moduleName || !!filters.search;

  return { filters, update, searchInput, setSearchInput, clearAll, isFiltered };
}
