'use client';

import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FormDialog } from '@/components/templates/form-dialog';
import { roleWithDesignation } from '@/config/roles';
import { getErrorMessage } from '@/lib/api-client';
import type { ProjectDetail } from '@/types/api';
import { useAddMembers, useMemberCandidates } from '../hooks';

type AddMembersDialogProps = {
  project: ProjectDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Pick people to add to the project: everyone active who isn't on it yet, searchable by name,
 * email or role. Each person added gets the usual "You were added" notification (from the API).
 */
export function AddMembersDialog({ project, open, onOpenChange }: AddMembersDialogProps) {
  const candidates = useMemberCandidates(open);
  const addMembers = useAddMembers(project);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState<string>();

  const memberIds = new Set(project.members.map((member) => member.id));
  const query = search.trim().toLowerCase();
  const people = (candidates.data ?? [])
    .filter((user) => !memberIds.has(user.id))
    .filter(
      (user) =>
        !query ||
        [user.name, user.email, roleWithDesignation(user.role, user.designation)].some((text) =>
          text.toLowerCase().includes(query),
        ),
    );

  const change = (next: boolean) => {
    if (!next) {
      setSelected(new Set());
      setSearch('');
      setFormError(undefined);
    }
    onOpenChange(next);
  };

  const toggle = (userId: string, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(userId);
      else next.delete(userId);
      return next;
    });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selected.size === 0) {
      setFormError('Pick at least one person to add.');
      return;
    }
    setFormError(undefined);
    addMembers.mutate([...selected], {
      onSuccess: () => {
        toast.success(
          `Added ${selected.size} ${selected.size === 1 ? 'member' : 'members'} to ${project.name}`,
        );
        change(false);
      },
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  };

  const count = selected.size;
  return (
    <FormDialog
      open={open}
      onOpenChange={change}
      title={`Add members to ${project.name}`}
      description="They'll see the project and its bugs, and get a notification."
      submitLabel={count > 1 ? `Add ${count} members` : 'Add member'}
      pending={addMembers.isPending}
      error={formError}
      onSubmit={onSubmit}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-3"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Search people"
          placeholder="Search name, email or role"
          className="pl-8"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {candidates.isPending ? (
        <div className="grid gap-2" aria-busy="true" aria-label="Loading people">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : candidates.isError ? (
        <p role="alert" className="text-sm text-danger">
          The people list didn&apos;t load: {getErrorMessage(candidates.error)}
        </p>
      ) : people.length === 0 ? (
        <p className="py-4 text-sm text-ink-3">
          {query
            ? `Nobody matches "${search.trim()}".`
            : 'Everyone active is already on this project.'}
        </p>
      ) : (
        <ul
          aria-label="People who can be added"
          className="-mx-1 grid max-h-72 gap-0.5 overflow-y-auto px-1"
        >
          {people.map((user) => {
            const id = `add-member-${user.id}`;
            return (
              <li key={user.id}>
                <label
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-1.5 hover:bg-sunken"
                >
                  <Checkbox
                    id={id}
                    checked={selected.has(user.id)}
                    onCheckedChange={(checked) => toggle(user.id, checked === true)}
                  />
                  <Avatar name={user.name} src={user.avatarUrl} size="md" />
                  <span className="grid min-w-0">
                    <span className="truncate text-sm font-medium">{user.name}</span>
                    <span className="truncate text-xs text-ink-3">
                      {roleWithDesignation(user.role, user.designation)} · {user.email}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </FormDialog>
  );
}
