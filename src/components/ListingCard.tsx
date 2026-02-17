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
  
  let statusTone = "text-emerald-300 border-emerald-300/40";
  if (moderationStatus === "hidden") statusTone = "text-ember border-ember/40";
  else if (moderationStatus === "pending") statusTone = "text-amber-300 border-amber-300/40";

  return (
    <div className="group relative flex items-center justify-between border-b border-white/10 bg-white/0 py-4 px-4 transition-all hover:bg-white/5 hover:border-aurora/30">
        {/* Hover "Scan" Effect */}
        <div className="absolute inset-0 -z-10 translate-x-[-100%] bg-gradient-to-r from-transparent via-aurora/5 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
        
        {/* Leading Data Block */}
        <div className="flex items-center gap-6">
            <div className="font-mono text-xs text-starlight/40">
                {String(listing.id).padStart(4, '0')}
            </div>
            
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-deep-space ring-1 ring-white/10 group-hover:ring-aurora/50">
                {imageUrl ? (
                    <div className="h-full w-full bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${imageUrl})` }} />
                ) : (
                    <div className="h-2 w-2 rounded-full bg-white/20" />
                )}
            </div>

            <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-starlight group-hover:text-aurora">
                    {listing.title}
                </h3>
                <div className="flex items-center gap-3 text-[10px] uppercase text-starlight/50">
                    <span className="tracking-widest">{listing.tag}</span>
                    <span className="h-3 w-px bg-white/10" />
                    <span>{formatCondition(listing.condition)}</span>
                </div>
            </div>
        </div>

        {/* Trailing Data Block */}
        <div className="flex items-center gap-8">
            {moderationStatus && (
                <div className={`font-mono text-[10px] uppercase ${statusTone}`}>
                    [{moderationStatus}]
                </div>
            )}
            
            <div className="text-right">
                <div className="font-mono text-lg text-aurora">{price}</div>
                <div className="text-[9px] uppercase tracking-widest text-starlight/30">Credits</div>
            </div>
            
            <button className="hidden rounded border border-white/20 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-starlight transition hover:border-aurora hover:bg-aurora/10 hover:text-aurora sm:block">
                Inspect
            </button>
        </div>

        {/* Corner Brackets (Visual Flair) */}
        <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-white/0 transition-all group-hover:border-aurora" />
        <div className="absolute bottom-0 right-0 h-2 w-2 border-r border-b border-white/0 transition-all group-hover:border-aurora" />
    </div>
  );
}
