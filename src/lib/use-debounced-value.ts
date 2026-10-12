'use client';

import { useEffect, useState } from 'react';

/**
 * The value, but only after it stopped changing for `delay` ms. For search boxes: one request
 * when the person pauses typing, not one per keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
