import type { UserRef } from '@/types/api';

export type NotificationType =
  | 'bug_assigned'
  | 'bug_status_changed'
  | 'bug_message'
  | 'bug_mentioned'
  | 'project_member_added'
  | 'user_registered';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** web app path to open, e.g. /projects/<id>/bugs/BT-42 */
  link: string | null;
  entity: { kind: 'bug' | 'project' | 'user'; id: string; projectId?: string; key?: string } | null;
  actor: UserRef | null;
  readAt: string | null;
  createdAt: string;
};
