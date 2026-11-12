import Link from "next/link";
import { generateUpcomingEvents } from "@/lib/events";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace";
import HomeNav from "@/components/home/HomeNav";
import HeroLog from "@/components/home/HeroLog";
import TonightLog from "@/components/home/TonightLog";
import Ephemeris from "@/components/home/Ephemeris";
import Plate from "@/components/home/Plate";
import DarkSky from "@/components/home/DarkSky";
import Passes from "@/components/home/Passes";
import "./home.css";

const GEAR_BLURBS: Record<string, string> = {
  telescope: "Refractors, reflectors and compound scopes.",
  mount: "Tripods, equatorial and alt-az mounts.",
  camera: "Astro cameras and camera bodies.",
  eyepiece: "Eyepieces, Barlows and diagonals.",
  filter: "Light-pollution, planetary and solar filters.",
  accessory: "Finders, dew control, cases and cables."
};

const SAMPLE_PLAN: Array<{ time: string; text: string }> = [
  { time: "8:30 PM", text: "Depart. 42 miles to Sierra Vista Overlook." },
  { time: "9:05 PM", text: "Set up telescope." },
  { time: "9:20 PM", text: "Jupiter and its moons." },
  { time: "10:15 PM", text: "Orion Nebula imaging session." }
];

const SOURCES: Array<{ name: string; use: string }> = [
  { name: "JPL Horizons", use: "planet positions" },
  { name: "astronomy-engine", use: "moon, sun and fallback ephemerides" },
  { name: "NOAA SWPC", use: "aurora and Kp index" },
  { name: "NASA APOD", use: "the daily plate" },
  { name: "Celestrak", use: "ISS orbital elements" },
  { name: "Open-Meteo", use: "weather and city search" }
];

function Head({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <div className="section-head">
      <h2 id={id} className="display-sm">
        {title}
      </h2>
      <p className="hand on-desk">{note}</p>
    </div>
  );
}

export default function HomePage() {
  // Real astronomy events (server-computed, so the table works without JavaScript).
  const skyEvents = generateUpcomingEvents(undefined, new Date(), 60);

  return (
    <div className="home-root">
      <HomeNav />
      <main id="main-content">
        <section className="hero" aria-labelledby="hero-h">
          <div className="wrap">
            <p className="eyebrow">Constellation field log</p>
            <h1 id="hero-h" className="display">
              What is up tonight, and where to go to see it.
            </h1>
            <p className="lede" style={{ marginTop: 24 }}>
              Tonight&apos;s sky, an events calendar, a dark-sky finder, ISS and aurora passes, and a gear marketplace. Free to use.
            </p>
            <div className="hero-cta">
              <Link href="/planner" className="btn-lamp">
                Plan tonight
              </Link>
              <Link href="/events" className="btn-line">
                Explore events
              </Link>
            </div>
            <div style={{ marginTop: 56 }}>
              <HeroLog />
            </div>
          </div>
        </section>

        <TonightLog />

        <section className="section" id="coming" aria-labelledby="coming-h">
          <div className="wrap">
            <Head id="coming-h" title="Coming weeks." note="mark the clear nights" />
            <Ephemeris events={skyEvents} />
          </div>
        </section>

        <section className="section" id="plate" aria-labelledby="plate-h">
          <div className="wrap">
            <Head id="plate-h" title="Today's plate." note="pinned in with corners" />
            <Plate />
          </div>
        </section>

        <section className="section" id="dark-sky" aria-labelledby="dark-h">
          <div className="wrap">
            <Head id="dark-h" title="Where it is dark." note="darker means lower" />
            <DarkSky />
          </div>
        </section>

        <section className="section" id="passes" aria-labelledby="passes-h">
          <div className="wrap">
            <Head id="passes-h" title="Passes overhead." note="look up, then again" />
            <Passes />
          </div>
        </section>

        <section className="section" id="planner" aria-labelledby="planner-h">
          <div className="wrap">
            <Head id="planner-h" title="A night, planned." note="this one is a sample" />
            <div className="log-page">
              <span className="stamp" style={{ float: "right" }}>
                Sample
              </span>
              <p className="mono">Example itinerary. Generate your own for your place and date.</p>
              <ul className="plan-lines mono" style={{ listStyle: "none" }}>
                {SAMPLE_PLAN.map((p) => (
                  <li key={p.time}>
                    <strong>{p.time}</strong>
                    <span>{p.text}</span>
                  </li>
                ))}
              </ul>
              <p style={{ margin: "16px 0 0" }}>
                <Link href="/planner" className="btn-line">
                  Generate tonight&apos;s plan
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="gear" aria-labelledby="gear-h">
          <div className="wrap">
            <Head id="gear-h" title="Gear, classified." note="six kinds of gear" />
            <div className="log-page">
              <ul className="ads">
                {MARKETPLACE_CATEGORIES.map((c) => (
                  <li key={c.value}>
                    <div className="ad-title">{c.label}</div>
                    <p className="mono" style={{ margin: 0 }}>
                      {GEAR_BLURBS[c.value]}
                    </p>
                  </li>
                ))}
              </ul>
              <p style={{ margin: "8px 0 0" }}>
                <Link href="/marketplace" className="btn-line">
                  Open the marketplace
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

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
    </div>
  );
}
