"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import NavBar from "@/components/NavBar";

/**
 * App-wide chrome (nebula background, floating nav, footer) for every route
 * except the home page. The home page is the field log: it brings its own
 * desk background, ruled nav strip and back-page footer, so the glass and
 * nebula layers must not render under it.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <ClientErrorBoundary>{children}</ClientErrorBoundary>;
  }

  return (
    <>
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center opacity-60 mix-blend-overlay" />
        <div className="absolute inset-0 bg-nebula-gradient" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col">
        <NavBar />

        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 md:py-20">
          <ClientErrorBoundary>{children}</ClientErrorBoundary>
        </main>

        <footer className="border-t border-white/5 bg-black/20 py-12 text-center text-xs text-starlight/70 backdrop-blur-sm">
          <div className="mb-4 flex justify-center gap-6">
            <Link href="/about" className="hover:text-aurora">About</Link>
            <Link href="/contact" className="hover:text-aurora">Contact</Link>
            <Link href="/privacy" className="hover:text-aurora">Privacy</Link>
          </div>
          Constellation © 2026. Free to use.
        </footer>
      </div>
    </>
  );
}
