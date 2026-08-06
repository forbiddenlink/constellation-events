import type { LocationItem } from "@/lib/mock";
import type { DarkSkyLocation } from "@/lib/locations";

type LocationCardProps = {
  location: LocationItem | DarkSkyLocation;
};

function isDarkSkyLocation(location: LocationItem | DarkSkyLocation): location is DarkSkyLocation {
  return "distanceDisplay" in location;
}

// Deterministic starfield seeded from the location name — keeps the hero stable
// across renders without shipping per-location photography.
function seededStars(seed: string, count: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
  return Array.from({ length: count }, () => ({
    cx: Math.round(rand() * 100),
    cy: Math.round(rand() * 100),
    r: 0.4 + rand() * 1.1,
    o: 0.35 + rand() * 0.6,
  }));
}

export default function LocationCard({ location }: LocationCardProps) {
  const distance = isDarkSkyLocation(location) ? location.distanceDisplay : location.distance;
  const description = isDarkSkyLocation(location) ? location.description : location.note;
  const score = location.darkSkyScore;

  // Darker, clearer sky (higher score) => denser, brighter generated starfield.
  const density = Math.round(24 + (score / 100) * 60);
  const stars = seededStars(location.name, density);

  return (
    <div className="glass group overflow-hidden rounded-2xl">
      {/* Photo-first celestial hero */}
      <div className="relative h-28 w-full overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.28),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(129,140,248,0.26),transparent_50%),linear-gradient(180deg,#050A14_0%,#020204_100%)]" />
        <svg
          className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {stars.map((s, i) => (
            <circle
              key={i}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill="#F1F5F9"
              opacity={s.o}
              className="animate-pulseSoft motion-reduce:animate-none"
              style={{ animationDelay: `${(i % 6) * 0.7}s` }}
            />
          ))}
        </svg>
        <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-right backdrop-blur">
          <span className="font-mono text-lg font-semibold text-aurora">{score}</span>
          <span className="ml-1 text-[10px] uppercase tracking-[0.2em] text-starlight/50">/100</span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-starlight">{location.name}</h3>
        <p className="text-xs text-starlight/50">{distance} away</p>
        <p className="mt-3 text-sm text-starlight/70">{description}</p>
        <div className="mt-4 text-xs text-starlight/50">Best viewing: {location.bestWindow}</div>
      </div>
    </div>
  );
}
