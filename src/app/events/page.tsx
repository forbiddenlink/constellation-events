import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import EventsFeedWithFilters from "@/components/EventsFeedWithFilters";
import EventsRail from "@/components/EventsRail";

export const metadata: Metadata = {
  title: "Celestial Events",
  description: "Discover upcoming meteor showers, planetary alignments, eclipses, and lunar events. Get visibility scores based on your location and optimal viewing times.",
  openGraph: {
    title: "Celestial Events | Constellation",
    description: "Discover upcoming meteor showers, planetary alignments, eclipses, and lunar events with location-based visibility scores.",
    images: ["/opengraph-image"]
  }
};

export default function EventsPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Events"
        title="Celestial calendar"
        subtitle="Plan for meteor showers, planetary alignments, and rare lunar features with visibility scored by location."
        as="h1"
      />
      <EventsRail />
      <EventsFeedWithFilters />
    </div>
  );
}
