'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';
import { toImageUrl } from '@/lib/image-url';

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/**
 * A small rounded square: initials in mono, or the user's picture when they've set one.
 * The picture is any URL a user pasted. Google Drive share links are turned into a direct image
 * URL (toImageUrl), so they show too. It can still break (a deleted file, a file that isn't
 * shared publicly); then it falls back to initials rather than a broken-image icon.
 */
export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  const imageUrl = src ? toImageUrl(src) : null;
  // Remember which URL failed, not just "failed", so a new URL gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!imageUrl && imageUrl !== failedSrc;

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
          src={imageUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedSrc(imageUrl)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
