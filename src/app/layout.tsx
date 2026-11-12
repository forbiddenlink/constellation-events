import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Serif_Display, JetBrains_Mono, Instrument_Sans, Reenie_Beanie } from "next/font/google";
import { clsx } from "clsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import SiteChrome from "@/components/SiteChrome";
import { logConfigStatus } from "@/lib/config";
import { getSiteUrl } from "@/lib/site-url";

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

// Home page body face (replaces Space Grotesk there; other routes keep --font-sans).
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body"
});

// Pencil margin notes only.
const reenieBeanie = Reenie_Beanie({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-hand"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e17"
};

export const metadata: Metadata = {
  title: {
    default: "Constellation - Astronomy Event Tracker",
    template: "%s | Constellation"
  },
  description: "Track celestial events, find dark skies, and gear up for stargazing. Real-time sky conditions, meteor showers, and dark-sky finder.",
  alternates: {
    canonical: "/"
  },
  keywords: ["astronomy", "stargazing", "celestial events", "dark sky", "meteor shower", "moon phases", "night sky", "telescope", "star map"],
  authors: [{ name: "Constellation Team" }],
  creator: "Constellation",
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Constellation",
    title: "Constellation - Astronomy Event Tracker",
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
    title: "Constellation - Astronomy Event Tracker",
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
      <body className={clsx(spaceGrotesk.variable, dmSerif.variable, jetBrainsMono.variable, instrumentSans.variable, reenieBeanie.variable, "font-sans bg-midnight overflow-x-hidden")}>
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <NuqsAdapter>
          <SiteChrome>{children}</SiteChrome>
          <Analytics />
          <SpeedInsights />
        </NuqsAdapter>
      </body>
    </html>
  );
}
