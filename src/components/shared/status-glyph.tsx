import type { BugStatus } from '@/types/api';
import { STATUS_TEXT } from '@/config/statuses';
import { cn } from '@/lib/utils';

/*
 * Every status has a shape as well as a colour, so it reads for colour-blind users and in
 * greyscale. The circle fills up as a ticket moves along; Failed is the one that turns back.
 */
const shapes: Record<BugStatus, React.ReactNode> = {
  reported: <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />,
  ongoing: (
    <>
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" />
    </>
  ),
  resolved: (
    <>
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8" cy="8" r="2.6" fill="currentColor" />
    </>
  ),
  pass: (
    <>
      <circle cx="8" cy="8" r="6.5" fill="currentColor" />
      <path
        d="M5 8.2l2 2 4-4.2"
        fill="none"
        stroke="var(--bt-surface)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  failed: (
    <>
      <path
        d="M12.6 9.6A4.9 4.9 0 1 1 11 4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M11.9 1.6v3.5H8.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

type StatusGlyphProps = {
  status: BugStatus;
  className?: string;
};

/** Decorative: always shown next to the status label or inside something that names it. */
export function StatusGlyph({ status, className }: StatusGlyphProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={cn('size-3.5 shrink-0', STATUS_TEXT[status], className)}
    >
      {shapes[status]}
    </svg>
  );
}
