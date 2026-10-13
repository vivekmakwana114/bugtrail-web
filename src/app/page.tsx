import { GoToHome } from '@/components/auth/guards';

// Decided in the browser after the session check: see GoToHome.
export const instant = false;

/** "/" has no page of its own: it sends you to your home page (by role), or to sign in. */
export default function Home() {
  return <GoToHome />;
}
