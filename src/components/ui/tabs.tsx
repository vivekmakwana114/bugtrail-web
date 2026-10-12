'use client';

import type { ComponentProps } from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

/** Underlined tabs on a hairline, not boxed pills. */
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List className={cn('flex gap-5 border-b border-line', className)} {...props} />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        '-mb-px inline-flex items-center gap-2 border-b-2 border-transparent pb-2 text-sm font-medium text-ink-2 hover:text-ink data-[state=active]:border-ink data-[state=active]:text-ink',
        className,
      )}
      {...props}
    />
  );
}
