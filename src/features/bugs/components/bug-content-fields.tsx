'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Link2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { MAX_ATTACHMENTS, type BugContentValues } from '../schemas';

/*
 * The fields that describe a bug, shared by the report and edit dialogs. They read the form from
 * <FormProvider>, so each dialog keeps its own schema (report adds status, assignee, email) while
 * these only touch the paths both forms have.
 */

export function BugTitleField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<BugContentValues>();
  return (
    <Field id="bug-title" label="Title" error={errors.title?.message}>
      <Input
        id="bug-title"
        autoFocus
        placeholder="Cart badge count is off by one after removing the last item"
        aria-invalid={!!errors.title}
        {...register('title')}
      />
    </Field>
  );
}

/** Free text with the project's existing modules offered as you type (the browser's datalist). */
export function BugModuleField({ modules }: { modules: string[] }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<BugContentValues>();
  return (
    <Field
      id="bug-module"
      label="Module or screen"
      hint={modules.length ? 'Pick one already in use, or type a new one.' : undefined}
      error={errors.moduleName?.message}
    >
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
  );
}

export function BugDescriptionField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<BugContentValues>();
  return (
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
  );
}

/** A growable list of Google Drive links (name + URL per row). */
export function BugLinksField() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<BugContentValues>();
  const attachments = useFieldArray({ control, name: 'attachments' });

  return (
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
  );
}
