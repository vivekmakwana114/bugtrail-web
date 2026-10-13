'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/**
 * A small rounded square: initials in mono, or the user's picture when they've set one.
 * The picture is any URL a user pasted, so it can break (a deleted file, a share page instead
 * of an image); then it falls back to initials rather than a broken-image icon.
 */
export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  // Remember which URL failed, not just "failed", so a new URL gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && src !== failedSrc;

  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-sm border border-line bg-sunken font-mono font-semibold text-ink-2',
        size === 'sm' && 'size-5.5 text-xs leading-none',
        size === 'md' && 'size-8 text-xs',
        size === 'lg' && 'size-16 text-lg',
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL on any host
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
