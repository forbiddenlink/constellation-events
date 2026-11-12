import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Constellation",
  description: "Learn about Constellation's mission to help stargazers find dark skies, track celestial events, and connect with the astronomy community.",
  openGraph: {
    title: "About Constellation",
    description: "Learn about Constellation's mission to help stargazers find dark skies, track celestial events, and connect with the astronomy community.",
    images: ["/opengraph-image"]
  }
};

const TOOLKIT = [
  {
    title: "Tonight View",
    description: "Real-time sky conditions, moon phase, and optimal viewing windows for your location."
  },
  {
    title: "Event Calendar",
    description: "Never miss a meteor shower, eclipse, or planetary conjunction with personalized alerts."
  },
  {
    title: "Dark-Sky Finder",
    description: "Interactive maps showing light pollution levels, drive times, and weather forecasts."
  },
  {
    title: "Session Planner",
    description: "Build detailed observation itineraries with target lists and timing recommendations."
  }
];

const SOURCES = [
  {
    title: "NASA Data",
    description: "Authoritative celestial event data and daily featured imagery direct from NASA"
  },
  {
    title: "Precise Positioning",
    description: "Planet and moon positions calculated for your exact location and time, accurate to the arc-second"
  },
  {
    title: "Live Conditions",
    description: "Cloud cover, seeing quality, and light pollution scored in real time from multiple weather sources"
  }
];

export default function AboutPage() {
  return (
    <div>
      <div className="mb-10">
        <div className="eyebrow">About</div>
        <h1 className="display-sm">Mission: Clear Skies for Everyone</h1>
        <p className="lede mt-3 max-w-2xl">
          Constellation exists to make stargazing accessible, informed, and unforgettable.
          We believe everyone deserves to witness the cosmos unobstructed by light pollution
          and unpredictable weather.
        </p>
      </div>

      <section className="about-section">
        <div>
          <div className="eyebrow">Our Mission</div>
          <h2>Connecting observers with the night sky</h2>
        </div>
        <div>
          <p>
            Light pollution affects over 80% of the world&apos;s population. Finding truly dark skies
            requires planning, timing, and local knowledge. Constellation brings all that intelligence
            into one platform, so you can spend less time researching and more time under the stars.
          </p>
          <p>
            Whether you&apos;re photographing the Milky Way, tracking a meteor shower, or simply
            sharing a quiet moment with the universe, we&apos;re here to help you find your window.
          </p>
          <ul className="about-list mt-6">
            <li>
              <h3>Dark-Sky Mapping</h3>
              <p>
                Real-time light pollution overlays, Bortle scale ratings, and satellite imagery
                to pinpoint the clearest horizons near you.
              </p>
            </li>
            <li>
              <h3>Event Forecasting</h3>
              <p>
                Meteor showers, planetary alignments, eclipses, and lunar events, all with
                visibility scores tailored to your location.
              </p>
            </li>
            <li>
              <h3>Community Marketplace</h3>
              <p>
                A curated space for buying and selling astronomy gear, with detailed condition
                notes and seller descriptions.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className="about-section">
        <div>
          <div className="eyebrow">What We Do</div>
          <h2>Your complete stargazing toolkit</h2>
        </div>
        <ul className="about-list">
          {TOOLKIT.map((feature) => (
            <li key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-section">
        <div>
          <div className="eyebrow">Powered By</div>
          <h2>Precision data you can trust in the field</h2>
        </div>
        <ul className="about-list">
          {SOURCES.map((source) => (
            <li key={source.title}>
              <h3>{source.title}</h3>
              <p>{source.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-section">
        <div>
          <div className="eyebrow">The Creator</div>
          <h2>Built by stargazers, for stargazers</h2>
        </div>
        <p>
          Constellation was born from countless nights spent searching for dark skies,
          checking weather apps, and wishing there was one place that brought it all together.
          We built the tool we always wanted, and now we&apos;re sharing it with the community.
        </p>
      </section>

      <section className="about-section">
        <div>
          <div className="eyebrow">Next</div>
          <h2>Ready to explore?</h2>
        </div>
        <div>
          <p>Start planning your next observation session today.</p>
          <div className="about-cta">
            <Link href="/planner" className="button-primary">
              Create a plan
            </Link>
            <Link href="/events" className="button-ghost">
              View Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
