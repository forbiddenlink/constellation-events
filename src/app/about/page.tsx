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
    description: "Moon phase, bright planets, and the best time to look, calculated for your location."
  },
  {
    title: "Event Calendar",
    description: "Upcoming meteor showers, moon phases, and planetary conjunctions, each with a visibility score for your location and an Add to calendar button. Constellation does not send alerts or notifications."
  },
  {
    title: "Dark-Sky Finder",
    description: "A light pollution map with a Bortle overlay, plus the distance, cloud cover, and an estimated dark-sky score for each site."
  },
  {
    title: "Session Planner",
    description: "A plan for tonight with the bright planets in prime position, an optimal viewing window, and packing reminders."
  }
];

const SOURCES = [
  {
    title: "NASA and JPL",
    description: "Planet positions come from JPL Horizons, and the daily featured image is NASA's Astronomy Picture of the Day."
  },
  {
    title: "Sky Positions",
    description: "JPL Horizons supplies hourly altitude and azimuth for your coordinates. If it is unreachable, the astronomy-engine library calculates positions locally. Values are rounded for planning, not for pointing a mount."
  },
  {
    title: "Live Conditions",
    description: "Cloud cover comes from OpenWeather or Open-Meteo. The seeing rating is an estimate derived from cloud, humidity, and wind."
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
                A light pollution overlay and Bortle scale ratings to help you find the
                clearest horizons near you.
              </p>
            </li>
            <li>
              <h3>Event Forecasting</h3>
              <p>
                Meteor showers, planetary conjunctions, and lunar events, all with
                visibility scores tailored to your location.
              </p>
            </li>
            <li>
              <h3>Community Marketplace</h3>
              <p>
                A space for astronomy gear listings, with condition notes and seller
                descriptions. Sample listings are labeled as such.
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
          <h2>Where the numbers come from</h2>
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
