/**
 * Theme preference: what the user chose ("system" follows the OS).
 * The resolved theme ("light" | "dark") lives on <html data-theme>, and the tokens in globals.css
 * switch on it. Shared by the inline ThemeScript (before paint) and useThemePreference (after).
 */
export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'bt-theme';
export const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Runs in <head> before the first paint, so there's no light flash for dark-mode users. */
export const themeBootScript = `(function(){var d=document.documentElement;try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');var dark=p==='dark'||(p!=='light'&&window.matchMedia('${DARK_QUERY}').matches);d.setAttribute('data-theme',dark?'dark':'light')}catch(e){d.setAttribute('data-theme','light')}})()`;
