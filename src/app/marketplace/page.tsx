import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import MarketplaceBrowser from "@/components/MarketplaceBrowser";

export const metadata: Metadata = {
  title: "Telescope Marketplace",
  description: "Buy and sell quality astronomy equipment. Curated listings for telescopes, mounts, cameras, eyepieces, and accessories with verified seller ratings.",
  openGraph: {
    title: "Telescope Marketplace | Constellation",
    description: "Buy and sell quality astronomy equipment. Curated telescope, mount, and accessory listings."
  }
};

export default function MarketplacePage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Marketplace"
        title="Curated telescope marketplace"
        subtitle="Trusted listings reviewed by our team. Filters focus on optics quality, condition, and price." 
      />
      <MarketplaceBrowser />
    </div>
  );
}
