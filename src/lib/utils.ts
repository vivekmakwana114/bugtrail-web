import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge must know our custom scale (globals.css @theme), otherwise it can't tell that
 * `text-md` (a size) and `text-ink` (a colour) don't conflict, or that `bg-surface` overrides `bg-bg`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        'bg',
        'surface',
        'sunken',
        'line',
        'line-strong',
        'ink',
        'ink-2',
        'ink-3',
        'reported',
        'ongoing',
        'resolved',
        'pass',
        'failed',
        'danger',
      ],
      text: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'display'],
      radius: ['sm', 'md', 'full'],
      shadow: ['pop', 'cursor'],
    },
  },
});

/** Join class names, letting later Tailwind classes win over earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Make user text safe to put inside a RegExp ("C++ (beta)" matches literally). */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
