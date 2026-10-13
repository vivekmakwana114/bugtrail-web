import { z } from 'zod';

/** The API accepts http(s) URLs up to 2048 characters (bugtrail-api user.validation.js). */
const isWebUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(100, 'Keep it under 100 characters.'),
  /** Empty means "no picture" (sent as null). */
  avatarUrl: z
    .string()
    .trim()
    .max(2048, 'That link is too long.')
    .refine((value) => value === '' || isWebUrl(value), 'Paste a full link starting with https://'),
});

export type ProfileValues = z.infer<typeof profileSchema>;
