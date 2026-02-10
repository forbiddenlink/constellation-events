import type { MarketplaceListing } from "@/lib/marketplace";
import type { ListingItem } from "@/lib/mock";

type ListingModel = MarketplaceListing | ListingItem;

function isMarketplaceListing(listing: ListingModel): listing is MarketplaceListing {
  return "priceUsd" in listing;
}

function formatCondition(value: MarketplaceListing["condition"] | string) {
  if (value === "like-new") return "Like new";
  if (value === "excellent") return "Excellent";
  if (value === "good") return "Good";
  if (value === "Very good") return "Very good";
  if (value === "Like new") return "Like new";
  if (value === "Excellent") return "Excellent";
  return "Fair";
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export default function ListingCard({ listing }: { listing: ListingModel }) {
  const price = isMarketplaceListing(listing) ? formatPrice(listing.priceUsd) : listing.price;
  const locationMeta = isMarketplaceListing(listing)
    ? `${listing.city} · ${listing.shipping ? "Ships" : "Pickup"}`
    : null;
  const ratingMeta = isMarketplaceListing(listing)
    ? `Seller rating ${listing.sellerRating.toFixed(1)}/5`
    : null;
  const description = isMarketplaceListing(listing) ? listing.description : null;
  const imageUrl = isMarketplaceListing(listing) ? listing.imageUrl : null;
  const moderationStatus = isMarketplaceListing(listing) ? listing.status : null;
  const statusTone =
    moderationStatus === "hidden"
      ? "text-ember border-ember/40"
      : moderationStatus === "pending"
        ? "text-amber-300 border-amber-300/40"
        : "text-emerald-300 border-emerald-300/40";

  return (
    <div className="glass rounded-2xl p-5">
      {imageUrl ? (
        <div
          className="mb-4 h-36 w-full rounded-xl border border-white/10 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      ) : null}
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-aurora/70">
          {listing.tag}
        </span>
        <div className="flex items-center gap-2">
          {moderationStatus ? (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusTone}`}>
              {moderationStatus}
            </span>
          ) : null}
          <span className="text-xs text-starlight/60">{formatCondition(listing.condition)}</span>
        </div>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-starlight">{listing.title}</h3>
      {description ? <div className="mt-2 text-sm text-starlight/70">{description}</div> : null}
      {locationMeta ? <div className="mt-2 text-xs text-starlight/60">{locationMeta}</div> : null}
      <div className="mt-3 text-xl font-semibold text-ember">{price}</div>
      {ratingMeta ? <div className="mt-2 text-xs text-starlight/60">{ratingMeta}</div> : null}
      <button className="mt-4 w-full rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-starlight/70 transition hover:border-aurora hover:text-aurora">
        View listing
      </button>
    </div>
  );
}
