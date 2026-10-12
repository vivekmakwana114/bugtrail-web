'use client';

import { useSyncExternalStore } from 'react';
import { DARK_QUERY, THEME_STORAGE_KEY, type ThemePreference } from './theme';

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system'; // storage blocked (private mode, policies)
  }
}

function applyPreference(preference: ThemePreference): void {
  const dark =
    preference === 'dark' || (preference === 'system' && window.matchMedia(DARK_QUERY).matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

/** Save the choice, apply it, and tell every subscribed component. */
export function setThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Not saved, but still applied for this visit.
  }
  applyPreference(preference);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // While on "system", follow the OS switching between light and dark.
  const media = window.matchMedia(DARK_QUERY);
  const onOsChange = () => {
    if (readPreference() === 'system') applyPreference('system');
  };
  media.addEventListener('change', onOsChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', onOsChange);
  };
}

/**
 * The saved theme preference and a setter. The server renders "system" (it can't read
 * localStorage); useSyncExternalStore swaps in the real value right after hydration without a
 * mismatch error. The page colours are already right before that, thanks to ThemeScript.
 */
export function useThemePreference(): [ThemePreference, (preference: ThemePreference) => void] {
  const preference = useSyncExternalStore(subscribe, readPreference, () => 'system' as const);
  return [preference, setThemePreference];
}
