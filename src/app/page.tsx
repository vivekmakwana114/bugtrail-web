import { redirect } from 'next/navigation';
import { routes } from '@/config/routes';

/** "/" has no page of its own: the panel guard sends signed-out users on to /login. */
export default function Home() {
  redirect(routes.home);
}
