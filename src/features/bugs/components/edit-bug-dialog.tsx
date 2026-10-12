'use client';

import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FormDialog } from '@/components/templates/form-dialog';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { useUpdateBug } from '../hooks';
import { bugContentSchema, type BugContentValues } from '../schemas';
import type { BugDetail } from '../types';
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

const contentOf = (bug: BugDetail): BugContentValues => ({
  title: bug.title,
  moduleName: bug.moduleName,
  description: bug.description,
  attachments: bug.attachments.map(({ title, url }) => ({ title, url })),
});

/**
 * Edit what the bug says (bug:update): title, module, steps, links. Status and assignee have their
 * own controls because they have their own rules and notifications.
 */
export function EditBugDialog({ bug, modules, open, onOpenChange }: EditBugDialogProps) {
  const updateBug = useUpdateBug(bug);
  const [formError, setFormError] = useState<string>();
  const form = useForm<BugContentValues>({
    resolver: zodResolver(bugContentSchema),
    // Follows the bug while the dialog is closed (another tab or person may edit it); once the
    // user starts typing, their changes are kept.
    values: contentOf(bug),
    resetOptions: { keepDirtyValues: true },
  });

  const close = (next: boolean) => {
    // Closing throws away unsaved edits, so the next open starts from the bug as it is.
    if (!next) {
      form.reset(contentOf(bug));
      setFormError(undefined);
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!form.formState.isDirty) return close(false);
    setFormError(undefined);
    try {
      await updateBug.mutateAsync(values);
      toast.success('Bug updated');
      // Not close(): its reset would use this render's bug, i.e. the text from before the save.
      // `values` already follows the saved bug.
      onOpenChange(false);
    } catch (error) {
      setFormError(
        getErrorStatus(error) === 409
          ? 'Someone else changed this bug. Close this, check the latest, then edit again.'
          : getErrorMessage(error),
      );
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={`Edit ${bug.key}`}
      submitLabel="Save changes"
      size="lg"
      pending={updateBug.isPending}
      error={formError}
      onSubmit={onSubmit}
    >
      <FormProvider {...form}>
        <BugTitleField />
        <div className="sm:w-1/2 sm:pr-2">
          <BugModuleField modules={modules} />
        </div>
        <BugDescriptionField />
        <BugLinksField />
      </FormProvider>
    </FormDialog>
  );
}
