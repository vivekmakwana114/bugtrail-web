'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { FormDialog } from '@/components/templates/form-dialog';
import { routes } from '@/config/routes';
import { getErrorMessage } from '@/lib/api-client';
import { useCreateProject } from '../hooks';
import { createProjectSchema, suggestProjectKey, type CreateProjectValues } from '../schemas';

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * New project (Admin: project:create). The key prefixes every bug (CHK-142) and can never change,
 * so it's suggested from the name but always editable, and the hint says why it matters.
 */
export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter();
  const createProject = useCreateProject();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    getFieldState,
    formState: { errors },
  } = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', key: '', description: '' },
  });

  const close = (next: boolean) => {
    if (!next) {
      reset();
      setFormError(undefined);
    }
    onOpenChange(next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      const project = await createProject.mutateAsync(values);
      toast.success('Project created', { description: `${project.name} (${project.key})` });
      close(false);
      router.push(routes.project(project.key));
    } catch (error) {
      const message = getErrorMessage(error);
      // "Project key already taken" belongs next to the key field.
      if (/key/i.test(message)) setError('key', { message });
      else setFormError(message);
    }
  });

  const nameField = register('name', {
    onChange: (event) => {
      // Keep suggesting a key until the person types their own.
      if (!getFieldState('key').isDirty) {
        setValue('key', suggestProjectKey(event.target.value), { shouldValidate: false });
      }
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title="New project"
      description="Add members on the project page after it's created."
      submitLabel="Create project"
      pending={createProject.isPending}
      error={formError}
      onSubmit={onSubmit}
    >
      <Field id="project-name" label="Name" error={errors.name?.message}>
        <Input id="project-name" autoFocus aria-invalid={!!errors.name} {...nameField} />
      </Field>
      <Field
        id="project-key"
        label="Key"
        hint="Starts every bug key, like CHK-142. It can't be changed later."
        error={errors.key?.message}
      >
        <Input
          id="project-key"
          className="w-40 font-mono uppercase"
          maxLength={10}
          aria-invalid={!!errors.key}
          {...register('key')}
        />
      </Field>
      <Field
        id="project-description"
        label="Description (optional)"
        error={errors.description?.message}
      >
        <Textarea
          id="project-description"
          rows={3}
          aria-invalid={!!errors.description}
          {...register('description')}
        />
      </Field>
    </FormDialog>
  );
}
