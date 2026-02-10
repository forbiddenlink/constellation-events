import SectionHeading from "@/components/SectionHeading";
import MarketplaceBrowser from "@/components/MarketplaceBrowser";

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
