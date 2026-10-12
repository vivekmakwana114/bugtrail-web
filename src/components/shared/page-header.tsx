import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: ReactNode;
  /** Small mono line above the title: a ticket key, a project key. */
  eyebrow?: ReactNode;
  /** One line under the title. Skip it when it would only repeat the title. */
  description?: ReactNode;
  /** Buttons on the right. At most one primary. */
  actions?: ReactNode;
  className?: string;
};

/** Title row for every page. Typography carries the hierarchy: no banner, no box. */
export function PageHeader({ title, eyebrow, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="grid min-w-0 gap-1">
        {eyebrow && <span className="font-mono text-xs text-ink-3">{eyebrow}</span>}
        <h1 className="text-xl font-semibold tracking-tight text-balance text-ink">{title}</h1>
        {description && <p className="max-w-prose text-sm text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
