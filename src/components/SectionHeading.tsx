export default function SectionHeading({
  eyebrow,
  title,
  subtitle
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-[0.3em] text-aurora/70">{eyebrow}</div>
      <h2 className="font-display text-2xl text-starlight sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-starlight/70">{subtitle}</p>
    </div>
  );
}
