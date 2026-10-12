'use client';

import { useEffect, useEffectEvent, useState, type RefObject } from 'react';

/** Don't steal keys from someone typing, or from menus and dialogs. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    !!target.closest('[role="dialog"], [role="menu"], [role="listbox"]')
  );
}

type GridKeyboardOptions = {
  rowCount: number;
  onOpen: (index: number) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  /** c: report a bug. Leave out when the user can't. */
  onCreate?: () => void;
};

/**
 * Keyboard-first grid: j / k move the cursor row, Enter opens it, / jumps to search,
 * c reports a bug.
 * Returns the cursor index (-1 = none yet) and a setter, so clicks can move it too.
 */
export function useGridKeyboard({ rowCount, onOpen, searchRef, onCreate }: GridKeyboardOptions) {
  const [cursor, setCursor] = useState(-1);
  // Keep the cursor on a real row when the list shrinks (a new filter).
  const index = Math.min(cursor, rowCount - 1);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
    if (event.key === 'j' && rowCount > 0) {
      event.preventDefault();
      setCursor(Math.min(index + 1, rowCount - 1));
    } else if (event.key === 'k' && rowCount > 0) {
      event.preventDefault();
      setCursor(Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && index >= 0) {
      event.preventDefault();
      onOpen(index);
    } else if (event.key === '/') {
      event.preventDefault();
      searchRef.current?.focus();
    } else if (event.key === 'c' && onCreate) {
      event.preventDefault();
      onCreate();
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);

  // Keep the cursor row on screen as it moves.
  useEffect(() => {
    if (index >= 0) {
      document.querySelector(`[data-row-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [index]);

  return { cursor: index, setCursor };
}
