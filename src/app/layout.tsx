import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Analytics } from "@vercel/analytics/react";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import NightModeToggle from "@/components/NightModeToggle";
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
      <body className={clsx(spaceGrotesk.variable, dmSerif.variable, jetBrainsMono.variable, "font-sans bg-midnight overflow-x-hidden")}>
        {/* Cinematic Background Layer */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-nebula-gradient" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>
        
        <div className="relative z-10 flex min-h-screen flex-col">
          {/* Floating Glass Navigation */}
          <header className="sticky top-6 z-50 mx-auto w-full max-w-5xl px-4">
            <div className="glass-panel mt-2 flex items-center justify-between rounded-full border border-white/10 px-6 py-3 shadow-cinematic backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-aurora/20 blur-md" />
                  <Image src="/icon.png" alt="Constellation" width={32} height={32} className="relative rounded-full shadow-lg" />
                </div>
                <div className="hidden sm:block">
                  <div className="font-display text-lg tracking-wide text-starlight">Constellation</div>
                </div>
              </div>
              
              <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    className="rounded-full px-4 py-1.5 text-xs font-medium text-starlight/70 transition-all hover:bg-white/10 hover:text-white hover:shadow-lg"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                 <NightModeToggle />
                 <Link href="/planner" className="group relative overflow-hidden rounded-full bg-aurora px-5 py-2 text-xs font-bold text-deep-space transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                    <span className="relative z-10">Launch</span>
                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 opacity-0 transition-opacity group-hover:animate-shimmer group-hover:opacity-100" />
                 </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 md:py-20">
            <ClientErrorBoundary>{children}</ClientErrorBoundary>
          </main>

          <footer className="border-t border-white/5 bg-black/20 py-12 text-center text-xs text-starlight/30 backdrop-blur-sm">
            <div className="mb-4 flex justify-center gap-6">
                 <span className="cursor-pointer hover:text-aurora">Privacy Protocol</span>
                 <span className="cursor-pointer hover:text-aurora">System Status</span>
                 <span className="cursor-pointer hover:text-aurora">Transmission Logs</span>
            </div>
            Constellation Network © 2026. All systems nominal.
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
