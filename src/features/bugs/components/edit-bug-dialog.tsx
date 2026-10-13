'use client';

import { useState } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Select, type SelectOption } from '@/components/ui/select';
import { StatusGlyph } from '@/components/shared/status-glyph';
import { FormDialog } from '@/components/templates/form-dialog';
import { usePermission } from '@/components/auth/can';
import { STATUS_META } from '@/config/statuses';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import type { BugStatus } from '@/types/api';
import { useAssignableUsers, useAssignBug, useChangeBugStatus, useUpdateBug } from '../hooks';
import { editBugSchema, type EditBugValues } from '../schemas';
import type { BugDetail } from '../types';
import { ASSIGNEE_HINT, assigneeOptions, UNASSIGNED } from './assignee-options';
import {
  BugDescriptionField,
  BugLinksField,
  BugModuleField,
  BugTitleField,
} from './bug-content-fields';

type EditBugDialogProps = {
  bug: BugDetail;
  modules: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CONTENT_FIELDS = ['title', 'moduleName', 'description', 'attachments'] as const;

const valuesOf = (bug: BugDetail): EditBugValues => ({
  title: bug.title,
  moduleName: bug.moduleName,
  description: bug.description,
  attachments: bug.attachments.map(({ title, url }) => ({ title, url })),
  status: bug.status,
  assignee: bug.assignee?.id ?? '',
  sendEmail: false,
});

const statusOption = (status: BugStatus): SelectOption => ({
  value: status,
  label: STATUS_META[status].label,
  icon: <StatusGlyph status={status} />,
});

/**
 * Edit a bug (bug:update) with the same fields as the report form: what it says, who has it, and
 * its status. Each part still goes through its own endpoint with its own rules: the status list
 * holds only the moves the API allows you from here (allowedStatuses), the assignee is read-only
 * without bug:assign, and "Email" applies to the assignee and status changes (editing text
 * never emails anyone).
 */
export function EditBugDialog({ bug, modules, open, onOpenChange }: EditBugDialogProps) {
  const updateBug = useUpdateBug(bug);
  const assignBug = useAssignBug(bug);
  const changeStatus = useChangeBugStatus(bug);
  const assignable = useAssignableUsers();
  const canAssign = usePermission('bug:assign');
  const [formError, setFormError] = useState<string>();
  const form = useForm<EditBugValues>({
    resolver: zodResolver(editBugSchema),
    // Follows the bug while the dialog is closed (another tab or person may change it); once the
    // user starts editing, their changes are kept.
    values: valuesOf(bug),
    resetOptions: { keepDirtyValues: true },
  });
  const { control, formState } = form;
  const assignee = useWatch({ control, name: 'assignee' });
  const status = useWatch({ control, name: 'status' });

  const currentAssignee = bug.assignee?.id ?? '';
  const assigneeChanged = assignee !== currentAssignee;
  const statusChanged = status !== bug.status;
  const canMove = bug.allowedStatuses.length > 0;
  const statusOptions = [bug.status, ...bug.allowedStatuses.filter((s) => s !== bug.status)].map(
    statusOption,
  );
  // The current assignee may no longer be assignable (suspended): keep them visible as the value.
  const people = assignable.data ?? [];
  const assigneeChoices =
    bug.assignee && !people.some((user) => user.id === bug.assignee?.id)
      ? [
          ...people,
          { ...bug.assignee, email: '', role: null, designation: '', status: 'active' as const },
        ]
      : people;

  const close = (next: boolean) => {
    // Closing throws away unsaved edits, so the next open starts from the bug as it is.
    if (!next) {
      form.reset(valuesOf(bug));
      setFormError(undefined);
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    // Compared with the bug itself (not formState.dirtyFields, which react-hook-form only tracks
    // when it's read during render), so "did the text change?" is always answered correctly.
    const saved = valuesOf(bug);
    const contentDirty = CONTENT_FIELDS.some(
      (field) => JSON.stringify(values[field]) !== JSON.stringify(saved[field]),
    );
    if (!contentDirty && !assigneeChanged && !statusChanged) return close(false);
    setFormError(undefined);
    try {
      // Text first, then who has it, then where it is: a newly assigned developer must be the
      // assignee before the status moves, because the API checks who may move it.
      if (contentDirty) {
        await updateBug.mutateAsync({
          title: values.title,
          moduleName: values.moduleName,
          description: values.description,
          attachments: values.attachments,
        });
      }
      if (assigneeChanged) {
        await assignBug.mutateAsync({
          assignee: values.assignee || null,
          sendEmail: values.sendEmail && !!values.assignee,
        });
      }
      if (statusChanged) {
        await changeStatus.mutateAsync({ status: values.status, sendEmail: values.sendEmail });
      }
      toast.success('Bug updated');
      // Not close(): its reset would use this render's bug, i.e. the state from before the save.
      // `values` already follows the saved bug.
      onOpenChange(false);
    } catch (error) {
      // Parts saved before the failure stay saved; the form now follows the bug, so it shows them.
      setFormError(
        getErrorStatus(error) === 409
          ? 'Someone else changed this bug. Close this, check the latest, then edit again.'
          : getErrorMessage(error),
      );
    }
  });

  const pending = updateBug.isPending || assignBug.isPending || changeStatus.isPending;
  const emailable = assigneeChanged || statusChanged;

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={`Edit ${bug.key}`}
      submitLabel="Save changes"
      size="lg"
      pending={pending}
      error={formError}
      footerStart={
        <Controller
          control={control}
          name="sendEmail"
          render={({ field }) => (
            <label
              htmlFor="edit-send-email"
              className="inline-flex items-center gap-2 text-sm"
              title={emailable ? undefined : 'Change the assignee or status to email about it.'}
            >
              <Checkbox
                id="edit-send-email"
                checked={emailable && field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                disabled={!emailable}
              />
              <span className={emailable ? undefined : 'text-ink-3'}>
                Email reporter &amp; assignee
              </span>
            </label>
          )}
        />
      }
      onSubmit={onSubmit}
    >
      <FormProvider {...form}>
        <BugTitleField />
        <BugModuleField modules={modules} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="edit-assignee"
            label="Assignee"
            hint={canAssign ? ASSIGNEE_HINT : 'Only someone who can assign bugs can change this.'}
            error={formState.errors.assignee?.message}
          >
            <Controller
              control={control}
              name="assignee"
              render={({ field }) => (
                <Select
                  id="edit-assignee"
                  value={field.value || UNASSIGNED}
                  onValueChange={(value) => field.onChange(value === UNASSIGNED ? '' : value)}
                  options={assigneeOptions(assigneeChoices)}
                  disabled={!canAssign}
                />
              )}
            />
          </Field>
          <Field
            id="edit-status"
            label="Status"
            hint={canMove ? undefined : "You can't move this bug from where it is."}
          >
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  id="edit-status"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={statusOptions}
                  disabled={!canMove}
                />
              )}
            />
          </Field>
        </div>

        <BugDescriptionField />
        <BugLinksField />
      </FormProvider>
    </FormDialog>
  );
}
