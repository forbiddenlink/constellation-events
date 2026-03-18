'use client'
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#020204', color: '#F1F5F9', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#F472B6', opacity: 0.7 }}>System Error</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>Something went wrong</h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: '0.75rem', maxWidth: '24rem' }}>
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#38BDF8', color: '#050A14', border: 'none', borderRadius: '0.75rem', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
