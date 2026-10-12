'use client';

import type { ComponentProps } from 'react';
import { DropdownMenu as MenuPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = 'end',
  ...props
}: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-44 rounded-md border border-line-strong bg-surface p-1 text-sm shadow-pop',
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

type ItemProps = ComponentProps<typeof MenuPrimitive.Item> & { tone?: 'default' | 'danger' };

export function DropdownMenuItem({ className, tone = 'default', ...props }: ItemProps) {
  return (
    <MenuPrimitive.Item
      className={cn(
        'flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-sunken [&_svg]:size-4',
        tone === 'danger' ? 'text-danger' : 'text-ink',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Label>) {
  return (
    <MenuPrimitive.Label className={cn('px-2 py-1.5 text-xs text-ink-3', className)} {...props} />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn('my-1 h-px bg-line', className)} {...props} />;
}
