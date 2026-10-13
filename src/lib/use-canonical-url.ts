'use client';

import { useEffect, useEffectEvent } from 'react';

/**
 * Show the canonical address (/projects/BT/bugs/BT-1) after the page opened from another one
 * (an old id link, a lowercase key) WITHOUT navigating. history.replaceState, which Next.js
 * syncs with its router, changes the address bar but doesn't re-mount the page, so nothing
 * flashes and nothing the user is typing is lost (router.replace did both).
 *
 * The URL params then switch to the canonical values, so `seedCache` must first store the data
 * already loaded under the canonical query keys, or the page would briefly load again.
 * @param canonicalPath the path to show, once the data that decides it has loaded
 * @param seedCache copy the loaded data under the canonical query keys
 */
export function useCanonicalUrl(canonicalPath: string | undefined, seedCache: () => void) {
  const seed = useEffectEvent(seedCache);
  useEffect(() => {
    if (!canonicalPath || decodeURIComponent(window.location.pathname) === canonicalPath) return;
    seed();
    window.history.replaceState(null, '', `${canonicalPath}${window.location.search}`);
  }, [canonicalPath]);
}
