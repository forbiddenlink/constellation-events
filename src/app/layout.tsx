import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, DM_Serif_Display } from "next/font/google";
import Link from "next/link";
import { clsx } from "clsx";
import { Analytics } from "@vercel/analytics/react";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import { logConfigStatus } from "@/lib/config";

// Log configuration status on server startup
logConfigStatus();

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: {
    default: "Constellation — Astronomy Event Tracker",
    template: "%s | Constellation"
  },
  description: "Track celestial events, find dark skies, and gear up for your next night out under the stars. Real-time sky conditions, meteor shower forecasts, and dark-sky location finder.",
  keywords: ["astronomy", "stargazing", "celestial events", "dark sky", "meteor shower", "moon phases", "night sky", "telescope", "star map"],
  authors: [{ name: "Constellation Team" }],
  creator: "Constellation",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://constellation.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Constellation",
    title: "Constellation — Astronomy Event Tracker",
    description: "Your nightly mission control for the sky above. Track celestial events, find dark skies, and plan your stargazing adventures.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Constellation - Astronomy Event Tracker"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Constellation — Astronomy Event Tracker",
    description: "Your nightly mission control for the sky above. Track celestial events, find dark skies, and plan your stargazing adventures.",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" }
    ],
    apple: "/apple-icon"
  }
};

const navLinks = [
  { href: "/", label: "Tonight" },
  { href: "/events", label: "Events" },
  { href: "/locations", label: "Dark-Sky" },
  { href: "/planner", label: "Planner" },
  { href: "/marketplace", label: "Marketplace" }
];

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={clsx(spaceGrotesk.variable, dmSerif.variable, "font-sans")}> 
        <div className="min-h-screen bg-nebula-gradient">
          <div className="absolute inset-0 starfield opacity-60" />
          <div className="absolute inset-0 grid-overlay opacity-30" />
          <div className="relative">
            <header className="sticky top-0 z-50 border-b border-white/10 bg-deep-space/70 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border border-white/20 bg-aurora/10 shadow-glow" />
                  <div>
                    <div className="font-display text-lg tracking-wide">Constellation</div>
                    <div className="text-xs text-starlight/60">Astronomy Event Tracker</div>
                  </div>
                </div>
                <nav className="hidden items-center gap-6 text-sm text-starlight/70 md:flex">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="transition hover:text-aurora">
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center gap-3">
                  <button className="button-ghost hidden sm:inline-flex">Sign in</button>
                  <button className="button-primary">Start Tonight</button>
                </div>
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-10">
              <ClientErrorBoundary>{children}</ClientErrorBoundary>
            </main>
            <footer className="border-t border-white/10 py-8 text-center text-xs text-starlight/50">
              Built for stargazers. Powered by open astronomy data.
            </footer>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
