import { Avatar } from '@/components/ui/avatar';
import type { SelectOption } from '@/components/ui/select';
import type { UserSummary } from '@/types/api';

/** Radix Select can't hold an empty value, so "nobody" is this sentinel in the UI only. */
export const UNASSIGNED = 'none';

/**
 * Who a bug can be assigned to: active project members with a role (every role has bug:progress,
 * which the API requires). Pending or suspended accounts can't be assigned.
 */
export function assigneeOptions(members: UserSummary[]): SelectOption[] {
  return [
    { value: UNASSIGNED, label: 'Unassigned' },
    ...members
      .filter((member) => member.status === 'active' && member.role)
      .map((member) => ({
        value: member.id,
        label: member.name,
        icon: <Avatar name={member.name} src={member.avatarUrl} />,
      })),
  ];
}
