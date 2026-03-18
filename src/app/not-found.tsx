import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
      <div className="text-xs uppercase tracking-[0.3em] text-aurora/70">Signal Lost</div>
      <h2 className="mt-2 font-display text-2xl text-starlight">404 — Page Not Found</h2>
      <p className="mt-3 max-w-md text-sm text-starlight/60">
        The coordinates you entered don&apos;t match any known location in our star charts.
      </p>
      <Link href="/" className="button-primary mt-6">Return home</Link>
    </div>
  )
}
