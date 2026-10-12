import type { UserRef } from '@/types/api';

/** A chat message. A deleted one stays in the thread as a tombstone (deleted, body null). */
export type ChatMessage = {
  id: string;
  bugId: string;
  /** null if the sender's account was deleted since */
  sender: UserRef | null;
  body: string | null;
  mentions: UserRef[];
  editedAt: string | null;
  deleted: boolean;
  createdAt: string;
};

/** Newest page first; inside a page, oldest first. Pass nextCursor as `before` for older ones. */
export type MessagePage = { messages: ChatMessage[]; nextCursor: string | null };
