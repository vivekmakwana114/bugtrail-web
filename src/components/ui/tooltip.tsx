'use client';

import type { ReactNode } from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';

type TooltipProps = {
  label: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
};

/**
 * Short, supplementary text on hover/focus (an icon button's name, a full timestamp).
 * Never put anything a user needs only in a tooltip: touch screens can't hover.
 */
export function Tooltip({ label, side = 'top', children }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={350}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className="z-50 max-w-xs rounded-sm bg-ink px-2 py-1 text-xs text-bg"
          >
            {label}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
