import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact the Constellation Team",
  description: "Get in touch with the Constellation team. Questions about dark sky locations, celestial events, or the marketplace? We're here to help.",
  openGraph: {
    title: "Contact the Constellation Team | Constellation",
    description: "Get in touch with the Constellation team for questions about stargazing, dark sky locations, or the marketplace.",
    images: ["/opengraph-image"]
  }
};

export default function ContactPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Contact"
        title="Get in touch"
        subtitle="Questions, feedback, or cosmic observations to share? We'd love to hear from you."
        as="h1"
      />

      <ContactForm />

      <section className="about-section">
        <ul className="about-list contact-list">
          <li>
            <h2>General Inquiries</h2>
            <p>
              For questions about Constellation, feature requests, or general feedback:{" "}
              <a href="mailto:hello@constellation.app" className="text-aurora hover:underline">
                hello@constellation.app
              </a>
            </p>
          </li>
          <li>
            <h2>Privacy &amp; Data</h2>
            <p>
              For privacy inquiries or data access requests:{" "}
              <a href="mailto:privacy@constellation.app" className="text-aurora hover:underline">
                privacy@constellation.app
              </a>
            </p>
          </li>
          <li>
            <h2>Marketplace Support</h2>
            <p>
              Questions about telescope listings, seller verification, or transactions:{" "}
              <a href="mailto:marketplace@constellation.app" className="text-aurora hover:underline">
                marketplace@constellation.app
              </a>
            </p>
          </li>
        </ul>

        <ul className="about-list contact-list">
          <li>
            <h3 className="eyebrow">Response Time</h3>
            <p>
              We typically respond within 24-48 hours. For urgent matters, please include
              &quot;URGENT&quot; in your subject line.
            </p>
          </li>
          <li>
            <h3 className="eyebrow">Bug Reports</h3>
            <p>
              Found a bug or issue? Include your browser, device, and steps to reproduce.
              Screenshots help us fix issues faster.
            </p>
          </li>
          <li>
            <h3 className="eyebrow">Feature Ideas</h3>
            <p>
              We love hearing what would make your stargazing experience better.
              Share your ideas and we&apos;ll consider them for future updates.
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
}
