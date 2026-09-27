import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import MarketplaceBrowser from "@/components/MarketplaceBrowser";

export const metadata: Metadata = {
  title: "Telescope Marketplace",
  description: "Browse and list astronomy equipment: telescopes, mounts, cameras, eyepieces, and accessories.",
  openGraph: {
    title: "Telescope Marketplace | Constellation",
    description: "Browse and list astronomy equipment: telescopes, mounts, cameras, eyepieces, and accessories.",
    images: ["/opengraph-image"]
  }
};

export default function MarketplacePage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Marketplace"
        title="Telescope marketplace"
        subtitle="Browse gear by category, condition, and price. Some listings below are sample data showing how the marketplace works; look for the Sample listing tag."
        as="h1"
      />
      <MarketplaceBrowser />
    </div>
  );
}
