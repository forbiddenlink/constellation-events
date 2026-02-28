import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";

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

      <div className="glass rounded-3xl p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl text-starlight mb-3">General Inquiries</h2>
              <p className="text-sm text-starlight/70 mb-2">
                For questions about Constellation, feature requests, or general feedback:
              </p>
              <a
                href="mailto:hello@constellation.app"
                className="text-aurora hover:underline text-sm"
              >
                hello@constellation.app
              </a>
            </div>

            <div>
              <h2 className="font-display text-xl text-starlight mb-3">Privacy & Data</h2>
              <p className="text-sm text-starlight/70 mb-2">
                For privacy inquiries or data access requests:
              </p>
              <a
                href="mailto:privacy@constellation.app"
                className="text-aurora hover:underline text-sm"
              >
                privacy@constellation.app
              </a>
            </div>

            <div>
              <h2 className="font-display text-xl text-starlight mb-3">Marketplace Support</h2>
              <p className="text-sm text-starlight/70 mb-2">
                Questions about telescope listings, seller verification, or transactions:
              </p>
              <a
                href="mailto:marketplace@constellation.app"
                className="text-aurora hover:underline text-sm"
              >
                marketplace@constellation.app
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-aurora/70 mb-3">Response Time</div>
              <p className="text-sm text-starlight/70">
                We typically respond within 24-48 hours. For urgent matters, please include
                &quot;URGENT&quot; in your subject line.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-aurora/70 mb-3">Bug Reports</div>
              <p className="text-sm text-starlight/70">
                Found a bug or issue? Include your browser, device, and steps to reproduce.
                Screenshots help us fix issues faster.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-aurora/70 mb-3">Feature Ideas</div>
              <p className="text-sm text-starlight/70">
                We love hearing what would make your stargazing experience better.
                Share your ideas and we&apos;ll consider them for future updates.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-starlight/50">
          Constellation Network Mission Control
        </p>
      </div>
    </div>
  );
}
