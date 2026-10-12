import { z } from 'zod';
import type { ProjectStatus } from '@/types/api';

/* Mirrors bugtrail-api src/validations/project.validation.js. */

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name the project.').max(100, 'Keep it under 100 characters.'),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9]{1,9}$/, '2–10 letters or digits, starting with a letter, like CHK.'),
  description: z.string().trim().max(2000, 'Keep it under 2,000 characters.'),
});

export type CreateProjectValues = z.infer<typeof createProjectSchema>;

/**
 * Suggest a key from the name while the user hasn't typed one: initials for several words
 * ("Checkout revamp" → "CR"), the first letters for one word ("Warehouse" → "WARE").
 */
export function suggestProjectKey(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const key = words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] ?? '').slice(0, 4);
  return key.replace(/^[0-9]+/, '').slice(0, 10);
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
};
