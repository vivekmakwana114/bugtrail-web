'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Select, type SelectOption } from '@/components/ui/select';
import { StatusGlyph } from '@/components/shared/status-glyph';
import { FormDialog } from '@/components/templates/form-dialog';
import { usePermission } from '@/components/auth/can';
import { routes } from '@/config/routes';
import { BUG_STATUSES, STATUS_META } from '@/config/statuses';
import { getErrorMessage } from '@/lib/api-client';
import type { ProjectDetail } from '@/types/api';
import { useCreateBug } from '../hooks';
import { reportBugDefaults, reportBugSchema, type ReportBugValues } from '../schemas';
import { assigneeOptions, UNASSIGNED } from './assignee-options';
import {
  BugDescriptionField,
  BugLinksField,
  BugModuleField,
  BugTitleField,
} from './bug-content-fields';

type ReportBugDialogProps = {
  project: ProjectDetail;
  /** Module names already used in the project, offered as suggestions. */
  modules: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const statusOptions: SelectOption[] = BUG_STATUSES.map((status) => ({
  value: status,
  label: STATUS_META[status].label,
  icon: <StatusGlyph status={status} />,
}));

/**
 * Report a bug (bug:create). Only QA and Admin (bug:set_any_status) may file a bug in a status
 * other than Reported, so everyone else doesn't see the status picker at all. The API enforces
 * the same rules; this only avoids offering choices that would be refused.
 */
export function ReportBugDialog({ project, modules, open, onOpenChange }: ReportBugDialogProps) {
  const router = useRouter();
  const createBug = useCreateBug();
  const canSetStatus = usePermission('bug:set_any_status');
  const [formError, setFormError] = useState<string>();
  const form = useForm<ReportBugValues>({
    resolver: zodResolver(reportBugSchema),
    defaultValues: reportBugDefaults,
  });
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = form;
  const assignee = useWatch({ control, name: 'assignee' });

  const close = (next: boolean) => {
    if (!next) {
      reset(reportBugDefaults);
      setFormError(undefined);
    }
    onOpenChange(next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      const bug = await createBug.mutateAsync({
        ...values,
        project: project.id,
        assignee: values.assignee || null,
        sendEmail: !!values.assignee && values.sendEmail,
      });
      toast.success('Bug reported', {
        description: bug.assignee ? `${bug.key} · assigned to ${bug.assignee.name}` : bug.key,
        action: { label: 'Open', onClick: () => router.push(routes.bug(project.id, bug.key)) },
      });
      close(false);
    } catch (error) {
      const message = getErrorMessage(error);
      // "The assignee must be a member of the project" belongs next to the assignee.
      if (/assignee/i.test(message)) setError('assignee', { message });
      else setFormError(message);
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title="Report bug"
      description={`${project.name} (${project.key})`}
      submitLabel="Report bug"
      size="lg"
      pending={createBug.isPending}
      error={formError}
      footerStart={
        <Controller
          control={control}
          name="sendEmail"
          render={({ field }) => (
            <label
              htmlFor="bug-send-email"
              className="inline-flex items-center gap-2 text-sm"
              title={assignee ? undefined : 'Pick an assignee first: the email goes to them.'}
            >
              <Checkbox
                id="bug-send-email"
                checked={!!assignee && field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                disabled={!assignee}
              />
              <span className={assignee ? undefined : 'text-ink-3'}>Email the assignee</span>
            </label>
          )}
        />
      }
      onSubmit={onSubmit}
    >
      <FormProvider {...form}>
        <BugTitleField />

        <div className="grid gap-4 sm:grid-cols-2">
          <BugModuleField modules={modules} />
          <Field id="bug-assignee" label="Assignee" error={errors.assignee?.message}>
            <Controller
              control={control}
              name="assignee"
              render={({ field }) => (
                <Select
                  id="bug-assignee"
                  value={field.value || UNASSIGNED}
                  onValueChange={(value) => {
                    const next = value === UNASSIGNED ? '' : value;
                    field.onChange(next);
                    if (!next) setValue('sendEmail', false);
                  }}
                  options={assigneeOptions(project.members)}
                  aria-invalid={!!errors.assignee}
                />
              )}
            />
          </Field>
        </div>

        {canSetStatus && (
          <Field
            id="bug-status"
            label="Status"
            hint="Usually Reported. Pick another to log a bug that's already moving."
            className="sm:w-1/2 sm:pr-2"
          >
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  id="bug-status"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={statusOptions}
                />
              )}
            />
          </Field>
        )}

        <BugDescriptionField />
        <BugLinksField />
      </FormProvider>
    </FormDialog>
  );
}
