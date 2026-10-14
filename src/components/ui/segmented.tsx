'use client';

import { cn } from '@/lib/utils';

export type SegmentedOption<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** 'pill': rounded track with mono labels, used only by the dashboard's filters. */
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
          ? 'inline-flex gap-0.5 rounded-full border border-line bg-surface p-1'
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
            'whitespace-nowrap text-ink-2 hover:text-ink aria-pressed:bg-ink aria-pressed:text-bg',
            pill
              ? 'rounded-full px-4 py-1 font-mono text-sm transition-colors'
              : 'px-3 py-1.5 text-sm',
            !pill && i > 0 && 'border-l border-line-strong',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
