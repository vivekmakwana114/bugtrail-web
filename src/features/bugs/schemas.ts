import { z } from 'zod';
import { BUG_STATUSES } from '@/config/statuses';

/* Mirrors bugtrail-api src/validations/bug.validation.js (createBug). */

/** Attachments are Google Drive / Docs links only: BugTrail stores links, never files. */
const DRIVE_HOSTS = ['drive.google.com', 'docs.google.com'];

function isDriveUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && DRIVE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

export const MAX_ATTACHMENTS = 20;

const attachmentSchema = z.object({
  title: z.string().trim().min(1, 'Name the link.').max(200, 'Keep it under 200 characters.'),
  url: z
    .string()
    .trim()
    .min(1, 'Paste the Drive link.')
    .max(2048, 'That link is too long.')
    .refine(isDriveUrl, 'Use a Google Drive link (drive.google.com or docs.google.com).'),
});

/** What a bug says: shared by the report form and the edit form. */
export const bugContentSchema = z.object({
  title: z.string().trim().min(1, 'Say what went wrong.').max(200, 'Keep it under 200 characters.'),
  moduleName: z
    .string()
    .trim()
    .min(1, 'Which screen or module? Pick one or type a new one.')
    .max(100, 'Keep it under 100 characters.'),
  description: z.string().trim().max(10_000, 'Keep it under 10,000 characters.'),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS),
});

export type BugContentValues = z.infer<typeof bugContentSchema>;

export const reportBugSchema = bugContentSchema.extend({
  status: z.enum(BUG_STATUSES),
  /** '' = unassigned (Radix Select can't hold null) */
  assignee: z.string(),
  sendEmail: z.boolean(),
});

export type ReportBugValues = z.infer<typeof reportBugSchema>;

/** The edit form has the same fields as the report form (content, assignee, status, email). */
export const editBugSchema = reportBugSchema;
export type EditBugValues = ReportBugValues;

export const reportBugDefaults: ReportBugValues = {
  title: '',
  moduleName: '',
  description: '',
  attachments: [],
  status: 'reported',
  assignee: '',
  sendEmail: false,
};
