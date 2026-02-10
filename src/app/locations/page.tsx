import SectionHeading from "@/components/SectionHeading";
import LocationsFeed from "@/components/LocationsFeed";
import LocationsMapPanel from "@/components/LocationsMapPanel";

export default function LocationsPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Dark-Sky Finder"
        title="Light pollution intelligence"
        subtitle="Layer satellite data, cloud cover, and moonlight to pinpoint your clearest horizon."
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <LocationsMapPanel />
        <LocationsFeed />
      </div>
    </div>
  );
}
