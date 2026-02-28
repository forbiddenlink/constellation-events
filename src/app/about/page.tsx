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

export default function AboutPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-aurora/70">About</div>
        <h1 className="font-display text-3xl text-starlight sm:text-4xl mt-2">
          Mission: Clear Skies for Everyone
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-base text-starlight/70">
          Constellation exists to make stargazing accessible, informed, and unforgettable.
          We believe everyone deserves to witness the cosmos unobstructed by light pollution
          and unpredictable weather.
        </p>
      </div>

      {/* Mission Section */}
      <section className="glass rounded-3xl p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-aurora/70">Our Mission</div>
            <h2 className="font-display text-2xl text-starlight mt-2">
              Connecting observers with the night sky
            </h2>
            <p className="mt-4 text-sm text-starlight/70 leading-relaxed">
              Light pollution affects over 80% of the world&apos;s population. Finding truly dark skies
              requires planning, timing, and local knowledge. Constellation brings all that intelligence
              into one platform—so you can spend less time researching and more time under the stars.
            </p>
            <p className="mt-4 text-sm text-starlight/70 leading-relaxed">
              Whether you&apos;re photographing the Milky Way, tracking a meteor shower, or simply
              sharing a quiet moment with the universe, we&apos;re here to help you find your window.
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs text-starlight/50 uppercase tracking-wider">Dark-Sky Mapping</div>
              <p className="mt-2 text-sm text-starlight/70">
                Real-time light pollution overlays, Bortle scale ratings, and satellite imagery
                to pinpoint the clearest horizons near you.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs text-starlight/50 uppercase tracking-wider">Event Forecasting</div>
              <p className="mt-2 text-sm text-starlight/70">
                Meteor showers, planetary alignments, eclipses, and lunar events—all with
                visibility scores tailored to your location.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs text-starlight/50 uppercase tracking-wider">Community Marketplace</div>
              <p className="mt-2 text-sm text-starlight/70">
                A trusted space for buying and selling astronomy gear, with verified listings
                and community ratings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section>
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-aurora/70">What We Do</div>
          <h2 className="font-display text-2xl text-starlight mt-2">
            Your complete stargazing toolkit
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
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
          ].map((feature) => (
            <div key={feature.title} className="glass rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-starlight">{feature.title}</h3>
              <p className="mt-2 text-sm text-starlight/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Section */}
      <section className="glass rounded-3xl p-8">
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-aurora/70">Built With</div>
          <h2 className="font-display text-2xl text-starlight mt-2">
            Modern astronomy meets modern technology
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <div className="text-2xl font-semibold text-aurora">Next.js</div>
            <p className="mt-2 text-sm text-starlight/70">
              Fast, server-rendered React framework for optimal performance
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <div className="text-2xl font-semibold text-aurora">Astronomy Engine</div>
            <p className="mt-2 text-sm text-starlight/70">
              Precise ephemeris calculations for celestial body positions
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <div className="text-2xl font-semibold text-aurora">NASA APIs</div>
            <p className="mt-2 text-sm text-starlight/70">
              Daily content from APOD and authoritative event data
            </p>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-aurora/70">The Creator</div>
        <h2 className="font-display text-2xl text-starlight mt-2">
          Built by stargazers, for stargazers
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-sm text-starlight/70 leading-relaxed">
          Constellation was born from countless nights spent searching for dark skies,
          checking weather apps, and wishing there was one place that brought it all together.
          We built the tool we always wanted—and now we&apos;re sharing it with the community.
        </p>
      </section>

      {/* CTA Section */}
      <section className="glass rounded-3xl p-8 text-center">
        <h2 className="font-display text-2xl text-starlight">Ready to explore?</h2>
        <p className="mt-2 text-sm text-starlight/70">
          Start planning your next observation session today.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/planner" className="button-primary">
            Launch Planner
          </Link>
          <Link href="/events" className="button-ghost">
            View Events
          </Link>
        </div>
      </section>
    </div>
  );
}
