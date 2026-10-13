'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermission } from '@/components/auth/can';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/status-badge';
import { TrailPath } from '@/components/shared/trail';
import { DetailPage, DetailSection } from '@/components/templates/detail-page';
import { routes } from '@/config/routes';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { formatDateTime, formatDuration, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useProject } from '@/features/projects/hooks';
import type { ProjectDetail } from '@/types/api';
import { ChatPanel } from '@/features/chat/components/chat-panel';
import { useBug, useProjectModules } from '../hooks';
import { useBugRoom } from '../use-bug-room';
import type { BugDetail } from '../types';
import { AssignBugDialog } from './assign-bug-dialog';
import { BugTimeline } from './bug-timeline';
import { DeleteBugDialog } from './delete-bug-dialog';
import { EditBugDialog } from './edit-bug-dialog';
import { StatusControl } from './status-control';

/**
 * One bug: where it is on its Trail and what can happen next (the band), what it is (facts, steps,
 * links), and what happened so far (timeline). Addressed by key: /projects/:id/bugs/CHK-142.
 */
export function BugPage() {
  const { projectId, bugKey } = useParams<{ projectId: string; bugKey: string }>();
  const bug = useBug(bugKey);
  // Members (assign) and archived status (read-only) come from the project, usually cached already.
  const project = useProject(projectId);

  if (bug.isPending || project.isPending) return <BugSkeleton />;
  if (bug.isError || project.isError) {
    const error = bug.error ?? project.error;
    // 404 for "doesn't exist", "deleted" and "not your project" alike, on purpose.
    return getErrorStatus(error) === 404 ? (
      <EmptyState
        title={`${decodeURIComponent(bugKey)} isn't available`}
        description="It doesn't exist, it was deleted, or it's in a project you're not a member of."
        action={
          <Button asChild size="sm">
            <Link href={routes.project(projectId)}>Back to the project</Link>
          </Button>
        }
      />
    ) : (
      <ErrorState
        title="This bug didn't load"
        description={getErrorMessage(error)}
        onRetry={() => (bug.isError ? bug.refetch() : project.refetch())}
      />
    );
  }
  return <BugView bug={bug.data} project={project.data} />;
}

function BugView({ bug, project }: { bug: BugDetail; project: ProjectDetail }) {
  const modules = useProjectModules(project.id);
  const writable = project.status !== 'archived';
  const canEdit = usePermission('bug:update') && writable;
  const canAssign = usePermission('bug:assign') && writable;
  const canDelete = usePermission('bug:delete');
  const canReadChat = usePermission('chat:read');
  const [dialog, setDialog] = useState<'edit' | 'assign' | 'delete' | null>(null);
  const openDialog = (name: typeof dialog) => () => setDialog(name);
  const onDialogChange = (open: boolean) => !open && setDialog(null);
  // Live: other people's status moves, edits and messages show up without a refresh.
  useBugRoom(bug);

  return (
    <>
      <DetailPage
        asideLabel="Chat"
        aside={
          canReadChat && <ChatPanel bugId={bug.id} members={project.members} readOnly={!writable} />
        }
        eyebrow={
          <>
            <Link href={routes.projects} className="hover:text-ink">
              Projects
            </Link>{' '}
            /{' '}
            <Link href={routes.project(project.id)} className="hover:text-ink">
              {project.key}
            </Link>{' '}
            / {bug.key}
          </>
        }
        title={bug.title}
        actions={
          (canEdit || canDelete) && (
            <>
              {canEdit && (
                <Button onClick={openDialog('edit')}>
                  <Pencil aria-hidden />
                  Edit
                </Button>
              )}
              {canDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label="More actions">
                      <MoreHorizontal aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem tone="danger" onSelect={openDialog('delete')}>
                      <Trash2 aria-hidden />
                      Delete bug
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )
        }
        band={
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <StatusBadge status={bug.status} />
                <span className="text-ink-3">
                  changed{' '}
                  <time
                    dateTime={bug.lastStatusChangedAt}
                    title={formatDateTime(bug.lastStatusChangedAt)}
                  >
                    {formatRelative(bug.lastStatusChangedAt)}
                  </time>
                </span>
              </div>
              <StatusControl bug={bug} readOnlyReason={readOnlyReason(bug, project)} />
            </div>
            <TrailPath
              status={bug.status}
              failCount={bug.failCount}
              timeInStatus={bug.timeInStatus}
            />
          </div>
        }
      >
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
          <Fact label="Assignee">
            <span className="flex flex-wrap items-center gap-2">
              {bug.assignee ? (
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Avatar name={bug.assignee.name} src={bug.assignee.avatarUrl} />
                  <span className="truncate">{bug.assignee.name}</span>
                </span>
              ) : (
                <span className="text-ink-3">Unassigned</span>
              )}
              {canAssign && (
                <Button size="sm" variant="ghost" onClick={openDialog('assign')}>
                  {bug.assignee ? 'Change' : 'Assign'}
                </Button>
              )}
            </span>
          </Fact>
          <Fact label="Module">{bug.moduleName}</Fact>
          <Fact label="Reporter">
            {bug.reporter ? (
              <span className="inline-flex min-w-0 items-center gap-2">
                <Avatar name={bug.reporter.name} src={bug.reporter.avatarUrl} />
                <span className="truncate">{bug.reporter.name}</span>
              </span>
            ) : (
              <span className="text-ink-3">A deleted user</span>
            )}
          </Fact>
          <Fact label="Fails">
            <span
              className={cn(
                'font-mono',
                bug.failCount ? 'font-semibold text-danger' : 'text-ink-3',
              )}
            >
              {bug.failCount}
            </span>
          </Fact>
          <Fact label={bug.passedAt ? 'Took' : 'Age'}>
            <span className="font-mono">{formatDuration(bug.ageMs)}</span>
          </Fact>
          <Fact label="Reported">
            <span className="font-mono">{formatDateTime(bug.createdAt)}</span>
          </Fact>
          {bug.resolvedAt && (
            <Fact label="Last resolved">
              <span className="font-mono">{formatDateTime(bug.resolvedAt)}</span>
            </Fact>
          )}
          {bug.passedAt && (
            <Fact label="Passed">
              <span className="font-mono">{formatDateTime(bug.passedAt)}</span>
            </Fact>
          )}
        </dl>

        <DetailSection title="Steps to reproduce">
          {bug.description ? (
            <p className="max-w-prose text-sm leading-6 whitespace-pre-wrap">{bug.description}</p>
          ) : (
            <p className="text-sm text-ink-3">
              No steps written.{canEdit && ' Edit the bug to add them.'}
            </p>
          )}
        </DetailSection>

        {bug.attachments.length > 0 && (
          <DetailSection title="Links">
            <ul className="grid gap-1.5">
              {bug.attachments.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm hover:underline"
                  >
                    <ExternalLink className="size-3.5 text-ink-3" aria-hidden />
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </DetailSection>
        )}

        <DetailSection title="Activity">
          <BugTimeline bugKey={bug.key} />
        </DetailSection>
      </DetailPage>

      {canEdit && (
        <EditBugDialog
          bug={bug}
          modules={modules.data ?? []}
          open={dialog === 'edit'}
          onOpenChange={onDialogChange}
        />
      )}
      {canAssign && (
        <AssignBugDialog bug={bug} open={dialog === 'assign'} onOpenChange={onDialogChange} />
      )}
      {canDelete && (
        <DeleteBugDialog bug={bug} open={dialog === 'delete'} onOpenChange={onDialogChange} />
      )}
    </>
  );
}

/** Why this user has no status moves right now, in the terms of the workflow. */
function readOnlyReason(bug: BugDetail, project: ProjectDetail): string {
  if (project.status === 'archived') return 'This project is archived, so its bugs are read-only.';
  if (bug.status === 'pass') return 'Verified by QA. Only QA or an Admin can reopen it.';
  if (bug.status === 'resolved') return 'Waiting for QA to pass or fail it.';
  if (!bug.assignee) return "Nobody's assigned yet. Once someone is, they can start work.";
  return `Only ${bug.assignee.name} (the assignee) or QA can move it.`;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-1">
      <dt className="text-xs font-medium text-ink-3">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function BugSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading bug">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-56" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}
