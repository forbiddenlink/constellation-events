"use client";

import { usePathname } from "next/navigation";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import HomeNav from "@/components/home/HomeNav";
import BackPage from "@/components/home/BackPage";
import "@/app/home.css";
import "@/app/sub.css";

/**
 * App-wide chrome. The home page is the field log and brings its own nav,
 * sections and back page. Every other route gets the same desk, ruled nav
 * strip and back page, with its content set inside the field-log type and
 * plate styles in sub.css.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <ClientErrorBoundary>{children}</ClientErrorBoundary>;
  }

  return (
    <div className="home-root sub-root">
      <HomeNav />
      <main id="main-content" className="wrap sub-main">
        <ClientErrorBoundary>{children}</ClientErrorBoundary>
      </main>
      <BackPage />
    </div>
  );
}
