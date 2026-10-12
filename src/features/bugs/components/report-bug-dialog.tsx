'use client';

import { useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Link2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Select, type SelectOption } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { StatusGlyph } from '@/components/shared/status-glyph';
import { FormDialog } from '@/components/templates/form-dialog';
import { usePermission } from '@/components/auth/can';
import { BUG_STATUSES, STATUS_META } from '@/config/statuses';
import { getErrorMessage } from '@/lib/api-client';
import type { ProjectDetail } from '@/types/api';
import { useCreateBug } from '../hooks';
import {
  MAX_ATTACHMENTS,
  reportBugDefaults,
  reportBugSchema,
  type ReportBugValues,
} from '../schemas';

const UNASSIGNED = 'none';

type ReportBugDialogProps = {
  project: ProjectDetail;
  /** Module names already used in the project, offered as suggestions. */
  modules: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Report a bug (bug:create). Only QA and Admin (bug:set_any_status) may file a bug in a status
 * other than Reported, so everyone else doesn't see the status picker at all. The API enforces
 * the same rules; this only avoids offering choices that would be refused.
 */
export function ReportBugDialog({ project, modules, open, onOpenChange }: ReportBugDialogProps) {
  const createBug = useCreateBug();
  const canSetStatus = usePermission('bug:set_any_status');
  const [formError, setFormError] = useState<string>();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<ReportBugValues>({
    resolver: zodResolver(reportBugSchema),
    defaultValues: reportBugDefaults,
  });
  const attachments = useFieldArray({ control, name: 'attachments' });
  const assignee = useWatch({ control, name: 'assignee' });

  const close = (next: boolean) => {
    if (!next) {
      reset(reportBugDefaults);
      setFormError(undefined);
    }
    onOpenChange(next);
  };

  // Any member with a role can work on bugs (every role has bug:progress); pending or
  // suspended accounts can't be assigned.
  const assigneeOptions: SelectOption[] = [
    { value: UNASSIGNED, label: 'Unassigned' },
    ...project.members
      .filter((member) => member.status === 'active' && member.role)
      .map((member) => ({
        value: member.id,
        label: member.name,
        icon: <Avatar name={member.name} src={member.avatarUrl} />,
      })),
  ];
  const statusOptions: SelectOption[] = BUG_STATUSES.map((status) => ({
    value: status,
    label: STATUS_META[status].label,
    icon: <StatusGlyph status={status} />,
  }));

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
      <Field id="bug-title" label="Title" error={errors.title?.message}>
        <Input
          id="bug-title"
          autoFocus
          placeholder="Cart badge count is off by one after removing the last item"
          aria-invalid={!!errors.title}
          {...register('title')}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="bug-module"
          label="Module or screen"
          hint={modules.length ? 'Pick one already in use, or type a new one.' : undefined}
          error={errors.moduleName?.message}
        >
          {/* The browser's own suggestion list: free text, with existing modules offered as you type. */}
          <Input
            id="bug-module"
            list="bug-module-options"
            autoComplete="off"
            placeholder="Checkout"
            aria-invalid={!!errors.moduleName}
            {...register('moduleName')}
          />
          <datalist id="bug-module-options">
            {modules.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </Field>
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
                options={assigneeOptions}
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

      <Field
        id="bug-description"
        label="Steps to reproduce (optional)"
        hint="What you did, what you expected, what happened."
        error={errors.description?.message}
      >
        <Textarea
          id="bug-description"
          rows={5}
          aria-invalid={!!errors.description}
          {...register('description')}
        />
      </Field>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-xs font-medium text-ink-2">Drive links (optional)</legend>
        {attachments.fields.map((item, index) => {
          const fieldErrors = errors.attachments?.[index];
          return (
            <div key={item.id} className="grid gap-1">
              {/* Phone: name and remove on one line, the URL full width below it. */}
              <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                <Input
                  aria-label={`Link ${index + 1} name`}
                  placeholder="Screen recording"
                  className="min-w-0 flex-1 sm:w-44 sm:flex-none"
                  aria-invalid={!!fieldErrors?.title}
                  {...register(`attachments.${index}.title`)}
                />
                <Input
                  aria-label={`Link ${index + 1} URL`}
                  placeholder="https://drive.google.com/…"
                  className="order-last basis-full font-mono sm:order-none sm:basis-auto"
                  aria-invalid={!!fieldErrors?.url}
                  {...register(`attachments.${index}.url`)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove link ${index + 1}`}
                  onClick={() => attachments.remove(index)}
                >
                  <X aria-hidden />
                </Button>
              </div>
              {(fieldErrors?.title || fieldErrors?.url) && (
                <p role="alert" className="text-xs text-danger">
                  {fieldErrors.title?.message ?? fieldErrors.url?.message}
                </p>
              )}
            </div>
          );
        })}
        {attachments.fields.length < MAX_ATTACHMENTS && (
          <Button
            size="sm"
            variant="ghost"
            className="justify-self-start"
            onClick={() => attachments.append({ title: '', url: '' }, { shouldFocus: true })}
          >
            {attachments.fields.length ? <Plus aria-hidden /> : <Link2 aria-hidden />}
            {attachments.fields.length ? 'Add another link' : 'Add a Drive link'}
          </Button>
        )}
      </fieldset>
    </FormDialog>
  );
}
