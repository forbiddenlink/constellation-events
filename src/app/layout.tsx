import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { clsx } from "clsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import NavBar from "@/components/NavBar";
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

const jetBrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e17"
};

export const metadata: Metadata = {
  title: {
    default: "Constellation — Astronomy Event Tracker",
    template: "%s | Constellation"
  },
  description: "Track celestial events, find dark skies, and gear up for stargazing. Real-time sky conditions, meteor showers, and dark-sky finder.",
  alternates: {
    canonical: "/"
  },
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
        url: "/opengraph-image",
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
    images: ["/opengraph-image"]
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
      { url: "/icon", type: "image/png", sizes: "32x32" }
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" }
    ]
  }
};


export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={clsx(spaceGrotesk.variable, dmSerif.variable, jetBrainsMono.variable, "font-sans bg-midnight overflow-x-hidden")}>
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        {/* Cinematic Background Layer */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-nebula-gradient" />
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>
        
        <NuqsAdapter>
          <div className="relative z-10 flex min-h-screen flex-col">
            <NavBar />

            <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 md:py-20">
              <ClientErrorBoundary>{children}</ClientErrorBoundary>
            </main>

            <footer className="border-t border-white/5 bg-black/20 py-12 text-center text-xs text-starlight/30 backdrop-blur-sm">
              <div className="mb-4 flex justify-center gap-6">
                   <Link href="/about" className="hover:text-aurora">About</Link>
                   <Link href="/contact" className="hover:text-aurora">Contact</Link>
                   <Link href="/privacy" className="hover:text-aurora">Privacy</Link>
              </div>
              Constellation © 2026 — Free to use.
            </footer>
          </div>
          <Analytics />
          <SpeedInsights />
        </NuqsAdapter>
      </body>
    </html>
  );
}
