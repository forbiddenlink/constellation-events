import type { MarketplaceListing } from "@/lib/marketplace";
import type { ListingItem } from "@/lib/mock";

type ListingModel = MarketplaceListing | ListingItem;

function isMarketplaceListing(listing: ListingModel): listing is MarketplaceListing {
  return "priceUsd" in listing;
}

function formatCondition(value: MarketplaceListing["condition"] | string) {
  if (value === "like-new" || value === "Like new") return "Like new";
  if (value === "excellent" || value === "Excellent") return "Excellent";
  if (value === "good" || value === "Good") return "Good";
  if (value === "fair" || value === "Fair") return "Fair";
  return "Fair";
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export default function ListingCard({ listing }: { readonly listing: ListingModel }) {
  const price = isMarketplaceListing(listing) ? formatPrice(listing.priceUsd) : listing.price;
  const imageUrl = isMarketplaceListing(listing) ? listing.imageUrl : null;
  const moderationStatus = isMarketplaceListing(listing) ? listing.status : null;
  
  let statusTone = "text-success border-success/40";
  if (moderationStatus === "hidden") statusTone = "text-ember border-ember/40";
  else if (moderationStatus === "pending") statusTone = "text-caution border-caution/40";

  return (
    <div className="group relative flex items-center justify-between border-b border-white/10 py-4 px-4 transition-all hover:bg-white/5">
        {/* Leading Data Block */}
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 group-hover:ring-aurora/30">
                {imageUrl ? (
                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
                ) : (
                    <div className="h-2 w-2 rounded-full bg-white/20" />
                )}
            </div>

            <div>
                <h3 className="text-sm font-semibold text-starlight group-hover:text-aurora transition-colors truncate max-w-[200px] sm:max-w-[300px]">
                    {listing.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-starlight/50">
                    <span>{listing.tag}</span>
                    <span className="h-3 w-px bg-white/10" />
                    <span>{formatCondition(listing.condition)}</span>
                </div>
            </div>
        </div>

        {/* Trailing Data Block */}
        <div className="flex items-center gap-6">
            {moderationStatus && (
                <div className={`text-[10px] uppercase ${statusTone}`}>
                    {moderationStatus}
                </div>
            )}

            <div className="text-right">
                <div className="font-mono text-lg font-semibold text-aurora">{price}</div>
            </div>

            <svg className="h-4 w-4 flex-shrink-0 text-starlight/30 transition group-hover:text-aurora" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    </div>
  );
}
