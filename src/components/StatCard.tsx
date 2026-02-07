export default function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-[0.3em] text-starlight/40">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-starlight">{value}</div>
      <div className="mt-2 text-xs text-starlight/60">{detail}</div>
    </div>
  );
}
