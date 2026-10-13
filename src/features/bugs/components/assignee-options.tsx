import { Avatar } from '@/components/ui/avatar';
import type { SelectOption } from '@/components/ui/select';
import type { UserSummary } from '@/types/api';

/** Radix Select can't hold an empty value, so "nobody" is this sentinel in the UI only. */
export const UNASSIGNED = 'none';

/**
 * Who a bug can be assigned to, from GET /users/assignable (useAssignableUsers): active users who
 * can work on bugs, on the project or not. Assigning someone who isn't on it adds them.
 */
export function assigneeOptions(users: UserSummary[]): SelectOption[] {
  return [
    { value: UNASSIGNED, label: 'Unassigned' },
    ...users.map((user) => ({
      value: user.id,
      label: user.name,
      icon: <Avatar name={user.name} src={user.avatarUrl} />,
    })),
  ];
}

/** Under an assignee picker: assigning isn't limited to the project's current members. */
export const ASSIGNEE_HINT = 'Not on this project yet? Assigning them adds them to it.';
