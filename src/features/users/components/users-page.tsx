'use client';

import { useState, type ReactNode } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermission } from '@/components/auth/can';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState, ErrorState, NoAccessState } from '@/components/shared/states';
import { roleLabel, ROLE_LABELS } from '@/config/roles';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { formatCount, formatDateTime, formatRelative } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import type { RoleKey } from '@/types/api';
import { usePendingCount, useUserList } from '../hooks';
import type { UserListFilters, UserListItem, UserStatus } from '../types';
import { useUsersUrlState, type UsersTab } from '../use-users-url-state';
import { AddUserDialog } from './add-user-dialog';
import { RoleDialog } from './role-dialog';
import { UserActions } from './user-actions';
import { USER_STATUS_LABELS, UserStatusBadge } from './user-status-badge';

const ANY = 'any';

/**
 * Users (user:read). Two jobs, two tabs: the approval queue (people waiting to get in, newest
 * question first) and everyone, filterable. Actions depend on your role: Admin manages, a
 * Project Manager can look.
 */
export function UsersPage() {
  const state = useUsersUrlState();
  const canCreate = usePermission('user:create');
  const pendingCount = usePendingCount();
  const [adding, setAdding] = useState(false);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Users"
        description="Approve new sign-ups, and manage who has which role."
        actions={
          canCreate && (
            <Button variant="primary" onClick={() => setAdding(true)}>
              <UserPlus aria-hidden />
              Add user
            </Button>
          )
        }
      />
      <Tabs value={state.tab} onValueChange={(value) => state.setTab(value as UsersTab)}>
        <TabsList>
          <TabsTrigger value="pending">
            Waiting for approval{' '}
            {!!pendingCount.data && (
              <span className="font-mono text-xs text-ink-3">{formatCount(pendingCount.data)}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All users</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="pt-4">
          <PendingQueue />
        </TabsContent>
        <TabsContent value="all" className="pt-4">
          <AllUsers state={state} />
        </TabsContent>
      </Tabs>
      {canCreate && <AddUserDialog open={adding} onOpenChange={setAdding} />}
    </div>
  );
}

/* ------------------------------------------------------------------ approval queue */

function PendingQueue() {
  const list = useUserList({ status: 'pending' });
  const canApprove = usePermission('user:approve');
  const users = list.data?.pages.flatMap((page) => page.results) ?? [];

  const failed = listFailure(list);
  if (failed) return failed;
  if (list.isPending) return <RowsSkeleton />;
  if (users.length === 0) {
    return (
      <EmptyState
        title="Nobody is waiting"
        description="When someone signs up, they appear here (and you get a notification) until an Admin approves or rejects them."
      />
    );
  }
  return (
    <ul
      className="grid gap-px overflow-hidden rounded-md border border-line bg-line"
      aria-label="Waiting for approval"
    >
      {users.map((user) => (
        <PendingRow key={user.id} user={user} canApprove={canApprove} />
      ))}
    </ul>
  );
}

function PendingRow({ user, canApprove }: { user: UserListItem; canApprove: boolean }) {
  const [approving, setApproving] = useState(false);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-surface px-4 py-3">
      <UserCell user={user} />
      <span className="text-sm text-ink-3">
        signed up{' '}
        <time dateTime={user.createdAt} title={formatDateTime(user.createdAt)}>
          {formatRelative(user.createdAt)}
        </time>
      </span>
      {canApprove && (
        <span className="ml-auto flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setApproving(true)}>
            Approve…
          </Button>
          <UserActions user={user} />
          <RoleDialog user={user} mode="approve" open={approving} onOpenChange={setApproving} />
        </span>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ everyone */

const roleOptions = [
  { value: ANY, label: 'Any role' },
  ...(Object.keys(ROLE_LABELS) as RoleKey[]).map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
  })),
];
const statusOptions = [
  { value: ANY, label: 'Any status' },
  ...(['active', 'suspended', 'rejected'] as UserStatus[]).map((status) => ({
    value: status,
    label: USER_STATUS_LABELS[status],
  })),
];

function AllUsers({ state }: { state: ReturnType<typeof useUsersUrlState> }) {
  const { filters, update, searchInput, setSearchInput, clearAll, isFiltered } = state;
  const list = useUserList(filters);
  const { user: me } = useAuth();
  const users = list.data?.pages.flatMap((page) => page.results) ?? [];
  const total = list.data?.pages[0]?.totalResults ?? 0;

  let content: ReactNode = listFailure(list);
  if (!content && list.isPending) content = <RowsSkeleton />;
  if (!content && users.length === 0) {
    content = (
      <EmptyState
        title="No users match"
        description="Try part of a name or an email, or another role or status."
        action={
          isFiltered && (
            <Button size="sm" onClick={clearAll}>
              Clear filters
            </Button>
          )
        }
      />
    );
  }
  if (!content) {
    content = (
      <>
        <Table aria-label="Users" aria-busy={list.isPlaceholderData} className="min-w-180">
          <thead>
            <tr>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <UserCell user={user} isMe={user.id === me?.id} />
                </TableCell>
                <TableCell className={user.role ? 'whitespace-nowrap' : 'text-ink-3'}>
                  {roleLabel(user.role)}
                </TableCell>
                <TableCell>
                  <UserStatusBadge status={user.status} />
                </TableCell>
                <TableCell className="font-mono whitespace-nowrap text-ink-2">
                  {user.lastLoginAt ? (
                    <time dateTime={user.lastLoginAt} title={formatDateTime(user.lastLoginAt)}>
                      {formatRelative(user.lastLoginAt)}
                    </time>
                  ) : (
                    <span className="text-ink-3">never</span>
                  )}
                </TableCell>
                <TableCell className="font-mono whitespace-nowrap text-ink-3">
                  <time dateTime={user.createdAt} title={formatDateTime(user.createdAt)}>
                    {formatRelative(user.createdAt)}
                  </time>
                </TableCell>
                <TableCell className="w-10 text-right">
                  {/* No actions on yourself: the API refuses self role/status changes and deletes. */}
                  {user.id !== me?.id && <UserActions user={user} />}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
        {list.hasNextPage && (
          <Button
            size="sm"
            className="justify-self-start"
            onClick={() => list.fetchNextPage()}
            disabled={list.isFetchingNextPage}
          >
            {list.isFetchingNextPage
              ? 'Loading…'
              : `Show more (${formatCount(total - users.length)} left)`}
          </Button>
        )}
      </>
    );
  }

  return (
    <section className="grid gap-4" aria-label="All users">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute top-2 left-2.5 size-4 text-ink-3"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search users"
            placeholder="Name or email"
            className="pl-8"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          aria-label="Role"
          className="w-40"
          value={filters.role ?? ANY}
          onValueChange={(value) =>
            update({ role: value === ANY ? undefined : (value as RoleKey) })
          }
          options={roleOptions}
        />
        <Select
          aria-label="Status"
          className="w-40"
          value={filters.status ?? ANY}
          onValueChange={(value) =>
            update({ status: value === ANY ? undefined : (value as UserListFilters['status']) })
          }
          options={statusOptions}
        />
        {isFiltered && (
          <Button size="sm" variant="ghost" onClick={clearAll}>
            Clear
          </Button>
        )}
        {list.isSuccess && users.length > 0 && (
          <span className="ml-auto text-sm text-ink-3" aria-live="polite">
            <span className="font-mono">{formatCount(total)}</span> {total === 1 ? 'user' : 'users'}
          </span>
        )}
      </div>
      {content}
    </section>
  );
}

/* ------------------------------------------------------------------ shared bits */

function UserCell({ user, isMe = false }: { user: UserListItem; isMe?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar name={user.name} src={user.avatarUrl} size="md" />
      <span className="grid min-w-0">
        <span className="truncate text-sm font-medium text-ink">
          {user.name}
          {isMe && <span className="ml-1.5 text-xs font-normal text-ink-3">(you)</span>}
        </span>
        <span className="truncate text-xs text-ink-3">{user.email}</span>
      </span>
    </span>
  );
}

/** 403 → who can help; anything else → retry. Returns null when the list loaded fine. */
function listFailure(list: ReturnType<typeof useUserList>): ReactNode {
  if (!list.isError) return null;
  return getErrorStatus(list.error) === 403 ? (
    <NoAccessState description="Only Admins and Project Managers can see the user list." />
  ) : (
    <ErrorState
      title="The users didn't load"
      description={getErrorMessage(list.error)}
      onRetry={() => list.refetch()}
    />
  );
}

function RowsSkeleton() {
  return (
    <div className="grid gap-2" aria-busy="true" aria-label="Loading users">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
