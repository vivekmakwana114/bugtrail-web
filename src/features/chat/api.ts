import { api } from '@/lib/api-client';
import type { ChatMessage, MessagePage } from './types';

export const MESSAGES_PAGE_SIZE = 30;

export async function getMessages(bugId: string, before?: string): Promise<MessagePage> {
  const { data } = await api.get<MessagePage>(`/bugs/${bugId}/messages`, {
    params: { before, limit: MESSAGES_PAGE_SIZE },
  });
  return data;
}

export async function sendMessage(
  bugId: string,
  input: { body: string; mentions: string[] },
): Promise<ChatMessage> {
  const { data } = await api.post<ChatMessage>(`/bugs/${bugId}/messages`, input);
  return data;
}

export async function editMessage(messageId: string, body: string): Promise<ChatMessage> {
  const { data } = await api.patch<ChatMessage>(`/messages/${messageId}`, { body });
  return data;
}

export async function deleteMessage(messageId: string): Promise<void> {
  await api.delete(`/messages/${messageId}`);
}
