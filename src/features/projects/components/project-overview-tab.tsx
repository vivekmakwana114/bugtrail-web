'use client';

import { useState, type ReactNode } from 'react';
import { Pencil, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/components/auth/can';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TROUBLE_AGE_DAYS } from '@/config/statuses';
import { roleWithDesignation } from '@/config/roles';
import { formatCount, formatDate, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ProjectDetail, UserSummary } from '@/types/api';
import { useRemoveMember } from '../hooks';
import { PROJECT_STATUS_LABELS } from '../schemas';
import { AddMembersDialog } from './add-members-dialog';
import { EditProjectDialog } from './edit-project-dialog';
import { StatusFlow } from './status-flow';

/**
 * The project's Overview tab: how its bugs stand first (a flow across the full width), then what
 * the project is and who's on it (two cards of equal height). People who can edit projects (PM,
 * Admin) get "Edit project" (name, description, manager, status) and add or remove members
 * here. The page header, tabs and loading/error states live in ProjectPage.
 */
export function ProjectOverviewTab({ project }: { project: ProjectDetail }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <BugsCard project={project} />
      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <AboutCard project={project} />
        <MembersCard project={project} />
      </div>
    </div>
  );
}

/** The frame every block on this tab shares: title (and count) on the left, an action right. */
function Card({
  title,
  count,
  action,
  label,
  className,
  children,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
  /** Accessible name when it differs from the title. */
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label ?? title}
      className={cn(
        'grid min-w-0 content-start gap-4 rounded-md border border-line bg-surface p-5',
        className,
      )}
    >
      <div className="flex min-h-8 items-center justify-between gap-3">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          {title}
          {count !== undefined && (
            <span className="font-mono text-sm font-normal text-ink-3">{formatCount(count)}</span>
          )}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function AboutCard({ project: p }: { project: ProjectDetail }) {
  const canEdit = usePermission('project:update');
  const [editing, setEditing] = useState(false);
  const { total, open } = p.bugSummary;

  return (
    <Card
      title="About this project"
      action={
        canEdit && (
          <Button size="sm" onClick={() => setEditing(true)}>
            <Pencil aria-hidden />
            Edit project
          </Button>
        )
      }
    >
      <p className={p.description ? 'max-w-prose text-md text-ink' : 'text-sm text-ink-3'}>
        {p.description || 'No description yet.'}
      </p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-3">
        <Fact label="Status">
          <span className="inline-flex rounded-sm border border-line-strong px-2 py-0.5 text-sm">
            {PROJECT_STATUS_LABELS[p.status]}
          </span>
        </Fact>
        <Fact label="Manager">
          {p.manager ? (
            <span className="inline-flex min-w-0 items-center gap-2">
              <Avatar name={p.manager.name} src={p.manager.avatarUrl} />
              <span className="truncate">{p.manager.name}</span>
            </span>
          ) : (
            <span className="text-ink-3">Not set</span>
          )}
        </Fact>
        <Fact label="Key">
          <span className="font-mono">{p.key}</span>
        </Fact>
        <Fact label="Bugs">
          <span className="font-mono">{formatCount(total)}</span>
          <span className="text-ink-3"> reported · </span>
          <span className="font-mono">{formatCount(open)}</span>
          <span className="text-ink-3"> open</span>
        </Fact>
        <Fact label="Created">
          <span className="font-mono">{formatDate(p.createdAt)}</span>
        </Fact>
        <Fact label="Updated">
          <span className="font-mono">{formatRelative(p.updatedAt)}</span>
        </Fact>
      </dl>
      {canEdit && <EditProjectDialog project={p} open={editing} onOpenChange={setEditing} />}
    </Card>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-1">
      <dt className="font-mono text-xs tracking-widest text-ink-3 uppercase">{label}</dt>
      <dd className="min-w-0 text-md">{children}</dd>
    </div>
  );
}

function BugsCard({ project }: { project: ProjectDetail }) {
  const { bugSummary } = project;
  return (
    <Card title="Bugs" count={bugSummary.total} label="Bugs by stage">
      {bugSummary.total === 0 ? (
        <p className="text-sm text-ink-3">No bugs reported in this project yet.</p>
      ) : (
        <>
          <div className="mx-auto w-full max-w-4xl">
            <StatusFlow byStatus={bugSummary.byStatus} />
          </div>
          {bugSummary.agedOpen > 0 && (
            <p className="text-center text-sm font-semibold text-danger">
              {formatCount(bugSummary.agedOpen)} open for more than {TROUBLE_AGE_DAYS} days
            </p>
          )}
        </>
      )}
    </Card>
  );
}

/**
 * Who's on the project. With project:manage_members (PM, Admin): add people, and remove anyone
 * but the manager (change the manager first). The API also refuses to remove someone with open
 * bugs assigned here; that reason shows in the confirm dialog as-is. A long list scrolls inside
 * the card, so the card keeps the About card's height.
 */
function MembersCard({ project }: { project: ProjectDetail }) {
  const canManage = usePermission('project:manage_members');
  const removeMember = useRemoveMember(project);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<UserSummary | null>(null);

  return (
    <Card
      title="Members"
      count={project.members.length}
      action={
        canManage && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <UserPlus aria-hidden />
            Add members
          </Button>
        )
      }
    >
      {project.members.length === 0 ? (
        <p className="text-sm text-ink-3">
          {canManage
            ? 'Nobody yet. Add the team so they can see the project and its bugs.'
            : 'Nobody yet. A Project Manager or an Admin adds the team.'}
        </p>
      ) : (
        <ul className="-mx-2 grid max-h-80 content-start gap-0.5 overflow-y-auto px-2">
          {project.members.map((member) => {
            const isManager = project.manager?.id === member.id;
            return (
              <li key={member.id} className="flex items-center gap-3 py-1.5">
                <Avatar name={member.name} src={member.avatarUrl} size="md" />
                <span className="grid min-w-0 flex-1">
                  <span className="truncate text-sm font-medium">
                    {member.name}
                    {isManager && <span className="font-normal text-ink-3"> · manager</span>}
                  </span>
                  <span className="truncate text-xs text-ink-3">
                    {roleWithDesignation(member.role, member.designation)}
                    {member.status !== 'active' && ` · ${member.status}`}
                  </span>
                </span>
                {canManage && !isManager && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label={`Remove ${member.name} from ${project.name}`}
                    onClick={() => setRemoving(member)}
                  >
                    <X aria-hidden />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canManage && (
        <>
          <AddMembersDialog project={project} open={adding} onOpenChange={setAdding} />
          <ConfirmDialog
            open={removing !== null}
            onOpenChange={(open) => !open && setRemoving(null)}
            title={`Remove ${removing?.name ?? 'this member'} from ${project.name}?`}
            description="They'll stop seeing the project and its bugs. You can add them back any time."
            confirmLabel="Remove member"
            onConfirm={async () => {
              if (!removing) return;
              await removeMember.mutateAsync(removing.id);
              toast.success(`${removing.name} was removed from ${project.name}`);
            }}
          />
        </>
      )}
    </Card>
  );
}
