import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Constellation collects, uses, and protects your data. Our commitment to your privacy while tracking celestial events and finding dark skies.",
  openGraph: {
    title: "Privacy Policy | Constellation",
    description: "Learn how Constellation collects, uses, and protects your data while helping you explore the night sky.",
    images: ["/opengraph-image"]
  }
};

export default function PrivacyPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="How we handle your data while helping you navigate the cosmos."
      />

      <div className="glass rounded-3xl p-8 space-y-8">
        <section>
          <h1 className="sr-only">Constellation Privacy Policy</h1>
          <h2 className="font-display text-xl text-starlight mb-4">Data Collection</h2>
          <div className="space-y-3 text-sm text-starlight/70">
            <p>
              <span className="text-aurora font-medium">Geolocation:</span> When you use our Dark-Sky Finder, we request your location to calculate nearby dark sky sites and local celestial visibility. This data is processed in real-time and not stored on our servers.
            </p>
            <p>
              <span className="text-aurora font-medium">Analytics:</span> We collect anonymous usage data to improve the Constellation experience. This includes page views, feature usage, and general device information.
            </p>
            <p>
              <span className="text-aurora font-medium">Preferences:</span> Your night vision mode settings and planner data are stored locally in your browser.
            </p>
          </div>
        </section>

        <div className="border-t border-white/10" />

        <section>
          <h2 className="font-display text-xl text-starlight mb-4">Cookies</h2>
          <p className="text-sm text-starlight/70">
            We use essential cookies to maintain site functionality and analytics cookies to understand how visitors interact with Constellation. You can disable cookies in your browser settings, though some features may not work as expected.
          </p>
        </section>

        <div className="border-t border-white/10" />

        <section>
          <h2 className="font-display text-xl text-starlight mb-4">Third-Party Services</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.3em] text-aurora/70 mb-2">Vercel Analytics</div>
              <p className="text-sm text-starlight/70">
                Anonymous performance and usage analytics to improve site speed and reliability.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.3em] text-aurora/70 mb-2">NASA API</div>
              <p className="text-sm text-starlight/70">
                Astronomy Picture of the Day and celestial event data. No personal data is shared.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.3em] text-aurora/70 mb-2">Mapbox</div>
              <p className="text-sm text-starlight/70">
                Dark-sky location mapping. Your coordinates are sent to render maps but not stored by us.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.3em] text-aurora/70 mb-2">Weather APIs</div>
              <p className="text-sm text-starlight/70">
                Cloud cover and visibility forecasts. Location data is used solely for weather queries.
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-white/10" />

        <section>
          <h2 className="font-display text-xl text-starlight mb-4">Your Rights</h2>
          <ul className="space-y-2 text-sm text-starlight/70 list-disc list-inside">
            <li>Access any personal data we may have collected</li>
            <li>Request deletion of your data</li>
            <li>Opt out of analytics tracking</li>
            <li>Disable location services in your browser at any time</li>
          </ul>
        </section>

        <div className="border-t border-white/10" />

        <section>
          <h2 className="font-display text-xl text-starlight mb-4">Contact</h2>
          <p className="text-sm text-starlight/70">
            For privacy inquiries or data requests, transmit to{" "}
            <a href="mailto:privacy@constellation.app" className="text-aurora hover:underline">
              privacy@constellation.app
            </a>
          </p>
        </section>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-xs text-starlight/50">
            Last updated: February 2026 | Effective immediately upon publication
          </p>
        </div>
      </div>
    </div>
  );
}
