import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Links under the card: "No account? Request access" */
  footer?: ReactNode;
};

/** The panel every auth screen sits in: a title, one job, and a way out underneath. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="grid gap-4">
      <section className="grid gap-5 rounded-md border border-line bg-surface p-6">
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-ink-2">{description}</p>}
        </div>
        {children}
      </section>
      {footer && <div className="px-1 text-sm text-ink-2">{footer}</div>}
    </div>
  );
}

/** Inline text link used in auth footers and hints. */
export const linkClasses = 'font-medium text-ink underline underline-offset-2 hover:no-underline';
