'use client';

import type { RefObject } from 'react';
import { Search } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { Select, type SelectOption } from '@/components/ui/select';
import { StatusGlyph } from '@/components/shared/status-glyph';
import { BUG_STATUSES, STATUS_META } from '@/config/statuses';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import type { BugStatus, UserSummary } from '@/types/api';
import { useAssignableUsers } from '../hooks';
import type { BugListFilters } from '../types';

const ANY = 'any';

type TicketFiltersProps = {
  filters: BugListFilters;
  searchInput: string;
  onSearchInput: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onChange: (next: Partial<Pick<BugListFilters, 'statuses' | 'assignee' | 'moduleName'>>) => void;
  onClear: () => void;
  isFiltered: boolean;
  members: UserSummary[];
  modules: string[];
};

/** Search, status chips (multi-select), assignee and module. Every change lands in the URL. */
export function TicketFilters({
  filters,
  searchInput,
  onSearchInput,
  searchRef,
  onChange,
  onClear,
  isFiltered,
  members,
  modules,
}: TicketFiltersProps) {
  const toggleStatus = (status: BugStatus) => {
    const selected = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : BUG_STATUSES.filter((s) => s === status || filters.statuses.includes(s));
    onChange({ statuses: selected });
  };

  // Everyone bugs can be assigned to (anyone can be, since assigning adds them to the project),
  // plus the project's own members so someone since suspended can still be filtered by.
  // Admins only ever assign bugs to themselves, so another admin is never an option here
  // (the assignable list already leaves them out; members can still include one).
  const { user } = useAuth();
  const assignable = useAssignableUsers();
  const people = [
    ...new Map([...(assignable.data ?? []), ...members].map((u) => [u.id, u])).values(),
  ]
    .filter((person) => person.role !== 'admin' || person.id === user?.id)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  const assigneeOptions: SelectOption[] = [
    { value: ANY, label: 'Anyone' },
    { value: 'me', label: 'Assigned to me' },
    { value: 'none', label: 'Unassigned' },
    ...people.map((person) => ({
      value: person.id,
      label: person.name,
      icon: <Avatar name={person.name} src={person.avatarUrl} />,
    })),
  ];
  const moduleOptions: SelectOption[] = [
    { value: ANY, label: 'All modules' },
    ...modules.map((name) => ({ value: name, label: name })),
  ];

  return (
    <div className="grid gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-2 left-2.5 size-4 text-ink-3"
            aria-hidden
          />
          <Input
            ref={searchRef}
            type="search"
            aria-label="Search bugs by title, module or key"
            placeholder="Search title, module or CHK-42"
            className="pr-8 pl-8"
            value={searchInput}
            onChange={(event) => onSearchInput(event.target.value)}
          />
          <Kbd className="pointer-events-none absolute top-1.5 right-2" aria-hidden>
            /
          </Kbd>
        </div>
        <Select
          value={filters.assignee ?? ANY}
          onValueChange={(value) => onChange({ assignee: value === ANY ? undefined : value })}
          options={assigneeOptions}
          className="w-44"
          aria-label="Assignee"
        />
        <Select
          value={filters.moduleName ?? ANY}
          onValueChange={(value) => onChange({ moduleName: value === ANY ? undefined : value })}
          options={moduleOptions}
          className="w-44"
          aria-label="Module"
        />
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
      <div role="group" aria-label="Status" className="flex flex-wrap gap-1.5">
        {BUG_STATUSES.map((status) => {
          const pressed = filters.statuses.includes(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={pressed}
              onClick={() => toggleStatus(status)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-sm',
                pressed
                  ? 'border-ink bg-ink/6 font-medium text-ink'
                  : 'border-line-strong bg-surface text-ink-2 hover:text-ink',
              )}
            >
              <StatusGlyph status={status} />
              {STATUS_META[status].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
