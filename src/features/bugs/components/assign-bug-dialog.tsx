'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { FormDialog } from '@/components/templates/form-dialog';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { useAssignableUsers, useAssignBug } from '../hooks';
import type { BugDetail } from '../types';
import { ASSIGNEE_HINT, assigneeOptions, UNASSIGNED } from './assignee-options';

type AssignBugDialogProps = {
  bug: BugDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Change who works on the bug (bug:assign). The new assignee is notified; email is opt-in. */
export function AssignBugDialog({ bug, open, onOpenChange }: AssignBugDialogProps) {
  const assignBug = useAssignBug(bug);
  const assignable = useAssignableUsers();
  const current = bug.assignee?.id ?? UNASSIGNED;
  // undefined = not picked yet: show whoever has the bug now (even if that changed meanwhile).
  const [picked, setPicked] = useState<string>();
  const choice = picked ?? current;
  const [sendEmail, setSendEmail] = useState(false);
  const [error, setError] = useState<string>();

  const close = (next: boolean) => {
    if (!next) {
      setPicked(undefined);
      setSendEmail(false);
      setError(undefined);
    }
    onOpenChange(next);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (choice === current) return close(false);
    setError(undefined);
    try {
      const assignee = choice === UNASSIGNED ? null : choice;
      const updated = await assignBug.mutateAsync({ assignee, sendEmail: !!assignee && sendEmail });
      toast.success(
        updated.assignee ? `Assigned to ${updated.assignee.name}` : `${updated.key} is unassigned`,
      );
      close(false);
    } catch (err) {
      setError(
        getErrorStatus(err) === 409
          ? 'Someone else reassigned this bug a moment ago. The page now shows who has it; choose again.'
          : getErrorMessage(err),
      );
      if (getErrorStatus(err) === 409) setPicked(undefined);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={`Assign ${bug.key}`}
      description={bug.title}
      submitLabel="Assign"
      size="sm"
      pending={assignBug.isPending}
      error={error}
      footerStart={
        <label htmlFor="assign-send-email" className="inline-flex items-center gap-2 text-sm">
          <Checkbox
            id="assign-send-email"
            checked={choice !== UNASSIGNED && sendEmail}
            onCheckedChange={(checked) => setSendEmail(checked === true)}
            disabled={choice === UNASSIGNED}
          />
          <span className={choice === UNASSIGNED ? 'text-ink-3' : undefined}>Email them</span>
        </label>
      }
      onSubmit={onSubmit}
    >
      <Field id="assign-to" label="Assignee" hint={ASSIGNEE_HINT}>
        <Select
          id="assign-to"
          value={choice}
          onValueChange={setPicked}
          options={assigneeOptions(assignable.data ?? [])}
        />
      </Field>
    </FormDialog>
  );
}
