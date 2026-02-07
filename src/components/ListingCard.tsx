import type { ListingItem } from "@/lib/mock";

export default function ListingCard({ listing }: { listing: ListingItem }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-aurora/70">
          {listing.tag}
        </span>
        <span className="text-xs text-starlight/60">{listing.condition}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-starlight">{listing.title}</h3>
      <div className="mt-3 text-xl font-semibold text-ember">{listing.price}</div>
      <button className="mt-4 w-full rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-starlight/70 transition hover:border-aurora hover:text-aurora">
        Request to buy
      </button>
    </div>
  );
}
