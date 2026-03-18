"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import ListingCard from "@/components/ListingCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import type {
  MarketplaceCategory,
  MarketplaceCondition,
  MarketplaceListing,
  MarketplaceSort
} from "@/lib/marketplace";
import { MARKETPLACE_CATEGORIES, MARKETPLACE_CONDITIONS } from "@/lib/marketplace";

type MarketplaceResponse = {
  listings: MarketplaceListing[];
  count: number;
  auth?: {
    writeProtected?: boolean;
    tokenHeader?: string;
  };
  generatedAt: string;
};

type MarketplaceUploadResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  maxBytes: number;
  expiresInSeconds: number;
};

const ALLOWED_UPLOAD_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
const MAX_UPLOAD_INPUT_BYTES = 20 * 1024 * 1024;
const OPTIMIZED_IMAGE_TYPE = "image/webp";
const OPTIMIZED_IMAGE_QUALITY = 0.86;
const OPTIMIZED_MAX_DIMENSION = 2000;

const SELLER_FORM_DEFAULTS = {
  title: "",
  tag: "",
  category: "telescope" as MarketplaceCategory,
  condition: "good" as MarketplaceCondition,
  priceUsd: 500,
  city: "",
  shipping: true,
  description: "",
  imageUrl: ""
};

async function readErrorMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; errors?: string[] }
    | null;
  if (payload?.errors?.length) return payload.errors.join(", ");
  if (payload?.error) return payload.error;
  return fallback;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function replaceFileExtension(name: string, extension: string) {
  return name.replace(/\.[^/.]+$/, "") + `.${extension}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function optimizeImageForUpload(file: File): Promise<File> {
  if (typeof window === "undefined" || !("createImageBitmap" in window)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    try {
      const largestDimension = Math.max(bitmap.width, bitmap.height);
      const scale =
        largestDimension > OPTIMIZED_MAX_DIMENSION ? OPTIMIZED_MAX_DIMENSION / largestDimension : 1;
      const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
      const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        return file;
      }
      context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      const blob = await canvasToBlob(canvas, OPTIMIZED_IMAGE_TYPE, OPTIMIZED_IMAGE_QUALITY);
      if (!blob) {
        return file;
      }

      const optimized = new File([blob], replaceFileExtension(file.name, "webp"), {
        type: OPTIMIZED_IMAGE_TYPE
      });

      const resized = targetWidth < bitmap.width || targetHeight < bitmap.height;
      const smaller = optimized.size < file.size;
      if (!resized && !smaller) {
        return file;
      }
      return optimized;
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}

function uploadFileWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", file.type);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
      onProgress(percent);
    };

    request.onerror = () => reject(new Error("Upload failed due to network error."));
    request.onabort = () => reject(new Error("Upload canceled."));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(new Error("R2 rejected the upload. Check bucket CORS for PUT requests."));
    };

    request.send(file);
  });
}

export default function MarketplaceBrowser() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [data, setData] = useState<MarketplaceResponse | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [maxPrice, setMaxPrice] = useState(1600);
  const [sort, setSort] = useState<MarketplaceSort>("featured");
  const [refreshTick, setRefreshTick] = useState(0);
  const [createStatus, setCreateStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "preparing" | "requesting" | "uploading" | "error" | "success"
  >("idle");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);
  const [editStatus, setEditStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [writeToken, setWriteToken] = useState("");
  const [sellerForm, setSellerForm] = useState({ ...SELLER_FORM_DEFAULTS });
  const [editForm, setEditForm] = useState({
    id: "",
    priceUsd: 0,
    condition: "good" as MarketplaceCondition,
    status: "approved" as MarketplaceListing["status"]
  });

  const [showSellerForm, setShowSellerForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [contactSent, setContactSent] = useState(false);
  const filteredListings = data?.listings ?? [];

  // Select first listing by default when data loads
  useEffect(() => {
    if (data?.listings?.length && !selectedListing) {
      setSelectedListing(data.listings[0]);
    }
  }, [data?.listings, selectedListing]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "all") params.set("category", category);
    if (condition !== "all") params.set("condition", condition);
    params.set("maxPrice", String(maxPrice));
    params.set("sort", sort);
    if (writeToken.trim()) params.set("scope", "all");
    return params.toString();
  }, [query, category, condition, maxPrice, sort, writeToken]);

  useEffect(() => {
    const saved = window.localStorage.getItem("constellation.marketplace.writeToken");
    if (saved) setWriteToken(saved);
  }, []);

  useEffect(() => {
    if (writeToken.trim()) {
      window.localStorage.setItem("constellation.marketplace.writeToken", writeToken.trim());
    } else {
      window.localStorage.removeItem("constellation.marketplace.writeToken");
    }
  }, [writeToken]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    const timer = setTimeout(() => {
      fetch(`/api/marketplace?${queryString}`, {
        signal: controller.signal,
        headers: {
          ...(writeToken.trim() ? { "x-marketplace-write-token": writeToken.trim() } : {})
        }
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Marketplace request failed: ${res.status}`);
          return res.json() as Promise<MarketplaceResponse>;
        })
        .then((payload) => {
          setData(payload);
          setStatus("idle");
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setStatus("error");
        });
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [queryString, refreshTick, writeToken]);

  useEffect(() => {
    if (!data?.listings?.length) return;
    const selected = data.listings.find((listing) => listing.id === editForm.id) ?? data.listings[0];
    setEditForm((prev) => ({
      ...prev,
      id: selected.id,
      priceUsd: selected.priceUsd,
      condition: selected.condition,
      status: selected.status
    }));
  }, [data, editForm.id]);

  async function handleSellerImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
      setUploadStatus("error");
      setUploadMessage("Unsupported format. Use PNG, JPEG, WEBP, or AVIF.");
      setImageInputKey((value) => value + 1);
      return;
    }
    if (file.size > MAX_UPLOAD_INPUT_BYTES) {
      setUploadStatus("error");
      setUploadMessage(
        `Image is too large for browser upload (${formatBytes(file.size)}). Max input is ${formatBytes(
          MAX_UPLOAD_INPUT_BYTES
        )}.`
      );
      setImageInputKey((value) => value + 1);
      return;
    }

    setUploadStatus("preparing");
    setUploadPercent(0);
    setUploadMessage("");

    try {
      const optimizedFile = await optimizeImageForUpload(file);
      const optimized = optimizedFile !== file;
      setUploadStatus("requesting");
      if (optimized) {
        setUploadMessage(
          `Optimized ${formatBytes(file.size)} -> ${formatBytes(optimizedFile.size)} before upload.`
        );
      }

      const initResponse = await fetch("/api/marketplace/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(writeToken.trim() ? { "x-marketplace-write-token": writeToken.trim() } : {})
        },
        body: JSON.stringify({
          filename: optimizedFile.name,
          contentType: optimizedFile.type,
          size: optimizedFile.size
        })
      });

      if (!initResponse.ok) {
        const message = await readErrorMessage(initResponse, "Could not initialize image upload");
        throw new Error(message);
      }

      const initPayload = (await initResponse.json()) as MarketplaceUploadResponse;
      setUploadStatus("uploading");
      setUploadPercent(0);
      await uploadFileWithProgress(initPayload.uploadUrl, optimizedFile, setUploadPercent);

      setSellerForm((prev) => ({ ...prev, imageUrl: initPayload.publicUrl }));
      setUploadStatus("success");
      setUploadMessage(
        optimized
          ? `Image optimized and uploaded (${formatBytes(optimizedFile.size)}).`
          : `Image uploaded (${formatBytes(optimizedFile.size)}).`
      );
      setImageInputKey((value) => value + 1);
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage(error instanceof Error ? error.message : "Could not upload image");
      setSellerForm((prev) => ({ ...prev, imageUrl: "" }));
      setUploadPercent(0);
      setImageInputKey((value) => value + 1);
    }
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploadStatus === "requesting" || uploadStatus === "uploading") return;
    setCreateStatus("saving");

    try {
      const response = await fetch("/api/marketplace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(writeToken.trim() ? { "x-marketplace-write-token": writeToken.trim() } : {})
        },
        body: JSON.stringify(sellerForm)
      });

      if (!response.ok) {
        throw new Error(`Create listing failed: ${response.status}`);
      }

      setSellerForm({ ...SELLER_FORM_DEFAULTS });
      setUploadStatus("idle");
      setUploadPercent(0);
      setUploadMessage("");
      setImageInputKey((value) => value + 1);
      
      // Optimistically add the new listing
      const newListing = await response.json();
      if (newListing.listing) {
          setData(prev => prev ? { ...prev, listings: [newListing.listing, ...prev.listings], count: prev.count + 1 } : null);
      }

      setCreateStatus("success");
      setTimeout(() => setCreateStatus("idle"), 1600);
    } catch {
      setCreateStatus("error");
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editForm.id) return;
    setEditStatus("saving");

    try {
      const response = await fetch(`/api/marketplace/${encodeURIComponent(editForm.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(writeToken.trim() ? { "x-marketplace-write-token": writeToken.trim() } : {})
        },
        body: JSON.stringify({
          priceUsd: editForm.priceUsd,
          condition: editForm.condition,
          status: editForm.status
        })
      });
      if (!response.ok) {
        throw new Error(`Update listing failed: ${response.status}`);
      }
      setEditStatus("success");
      setRefreshTick((tick) => tick + 1);
      setTimeout(() => setEditStatus("idle"), 1600);
    } catch {
      setEditStatus("error");
    }
  }

  if (status === "loading" && !data) {
    return (
      <div className="glass-panel flex min-h-[400px] items-center justify-center rounded-3xl">
        <LoadingSpinner message="Loading listings..." />
      </div>
    );
  }

  if (status === "error" && !data) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <div className="text-ember">Unable to load marketplace listings</div>
        <p className="mt-2 text-sm text-starlight/60">The marketplace is temporarily unavailable. Please try again.</p>
        <button onClick={() => setRefreshTick((t) => t + 1)} className="button-ghost mt-4">
          Retry
        </button>
      </div>
    );
  }

  function handleContactSeller(listing: MarketplaceListing) {
    const subject = encodeURIComponent(`Inquiry about: ${listing.title} (ID: ${listing.id})`);
    const body = encodeURIComponent(`Hi,\n\nI'm interested in your listing "${listing.title}" priced at $${listing.priceUsd}.\n\nPlease let me know if it's still available.\n\nThanks`);
    window.open(`mailto:marketplace@constellation.app?subject=${subject}&body=${body}`, "_self");
    setContactSent(true);
    setTimeout(() => setContactSent(false), 5000);
  }

  // Shared detail panel content (used on both desktop and mobile)
  function renderDetailPanel(listing: MarketplaceListing) {
    return (
      <>
        {listing.imageUrl ? (
          <div className="h-48 lg:h-64 w-full bg-cover bg-center rounded-2xl overflow-hidden" style={{ backgroundImage: `url(${listing.imageUrl})` }}>
            <div className="h-full w-full bg-gradient-to-t from-deep-space to-transparent" />
          </div>
        ) : (
          <div className="flex h-48 lg:h-64 w-full items-center justify-center rounded-2xl bg-white/5">
            <span className="text-xs text-starlight/30">No image available</span>
          </div>
        )}
        <div className="p-5">
          <h2 className="font-display text-xl lg:text-2xl font-bold text-starlight">{listing.title}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 border-y border-white/10 py-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-starlight/50">Tag</div>
              <div className="text-sm text-aurora">{listing.tag}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-starlight/50">Condition</div>
              <div className="text-sm text-starlight">{listing.condition === "like-new" ? "Like new" : listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-starlight/70">
            {listing.description}
          </p>
          <button
            onClick={() => handleContactSeller(listing)}
            className="button-primary mt-6 w-full"
          >
            {contactSent ? "Email opened ✓" : "Inquire about listing"}
          </button>
          <p className="mt-2 text-center text-[11px] text-starlight/40">
            {contactSent
              ? "If your email app didn\u0027t open, email marketplace@constellation.app directly."
              : "Opens your email app with a pre-filled inquiry."}
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* LEFT PANEL: Listings */}
        <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">

          {/* Filters */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Search &amp; filter</div>
              {data?.generatedAt && (
                <div className="text-[10px] text-starlight/30">
                  Updated {new Date(data.generatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </div>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search listings..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-starlight placeholder:text-starlight/30 focus:outline-none focus:ring-1 focus:ring-aurora"
                />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
              >
                <option value="all">All categories</option>
                {MARKETPLACE_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <select
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
                className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
              >
                <option value="all">All conditions</option>
                {MARKETPLACE_CONDITIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-starlight/50">
                  <span>Max price</span>
                  <span className="font-mono">${maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={3000}
                  step={50}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-aurora"
                  aria-label="Maximum price"
                />
              </div>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as MarketplaceSort)}
                className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          </div>

          {/* Listing table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 py-2 px-4 text-[10px] uppercase tracking-widest text-starlight/50">
              <span>Item</span>
              <span>Price</span>
            </div>

            {status === "loading" && !data ? (
              <div className="flex h-96 flex-col items-center justify-center gap-4">
                <LoadingSpinner message="Loading listings..." />
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="py-20 text-center text-sm text-starlight/40">
                No results found. Try adjusting your filters.
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredListings.map((listing) => (
                  <button
                    key={listing.id}
                    onClick={() => setSelectedListing(listing)}
                    className={`w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora transition-colors ${
                      selectedListing?.id === listing.id ? "bg-white/5" : ""
                    }`}
                    type="button"
                  >
                    <ListingCard listing={listing} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile detail panel (shows below list on small screens) */}
          {selectedListing && (
            <div className="glass rounded-2xl overflow-hidden lg:hidden">
              <div className="px-5 pt-4">
                <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Selected listing</div>
              </div>
              {renderDetailPanel(selectedListing)}
            </div>
          )}

          {/* Seller access */}
          <div className="glass rounded-2xl p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-starlight/50 mb-3">Seller access</div>
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={writeToken}
                onChange={(e) => setWriteToken(e.target.value)}
                placeholder="Enter seller token..."
                className="flex-1 rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs text-starlight placeholder:text-starlight/30 focus:outline-none focus:ring-1 focus:ring-aurora"
              />
              {writeToken.trim() && (
                <span className="text-[10px] text-aurora">Authenticated</span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-starlight/30">
              Sellers use tokens to manage their listings. Don&apos;t have one? Email marketplace@constellation.app to apply.
            </p>
          </div>

          {/* Seller form (collapsible, only visible with token) */}
          {writeToken.trim() && (
          <div>
            <button
              onClick={() => setShowSellerForm(!showSellerForm)}
              className="flex w-full items-center justify-between glass rounded-2xl p-4 text-left text-xs text-starlight hover:bg-white/5 transition-colors"
            >
              <span className="font-medium">{showSellerForm ? "Close listing form" : "Create a new listing"}</span>
              <span className={`text-xs transition-transform ${showSellerForm ? "rotate-180 text-aurora" : "text-starlight/40"}`}>▾</span>
            </button>

            {showSellerForm && (
              <div className="glass mt-3 rounded-2xl p-6">
                <div className="text-xs uppercase tracking-[0.3em] text-starlight/50 mb-6">New listing</div>
                <form onSubmit={submitListing} className="grid gap-5">
                  <label className="block text-xs text-starlight/60">
                    Title
                    <input
                      value={sellerForm.title}
                      onChange={(e) => setSellerForm({...sellerForm, title: e.target.value})}
                      required
                      className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
                      placeholder="e.g. Celestron NexStar 8SE"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-xs text-starlight/60">
                      Price (USD)
                      <input
                        type="number"
                        value={sellerForm.priceUsd}
                        onChange={(e) => setSellerForm({...sellerForm, priceUsd: Number(e.target.value)})}
                        required
                        min={1}
                        className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
                      />
                    </label>
                    <label className="block text-xs text-starlight/60">
                      Category
                      <select
                        value={sellerForm.category}
                        onChange={(e) => setSellerForm({...sellerForm, category: e.target.value as MarketplaceCategory})}
                        className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
                      >
                        {MARKETPLACE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-xs text-starlight/60">
                      Condition
                      <select
                        value={sellerForm.condition}
                        onChange={(e) => setSellerForm({...sellerForm, condition: e.target.value as MarketplaceCondition})}
                        className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
                      >
                        {MARKETPLACE_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </label>
                    <label className="block text-xs text-starlight/60">
                      City
                      <input
                        value={sellerForm.city}
                        onChange={(e) => setSellerForm({...sellerForm, city: e.target.value})}
                        required
                        className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
                        placeholder="e.g. Tucson, AZ"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-xs text-starlight/60">
                      Tag
                      <input
                        value={sellerForm.tag}
                        onChange={(e) => setSellerForm({...sellerForm, tag: e.target.value})}
                        className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
                        placeholder="e.g. Motorized tracking"
                      />
                    </label>
                    <div className="flex items-end">
                      <label className="flex items-center gap-3 p-2.5 text-xs text-starlight/60 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sellerForm.shipping}
                          onChange={(e) => setSellerForm({...sellerForm, shipping: e.target.checked})}
                          className="h-4 w-4 accent-aurora"
                        />
                        Shipping available
                      </label>
                    </div>
                  </div>
                  <label className="block text-xs text-starlight/60">
                    Description
                    <textarea
                      value={sellerForm.description}
                      onChange={(e) => setSellerForm({...sellerForm, description: e.target.value})}
                      required
                      rows={4}
                      className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
                    />
                  </label>
                  <label className="block text-xs text-starlight/60">
                    Image
                    <input
                      key={imageInputKey}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      onChange={handleSellerImageUpload}
                      disabled={uploadStatus === "uploading" || uploadStatus === "requesting"}
                      className="mt-1.5 block w-full text-sm text-starlight file:mr-4 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:px-4 file:py-2 file:text-xs file:text-aurora hover:file:bg-white/10"
                    />
                  </label>
                  {uploadStatus !== "idle" && (
                    <div className="text-xs">
                      {uploadStatus === "preparing" && <span className="text-starlight/50">Optimizing image...</span>}
                      {uploadStatus === "requesting" && <span className="text-starlight/50">Requesting upload slot...</span>}
                      {uploadStatus === "uploading" && (
                        <div className="flex items-center gap-2">
                          <div className="h-1 flex-1 rounded-full bg-white/10"><div className="h-full rounded-full bg-aurora transition-all" style={{ width: `${uploadPercent}%` }} /></div>
                          <span className="text-aurora">{uploadPercent}%</span>
                        </div>
                      )}
                      {uploadStatus === "success" && <span className="text-aurora">{uploadMessage}</span>}
                      {uploadStatus === "error" && <span className="text-ember">{uploadMessage}</span>}
                    </div>
                  )}
                  {sellerForm.imageUrl && (
                    <div className="text-xs text-aurora truncate">Image ready: {sellerForm.imageUrl}</div>
                  )}
                  {createStatus === "error" && <div className="text-xs text-ember">Submission failed. Check fields and try again.</div>}
                  {createStatus === "success" && <div className="text-xs text-aurora">Listing created successfully.</div>}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={createStatus === "saving" || uploadStatus === "uploading" || uploadStatus === "requesting"}
                      className="button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createStatus === "saving" ? "Submitting..." : "Submit listing"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          )}
        </div>

        {/* RIGHT PANEL: Detail (desktop only) */}
        <div className="hidden lg:col-span-5 lg:block xl:col-span-4">
          <div className="sticky top-24">
            <div className="glass rounded-2xl overflow-hidden">
              {selectedListing ? (
                renderDetailPanel(selectedListing)
              ) : (
                <div className="flex h-96 items-center justify-center text-center">
                  <div className="text-sm text-starlight/40">
                    Select a listing to see details
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
