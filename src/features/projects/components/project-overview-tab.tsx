'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/components/auth/can';
import { StatusGlyph } from '@/components/shared/status-glyph';
import { StatusRing } from '@/components/shared/status-ring';
import { DetailSection } from '@/components/templates/detail-page';
import { BUG_STATUSES, STATUS_META, TROUBLE_AGE_DAYS } from '@/config/statuses';
import { roleWithDesignation } from '@/config/roles';
import { formatCount, formatRelative } from '@/lib/format';
import type { ProjectDetail } from '@/types/api';
import { PROJECT_STATUS_LABELS } from '../schemas';
import { EditProjectDialog } from './edit-project-dialog';

/**
 * The project's Overview tab: what it is, how its bugs stand, and who's on it. People who can
 * edit projects (PM, Admin) get "Edit project" here: name, description, manager, status
 * (archiving included). The page header, tabs and loading/error states live in ProjectPage.
 */
export function ProjectOverviewTab({ project: p }: { project: ProjectDetail }) {
  const canEdit = usePermission('project:update');
  const [editing, setEditing] = useState(false);
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="grid min-w-0 gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className={p.description ? 'max-w-prose text-md text-ink' : 'text-sm text-ink-3'}>
            {p.description || 'No description yet.'}
          </p>
          {canEdit && (
            <Button onClick={() => setEditing(true)}>
              <Pencil aria-hidden />
              Edit project
            </Button>
          )}
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Fact label="Status" value={PROJECT_STATUS_LABELS[p.status]} />
          <Fact label="Manager" value={p.manager?.name ?? 'Not set'} />
          <Fact label="Updated" value={formatRelative(p.updatedAt)} mono />
        </dl>
        <BugOverview project={p} />
      </div>
      {canEdit && <EditProjectDialog project={p} open={editing} onOpenChange={setEditing} />}
      <aside aria-label="Members" className="rounded-md border border-line bg-surface">
        <MemberList project={p} />
      </aside>
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className={mono ? 'font-mono' : undefined}>{value}</dd>
    </div>
  );
}

function BugOverview({ project }: { project: ProjectDetail }) {
  const { bugSummary } = project;
  const failing = bugSummary.byStatus.failed;
  return (
    <DetailSection title="Bugs">
      {bugSummary.total === 0 ? (
        <p className="text-sm text-ink-2">No bugs reported in this project yet.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <StatusRing pie={bugSummary.pie} open={bugSummary.open} size={112} />
          <dl className="grid min-w-56 gap-1.5 text-sm">
            {BUG_STATUSES.map((status) => (
              <div key={status} className="grid grid-cols-[1rem_1fr_auto] items-center gap-2">
                <StatusGlyph status={status} />
                <dt className="text-ink-2">{STATUS_META[status].label}</dt>
                <dd className="font-mono">{formatCount(bugSummary.byStatus[status])}</dd>
              </div>
            ))}
          </dl>
          {(failing > 0 || bugSummary.agedOpen > 0) && (
            <p className="grid gap-1 text-sm font-semibold text-danger">
              {failing > 0 && (
                <span>
                  {failing} failed QA and {failing === 1 ? 'needs' : 'need'} another look
                </span>
              )}
              {bugSummary.agedOpen > 0 && (
                <span>
                  {bugSummary.agedOpen} open for more than {TROUBLE_AGE_DAYS} days
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </DetailSection>
  );
}

function MemberList({ project }: { project: ProjectDetail }) {
  return (
    <div className="grid gap-3 p-4">
      <h2 className="flex items-baseline justify-between text-md font-semibold">
        Members{' '}
        <span className="font-mono text-xs font-normal text-ink-3">{project.members.length}</span>
      </h2>
      {project.members.length === 0 ? (
        <p className="text-sm text-ink-2">
          Nobody yet. A Project Manager or an Admin adds the team.
        </p>
      ) : (
        <ul className="grid gap-2.5">
          {project.members.map((member) => (
            <li key={member.id} className="flex items-center gap-2.5">
              <Avatar name={member.name} src={member.avatarUrl} size="md" />
              <span className="grid min-w-0">
                <span className="truncate text-sm">
                  {member.name}
                  {project.manager?.id === member.id && (
                    <span className="text-ink-3"> · manager</span>
                  )}
                </span>
                <span className="text-xs text-ink-3">
                  {roleWithDesignation(member.role, member.designation)}
                  {member.status !== 'active' && ` · ${member.status}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
