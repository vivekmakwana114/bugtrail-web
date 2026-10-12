'use client';

import type { ThemePreference } from './theme';
import { useThemePreference } from './use-theme-preference';
import { cn } from '@/lib/utils';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Segmented control for the theme. Lives in the profile menu once the layout exists. */
export function ThemeToggle({ className }: { className?: string }) {
  const [preference, setPreference] = useThemePreference();
  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn('inline-flex overflow-hidden rounded-md border border-line-strong', className)}
    >
      {OPTIONS.map((option, i) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={preference === option.value}
          onClick={() => setPreference(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm text-ink-2 aria-pressed:bg-ink aria-pressed:text-bg',
            i > 0 && 'border-l border-line-strong',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
