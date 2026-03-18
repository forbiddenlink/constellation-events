'use client'
import Link from 'next/link'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
      <div className="text-xs uppercase tracking-[0.3em] text-ember/70">System Error</div>
      <h2 className="mt-2 font-display text-2xl text-starlight">Something went wrong</h2>
      <p className="mt-3 max-w-md text-sm text-starlight/60">
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className="mt-6 flex items-center gap-4">
        <button onClick={reset} className="button-primary">
          Try again
        </button>
        <Link href="/" className="button-ghost">Return home</Link>
      </div>
    </div>
  )
}
