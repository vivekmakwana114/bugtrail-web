'use client';

import type { ReactNode } from 'react';
import { Select as SelectPrimitive } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlClasses } from './input';

export type SelectOption = {
  value: string;
  label: string;
  /** Shown before the label, e.g. a status glyph or an avatar. */
  icon?: ReactNode;
  disabled?: boolean;
};

type SelectProps = {
  id?: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  /** Required when there's no visible <label> (filters in a toolbar). */
  'aria-label'?: string;
};

/** A single-choice dropdown built from an options list, so every select looks and behaves the same. */
export function Select({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Choose…',
  disabled,
  className,
  ...aria
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          controlClasses,
          'flex h-8 items-center justify-between gap-2 text-left data-[placeholder]:text-ink-3',
          className,
        )}
        {...aria}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-ink-3" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-line-strong bg-surface shadow-pop"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-7 pl-2 text-sm outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-sunken"
              >
                {option.icon}
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2">
                  <Check className="size-3.5" aria-hidden />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
