import Link from 'next/link';

// Placeholder until auth and the panel layout land (next Phase 7 steps): `/` will redirect to
// /login or /projects. Until then it points at the design system preview.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-2 px-8">
      <h1 className="text-2xl font-semibold tracking-tight">BugTrail</h1>
      <p className="text-sm text-ink-2">
        Design system ready. See it at{' '}
        <Link href="/design" className="font-mono text-ink underline underline-offset-2">
          /design
        </Link>{' '}
        (development only).
      </p>
    </main>
  );
}
