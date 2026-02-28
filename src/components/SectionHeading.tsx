export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  as: Heading = "h2"
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-[0.3em] text-aurora/70">{eyebrow}</div>
      <Heading className="font-display text-2xl text-starlight sm:text-3xl">{title}</Heading>
      <p className="mt-2 max-w-2xl text-sm text-starlight/70">{subtitle}</p>
    </div>
  );
}
