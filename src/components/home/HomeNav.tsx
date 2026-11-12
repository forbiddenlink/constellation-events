"use client";

import Link from "next/link";
import NightModeToggle from "@/components/NightModeToggle";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Tonight" },
  { href: "/events", label: "Events" },
  { href: "/locations", label: "Dark-Sky" },
  { href: "/planner", label: "Planner" },
  { href: "/marketplace", label: "Marketplace" }
];

/** Ruled nav strip for the home page: wordmark, links, red-torch toggle, Plan tonight. */
export default function HomeNav() {
  return (
    <header className="log-nav">
      <div className="wrap log-nav-inner">
        <Link href="/" className="wordmark" aria-label="Constellation, home">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="12.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 17 L11 10 L16 14 L22 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="17" r="1.8" fill="currentColor" />
            <circle cx="11" cy="10" r="1.8" fill="currentColor" />
            <circle cx="16" cy="14" r="1.8" fill="currentColor" />
            <circle cx="22" cy="7" r="1.8" fill="currentColor" />
          </svg>
          <span className="wm-text">Constellation</span>
        </Link>

        <nav aria-label="Primary" className="nav-links-wrap">
          <ul className="nav-links">
            {LINKS.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <details className="nav-more">
          <summary>Menu</summary>
          <div className="nav-more-panel">
            {LINKS.map((l) => (
              <Link key={l.href + l.label} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
        </details>

        <NightModeToggle label="Red torch" />
        <Link href="/planner" className="pill">
          Plan tonight
        </Link>
      </div>
    </header>
  );
}
