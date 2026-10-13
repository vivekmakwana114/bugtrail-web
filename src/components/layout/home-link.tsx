'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { homePathFor } from '@/config/routes';
import { useAuth } from '@/providers/auth-provider';

/** The logo link: goes to your home page, which depends on your role (see homePathFor). */
export function HomeLink(props: Omit<ComponentProps<typeof Link>, 'href'>) {
  const { user } = useAuth();
  return <Link href={homePathFor(user?.role ?? null)} aria-label="BugTrail home" {...props} />;
}
