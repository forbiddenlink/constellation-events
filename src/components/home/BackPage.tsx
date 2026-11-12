import Link from "next/link";

const SOURCES: Array<{ name: string; use: string }> = [
  { name: "JPL Horizons", use: "planet positions" },
  { name: "astronomy-engine", use: "moon, sun and fallback ephemerides" },
  { name: "NOAA SWPC", use: "aurora and Kp index" },
  { name: "NASA APOD", use: "the daily plate" },
  { name: "Celestrak", use: "ISS orbital elements" },
  { name: "Open-Meteo", use: "weather and city search" }
];

/** Back page of the field log: footer links and the data-source colophon. Shared by the home page and every sub-page. */
export default function BackPage() {
  return (
      <footer className="back-page">
        <div className="wrap">
          <p className="display-sm" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
            Constellation © 2026. Free to use.
          </p>
          <nav aria-label="Footer" className="back-links">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
          <h2 className="eyebrow">Colophon, data sources</h2>
          <ul className="colophon mono" style={{ listStyle: "none" }}>
            {SOURCES.map((s) => (
              <li key={s.name}>
                {s.name}: {s.use}
              </li>
            ))}
          </ul>
        </div>
      </footer>
  );
}
