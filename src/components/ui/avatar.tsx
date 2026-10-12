import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md';
  className?: string;
};

/** A small rounded square: initials in mono, or the user's picture when they've set one. */
export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-sm border border-line bg-sunken font-mono font-semibold text-ink-2',
        size === 'sm' ? 'size-5.5 text-xs leading-none' : 'size-8 text-xs',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL on any host
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
