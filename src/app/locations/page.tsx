import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import LocationsFeed from "@/components/LocationsFeed";
import LocationsMapPanel from "@/components/LocationsMapPanel";

export const metadata: Metadata = {
  title: "Dark-Sky Locations",
  description: "Find the best dark-sky locations near you. Interactive light pollution map with Bortle scale ratings, distance calculations, and real-time conditions.",
  openGraph: {
    title: "Dark-Sky Locations | Constellation",
    description: "Find the best dark-sky locations near you with interactive light pollution mapping and Bortle scale ratings.",
    images: ["/og-image.png"]
  }
};

export default function LocationsPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Dark-Sky Finder"
        title="Light pollution intelligence"
        subtitle="Layer satellite data, cloud cover, and moonlight to pinpoint your clearest horizon."
        as="h1"
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <LocationsMapPanel />
        <LocationsFeed />
      </div>
    </div>
  );
}
