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
    <div className="mb-8">
      <div className="eyebrow">{eyebrow}</div>
      <Heading className="display-sm">{title}</Heading>
      <p className="lede mt-3 max-w-2xl">{subtitle}</p>
    </div>
  );
}
