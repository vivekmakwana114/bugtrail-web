'use client';

import { Segmented, type SegmentedOption } from '@/components/ui/segmented';
import type { ThemePreference } from './theme';
import { useThemePreference } from './use-theme-preference';

const OPTIONS: SegmentedOption<ThemePreference>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** System / Light / Dark. Lives in the profile menu. */
export function ThemeToggle({ className }: { className?: string }) {
  const [preference, setPreference] = useThemePreference();
  return (
    <Segmented
      label="Theme"
      value={preference}
      onChange={setPreference}
      options={OPTIONS}
      className={className}
    />
  );
}
