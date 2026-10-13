'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHead } from '@/components/ui/table';
import { usePermission } from '@/components/auth/can';
import { ListPage, type ListState } from '@/components/templates/list-page';
import { routes } from '@/config/routes';
import { getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import type { RoleKey } from '@/types/api';
import { useAccessCatalog } from '../hooks';
import type { AccessCatalog, RoleDefinition } from '../types';

/**
 * Roles (user:read): what each of the four roles can do, as one matrix. Permissions are rows,
 * roles are columns, so the difference between two roles reads straight across a row.
 * Read-only on purpose: a role's permissions are code in the API (src/config/roles.js), so
 * changing them is a PR and a deploy, not a form here.
 */
export function RolesPage() {
  const canRead = usePermission('user:read');
  // The catalog itself isn't secret (any signed-in user may read it); hiding the screen just
  // keeps it with the people who assign roles. No request when it wouldn't be shown.
  const catalog = useAccessCatalog({ enabled: canRead });

  let state: ListState;
  if (!canRead) state = { kind: 'forbidden' };
  else if (catalog.isError) {
    state = {
      kind: 'error',
      message: getErrorMessage(catalog.error),
      onRetry: () => catalog.refetch(),
    };
  } else if (catalog.isPending) state = { kind: 'loading' };
  else if (catalog.data.roles.length === 0) state = { kind: 'empty' };
  else state = { kind: 'ready' };

  return (
    <ListPage
      title="Roles"
      description={
        <>
          What each role can do. Roles are set in code, so everyone with a role has exactly the
          same access. To change someone&apos;s role, go to{' '}
          <Link
            href={routes.users}
            className="font-medium text-ink underline underline-offset-2 hover:no-underline"
          >
            Users
          </Link>
          .
        </>
      }
      state={state}
      loading={<MatrixSkeleton />}
      empty={{
        title: 'No roles came back',
        description: 'The API returned an empty role catalog. Tell whoever runs the server.',
      }}
    >
      {catalog.data && <RoleMatrix catalog={catalog.data} />}
    </ListPage>
  );
}

/* ------------------------------------------------------------------ matrix */

function RoleMatrix({ catalog }: { catalog: AccessCatalog }) {
  const { user } = useAuth();
  const myRole = user?.role ?? null;
  const { roles, permissionGroups } = catalog;
  const totalPermissions = permissionGroups.reduce((sum, g) => sum + g.permissions.length, 0);
  // One Set per role so each cell is a lookup, not a scan of the permission list.
  const granted = new Map(roles.map((role) => [role.key, new Set(role.permissions)]));

  return (
    <div className="grid min-w-0 gap-4">
      <RoleLegend roles={roles} myRole={myRole} />
      <Table aria-label="What each role can do" className="min-w-140">
        <thead>
          <tr>
            <TableHead className="sticky left-0 z-10 bg-surface">Permission</TableHead>
            {roles.map((role) => (
              <TableHead
                key={role.key}
                className={cn('w-28 text-center', role.key === myRole && 'bg-ink/4 text-ink')}
              >
                <span className="block">{role.label}</span>
                <span className="block font-mono font-normal text-ink-3">
                  {role.permissions.length}/{totalPermissions}
                  {role.key === myRole && ' · you'}
                </span>
              </TableHead>
            ))}
          </tr>
        </thead>
        {permissionGroups.map((group) => (
          <tbody key={group.key}>
            <tr className="border-b border-line">
              <th
                scope="rowgroup"
                colSpan={roles.length + 1}
                className="bg-sunken px-3 pt-3 pb-1.5 text-left text-xs font-semibold tracking-wide text-ink-2 uppercase"
              >
                {/* The cell spans the full row; the label inside stays put on a sideways scroll. */}
                <span className="sticky left-3">{group.label}</span>
              </th>
            </tr>
            {group.permissions.map((permission) => (
              <tr key={permission.key} className="border-b border-line hover:bg-ink/3">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-surface px-3 py-2 text-left font-normal"
                >
                  <span className="block text-ink">{permission.label}</span>
                  <span className="block font-mono text-xs text-ink-3">{permission.key}</span>
                </th>
                {roles.map((role) => (
                  <GrantCell
                    key={role.key}
                    has={granted.get(role.key)?.has(permission.key) ?? false}
                    mine={role.key === myRole}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </Table>
    </div>
  );
}

/**
 * A tick or a dash, never colour alone. The hidden "Yes"/"No" is what a screen reader says
 * after the row and column headers ("Assign bugs, QA, Yes").
 */
function GrantCell({ has, mine }: { has: boolean; mine: boolean }) {
  return (
    <td className={cn('px-3 py-2 text-center align-middle', mine && 'bg-ink/4')}>
      {has ? (
        <Check className="mx-auto size-4 text-ink" strokeWidth={2.5} aria-hidden />
      ) : (
        <span className="text-ink-3" aria-hidden>
          –
        </span>
      )}
      <span className="sr-only">{has ? 'Yes' : 'No'}</span>
    </td>
  );
}

/** The one-line description of each role, above the matrix. */
function RoleLegend({ roles, myRole }: { roles: RoleDefinition[]; myRole: RoleKey | null }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {roles.map((role) => (
        <div key={role.key} className="grid gap-0.5">
          <dt className="text-sm font-medium text-ink">
            {role.label}
            {role.key === myRole && (
              <span className="ml-2 font-mono text-xs font-normal text-ink-3">your role</span>
            )}
          </dt>
          <dd className="text-sm text-ink-2">{role.description}</dd>
        </div>
      ))}
    </dl>
  );
}

function MatrixSkeleton() {
  return (
    <div className="grid gap-4" aria-label="Loading roles">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
      <div className="grid gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    </div>
  );
}
