'use client';

import { cn } from '@/lib/utils';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Shown after the label in mono (how many items the choice holds). */
  count?: number;
};

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** 'pill': rounded track, used by the dashboard filters and the projects status tabs. */
  variant?: 'default' | 'pill';
  className?: string;
};

/**
 * A small set of mutually exclusive choices shown side by side (theme, project status filter).
 * Buttons with aria-pressed: simple for screen readers, and the selected one is solid ink.
 */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  variant = 'default',
  className,
}: SegmentedProps<T>) {
  const pill = variant === 'pill';
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        pill
          ? // max-w-full + overflow: on a phone a wide pill scrolls inside itself, not the page.
            'inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-line bg-surface p-1'
          : 'inline-flex overflow-hidden rounded-md border border-line-strong bg-surface',
        className,
      )}
    >
      {options.map((option, i) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'group inline-flex items-baseline gap-2 text-sm whitespace-nowrap text-ink-2 hover:text-ink aria-pressed:bg-ink aria-pressed:text-bg',
            pill ? 'shrink-0 rounded-full px-3 py-1 transition-colors sm:px-4' : 'px-3 py-1.5',
            // Short codes (7d, 30d) read as values, so they're mono; words with a count aren't.
            pill && option.count === undefined && 'font-mono',
            !pill && i > 0 && 'border-l border-line-strong',
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="font-mono text-xs text-ink-3 group-aria-pressed:text-bg">
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
