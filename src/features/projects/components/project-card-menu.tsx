'use client';

import { useEffect, useState } from 'react';
import { MoreHorizontal, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getErrorMessage } from '@/lib/api-client';
import type { ProjectListItem, ProjectStatus } from '@/types/api';
import { useProject, useUpdateProject } from '../hooks';
import { PROJECT_STATUS_LABELS } from '../schemas';
import { EditProjectDialog } from './edit-project-dialog';

const STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[];

/**
 * The ⋯ on a project card (project:update): edit the project, or move it to another status in
 * one click. The API still decides; a refusal shows as a toast.
 */
export function ProjectCardMenu({ project }: { project: ProjectListItem }) {
  const [editing, setEditing] = useState(false);
  const updateProject = useUpdateProject(project);

  const setStatus = (status: ProjectStatus) =>
    updateProject.mutate(
      { status },
      {
        onSuccess: () =>
          toast.success(`${project.name} is now ${PROJECT_STATUS_LABELS[status].toLowerCase()}`),
        onError: (error) =>
          toast.error("The status didn't change", { description: getErrorMessage(error) }),
      },
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="-mt-1 -mr-2 shrink-0"
            aria-label={`Actions for ${project.name}`}
            disabled={updateProject.isPending}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil aria-hidden />
            Edit project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Move to</DropdownMenuLabel>
          {STATUSES.filter((status) => status !== project.status).map((status) => (
            <DropdownMenuItem key={status} onSelect={() => setStatus(status)}>
              {PROJECT_STATUS_LABELS[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {editing && <EditFromCard projectKey={project.key} onClose={() => setEditing(false)} />}
    </>
  );
}

/**
 * The card only has the list shape; the edit dialog needs the full project (description,
 * manager), so it's fetched first. Mounted only while editing, so cards don't fetch details.
 */
function EditFromCard({ projectKey, onClose }: { projectKey: string; onClose: () => void }) {
  const detail = useProject(projectKey);

  useEffect(() => {
    if (!detail.isError) return;
    toast.error("The project didn't load", { description: getErrorMessage(detail.error) });
    onClose();
  }, [detail.isError, detail.error, onClose]);

  if (!detail.data) return null;
  return (
    <EditProjectDialog project={detail.data} open onOpenChange={(open) => !open && onClose()} />
  );
}
