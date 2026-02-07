import SectionHeading from "@/components/SectionHeading";
import ListingCard from "@/components/ListingCard";
import { featuredListings } from "@/lib/mock";

export default function MarketplacePage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Marketplace"
        title="Curated telescope marketplace"
        subtitle="Trusted listings reviewed by our team. Filters focus on optics quality, condition, and price." 
      />
      <div className="glass rounded-3xl p-6">
        <div className="grid gap-6 md:grid-cols-3">
          {["Reflector", "Refractor", "Imaging", "Mounts", "Accessories", "Beginner"].map((filter) => (
            <div key={filter} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-starlight/70">
              {filter}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {featuredListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
