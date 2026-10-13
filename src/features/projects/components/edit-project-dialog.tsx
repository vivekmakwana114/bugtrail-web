'use client';

import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Avatar } from '@/components/ui/avatar';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Select, type SelectOption } from '@/components/ui/select';
import { FormDialog } from '@/components/templates/form-dialog';
import { roleWithDesignation } from '@/config/roles';
import { getErrorMessage } from '@/lib/api-client';
import type { ProjectDetail, ProjectStatus } from '@/types/api';
import { useManagerCandidates, useUpdateProject } from '../hooks';
import { PROJECT_STATUS_LABELS } from '../schemas';

/** Radix Select can't hold an empty value, so "no manager" is this sentinel in the UI only. */
const NO_MANAGER = 'none';

const editProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name the project.').max(100, 'Keep it under 100 characters.'),
  description: z.string().trim().max(2000, 'Keep it under 2,000 characters.'),
  status: z.enum(['active', 'completed', 'archived']),
  /** '' = no manager */
  manager: z.string(),
});
type EditProjectValues = z.infer<typeof editProjectSchema>;

const valuesOf = (project: ProjectDetail): EditProjectValues => ({
  name: project.name,
  description: project.description,
  status: project.status,
  manager: project.manager?.id ?? '',
});

/** What each status means, so the choice comes with its consequence. */
const STATUS_HINTS: Record<ProjectStatus, string> = {
  active: 'Work in progress: bugs can be reported, edited and discussed.',
  completed: 'Done, but still open for follow-up bugs.',
  archived:
    'Read-only for everyone: no new bugs, edits, status moves or chat. You can set it back to Active later.',
};

const statusOptions: SelectOption[] = (['active', 'completed', 'archived'] as const).map(
  (status) => ({ value: status, label: PROJECT_STATUS_LABELS[status] }),
);

type EditProjectDialogProps = {
  project: ProjectDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Edit a project (project:update): name, description, manager and status. The key never
 * changes. Archiving is the status "Archived". The manager must be an Admin or Project Manager;
 * if they aren't on the project yet, the API adds them as a member.
 */
export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const updateProject = useUpdateProject(project.id);
  const candidates = useManagerCandidates(open);
  const [formError, setFormError] = useState<string>();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProjectValues>({
    resolver: zodResolver(editProjectSchema),
    // Follows the project while closed; once editing starts, the user's changes are kept.
    values: valuesOf(project),
    resetOptions: { keepDirtyValues: true },
  });
  const status = useWatch({ control, name: 'status' });
  const manager = useWatch({ control, name: 'manager' });

  // The current manager stays selectable even if they're no longer a candidate (suspended).
  const people = candidates.data ?? [];
  const managerOptions: SelectOption[] = [
    { value: NO_MANAGER, label: 'No manager' },
    ...(project.manager && !people.some((user) => user.id === project.manager?.id)
      ? [project.manager]
      : []
    ).map((user) => ({ value: user.id, label: user.name })),
    ...people.map((user) => ({
      value: user.id,
      label: `${user.name} · ${roleWithDesignation(user.role, user.designation)}`,
      icon: <Avatar name={user.name} src={user.avatarUrl} />,
    })),
  ];
  const managerIsMember = !manager || project.members.some((member) => member.id === manager);

  const close = (next: boolean) => {
    if (!next) {
      reset(valuesOf(project));
      setFormError(undefined);
    }
    onOpenChange(next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      const saved = await updateProject.mutateAsync({
        name: values.name,
        description: values.description,
        status: values.status,
        manager: values.manager || null,
      });
      toast.success('Project updated', {
        description:
          saved.status !== project.status
            ? `${saved.name} is now ${PROJECT_STATUS_LABELS[saved.status]}.`
            : undefined,
      });
      // Not close(): its reset would use this render's project; `values` follows the saved one.
      onOpenChange(false);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={`Edit ${project.name}`}
      description={`Key ${project.key} (it prefixes every bug and can't change).`}
      submitLabel="Save changes"
      size="lg"
      pending={updateProject.isPending}
      error={formError}
      onSubmit={onSubmit}
    >
      <Field id="project-name" label="Name" error={errors.name?.message}>
        <Input id="project-name" aria-invalid={!!errors.name} {...register('name')} />
      </Field>
      <Field id="project-description" label="Description" error={errors.description?.message}>
        <Textarea
          id="project-description"
          rows={4}
          aria-invalid={!!errors.description}
          {...register('description')}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="project-manager"
          label="Manager"
          hint={
            managerIsMember
              ? 'An Admin or Project Manager who runs this project.'
              : 'Not on the project yet: saving adds them as a member.'
          }
        >
          <Controller
            control={control}
            name="manager"
            render={({ field }) => (
              <Select
                id="project-manager"
                value={field.value || NO_MANAGER}
                onValueChange={(value) => field.onChange(value === NO_MANAGER ? '' : value)}
                options={managerOptions}
              />
            )}
          />
        </Field>
        <Field id="project-status" label="Status" hint={STATUS_HINTS[status]}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                id="project-status"
                value={field.value}
                onValueChange={field.onChange}
                options={statusOptions}
              />
            )}
          />
        </Field>
      </div>
    </FormDialog>
  );
}
