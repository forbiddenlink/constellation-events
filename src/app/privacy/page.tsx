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
        as="h1"
      />

      <div>
        <section className="about-section">
          <h2>Data collection</h2>
          <ul className="about-list">
            <li>
              <h3>Geolocation</h3>
              <p>
                When you use our Dark-Sky Finder, we request your location to calculate nearby dark sky sites and local celestial visibility. This data is processed in real-time and not stored on our servers.
              </p>
            </li>
            <li>
              <h3>Analytics</h3>
              <p>
                We collect anonymous usage data to improve the Constellation experience. This includes page views, feature usage, and general device information.
              </p>
            </li>
            <li>
              <h3>Preferences</h3>
              <p>Your night vision mode settings and planner data are stored locally in your browser.</p>
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Cookies</h2>
          <p>
            We use essential cookies to maintain site functionality and analytics cookies to understand how visitors interact with Constellation. You can disable cookies in your browser settings, though some features may not work as expected.
          </p>
        </section>

        <section className="about-section">
          <h2>Third-party services</h2>
          <ul className="about-list">
            <li>
              <h3>Vercel Analytics</h3>
              <p>Anonymous performance and usage analytics to improve site speed and reliability.</p>
            </li>
            <li>
              <h3>NASA API</h3>
              <p>Astronomy Picture of the Day and celestial event data. No personal data is shared.</p>
            </li>
            <li>
              <h3>Mapbox</h3>
              <p>Dark-sky location mapping. Your coordinates are sent to render maps but not stored by us.</p>
            </li>
            <li>
              <h3>Weather APIs</h3>
              <p>Cloud cover and visibility forecasts. Location data is used solely for weather queries.</p>
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Your rights</h2>
          <ul className="about-list">
            <li>
              <p>Access any personal data we may have collected</p>
            </li>
            <li>
              <p>Request deletion of your data</p>
            </li>
            <li>
              <p>Opt out of analytics tracking</p>
            </li>
            <li>
              <p>Disable location services in your browser at any time</p>
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Contact</h2>
          <p>
            For privacy inquiries or data requests, write to{" "}
            <a href="mailto:privacy@constellation.app">privacy@constellation.app</a>
          </p>
        </section>

        <p className="mono" style={{ borderTop: "1px solid var(--hair)", paddingTop: 24 }}>
          Last updated: February 2026 | Effective immediately upon publication
        </p>
      </div>
    </div>
  );
}
