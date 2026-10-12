import type { ReactNode } from 'react';
import { Lock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/*
 * The three non-happy states every list and page must handle (loading is a skeleton shaped like
 * the content, owned by each screen). No illustrations: a sentence and the next action.
 */

type StateProps = {
  title: string;
  description?: ReactNode;
  /** The next step, e.g. <Button>Report bug</Button>. An empty state without one is a dead end. */
  action?: ReactNode;
  className?: string;
};

function StateFrame({
  icon,
  title,
  description,
  action,
  className,
}: StateProps & { icon?: ReactNode }) {
  return (
    <div
      className={cn(
        'grid justify-items-start gap-2 rounded-md border border-dashed border-line-strong px-6 py-10',
        className,
      )}
    >
      {icon}
      <p className="text-md font-semibold text-ink">{title}</p>
      {description && <p className="max-w-prose text-sm text-ink-2">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Nothing here yet. Say what will appear and how to add the first one. */
export function EmptyState(props: StateProps) {
  return <StateFrame {...props} />;
}

type ErrorStateProps = Omit<StateProps, 'action'> & { onRetry?: () => void };

/** Loading failed. Say what failed in plain words and offer Retry. */
export function ErrorState({ onRetry, ...props }: ErrorStateProps) {
  return (
    <StateFrame
      {...props}
      className={cn('border-danger/40', props.className)}
      action={
        onRetry && (
          <Button size="sm" onClick={onRetry}>
            <RotateCcw aria-hidden />
            Retry
          </Button>
        )
      }
    />
  );
}

/** The API answered 403. Name who can help, don't just say "forbidden". */
export function NoAccessState({
  title = "You don't have access to this",
  ...props
}: Partial<StateProps>) {
  return (
    <StateFrame
      {...props}
      title={title}
      icon={<Lock className="size-4 text-ink-3" aria-hidden />}
      description={props.description ?? 'Ask an Admin if you need it for your work.'}
    />
  );
}
