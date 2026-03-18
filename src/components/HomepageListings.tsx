"use client";

import { useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import type { MarketplaceListing } from "@/lib/marketplace";

type MarketplaceResponse = {
  listings: MarketplaceListing[];
  count: number;
};

export default function HomepageListings() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace?maxPrice=9999&sort=featured")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<MarketplaceResponse>;
      })
      .then((data) => {
        setListings(data.listings.slice(0, 3));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-2xl overflow-hidden animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/10 px-4 py-4">
            <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-white/10" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="mt-2 h-3 w-20 rounded bg-white/5" />
            </div>
            <div className="h-5 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-starlight/40">
        Marketplace listings temporarily unavailable.
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
      {listings.length === 0 && (
        <div className="p-5 text-sm text-starlight/40">
          No listings available right now.
        </div>
      )}
    </div>
  );
}
