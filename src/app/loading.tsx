export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-aurora border-t-transparent" />
      <p className="text-sm text-starlight/60">Loading...</p>
    </div>
  )
}
