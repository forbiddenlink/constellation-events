"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import NightModeToggle from "@/components/NightModeToggle";
import LocationPrompt from "@/components/LocationPrompt";

const navLinks = [
  { href: "/", label: "Tonight" },
  { href: "/events", label: "Events" },
  { href: "/locations", label: "Dark-Sky" },
  { href: "/planner", label: "Planner" },
  { href: "/marketplace", label: "Marketplace" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-6 z-50 mx-auto w-full max-w-5xl px-4">
      <div className="glass-panel mt-2 flex items-center justify-between rounded-full border border-white/10 px-6 py-3 shadow-cinematic backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-aurora/20 blur-md" />
            <Image src="/icon.png" alt="Constellation" width={32} height={32} className="relative rounded-full shadow-lg" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-lg tracking-wide text-starlight">Constellation</div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/5 p-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all hover:bg-white/10 hover:text-white hover:shadow-lg ${
                isActive(pathname, link.href)
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-starlight/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LocationPrompt />
          <NightModeToggle />
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-starlight/70 hover:bg-white/10 hover:text-white"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="glass-panel mt-2 rounded-2xl border border-white/10 p-4 shadow-cinematic backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/10 ${
                  isActive(pathname, link.href)
                    ? "bg-white/10 text-white"
                    : "text-starlight/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
