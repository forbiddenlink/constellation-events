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
      <div className="glass rounded-3xl p-6">
        <LoadingSpinner message="Loading marketplace inventory..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-starlight/70">
          <div className="font-semibold text-starlight/90">Write access</div>
          <div className="mt-1">
            {data?.auth?.writeProtected
              ? `Protected. Add ${data.auth.tokenHeader || "x-marketplace-write-token"} to create/update listings.`
              : "Open write mode (no token configured)."}
          </div>
          <input
            value={writeToken}
            onChange={(event) => setWriteToken(event.target.value)}
            placeholder="Marketplace write token (optional unless protected)"
            className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search scopes, cameras, mounts..."
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-starlight outline-none ring-0 placeholder:text-starlight/40 focus:border-aurora/60"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-starlight outline-none focus:border-aurora/60"
          >
            <option value="all">All categories</option>
            {MARKETPLACE_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-starlight outline-none focus:border-aurora/60"
          >
            <option value="all">Any condition</option>
            {MARKETPLACE_CONDITIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as MarketplaceSort)}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-starlight outline-none focus:border-aurora/60"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-starlight/60">
            <span>Max price</span>
            <span>${maxPrice}</span>
          </div>
          <input
            type="range"
            min={80}
            max={3000}
            step={10}
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-ember"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-starlight/60">
          <div>{data?.count ?? 0} matching listings</div>
          <div>
            Updated{" "}
            {data?.generatedAt
              ? new Date(data.generatedAt).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit"
                })
              : "just now"}
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Seller quick post</div>
        <form onSubmit={submitListing} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={sellerForm.title}
            onChange={(event) => setSellerForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Listing title"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
            required
          />
          <input
            value={sellerForm.tag}
            onChange={(event) => setSellerForm((prev) => ({ ...prev, tag: event.target.value }))}
            placeholder="Tag (example: Deep-sky)"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
            required
          />
          <input
            value={sellerForm.city}
            onChange={(event) => setSellerForm((prev) => ({ ...prev, city: event.target.value }))}
            placeholder="City, State"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
            required
          />
          <input
            type="number"
            min={1}
            value={sellerForm.priceUsd}
            onChange={(event) =>
              setSellerForm((prev) => ({ ...prev, priceUsd: Number(event.target.value) || 0 }))
            }
            placeholder="Price USD"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
            required
          />
          <input
            value={sellerForm.description}
            onChange={(event) =>
              setSellerForm((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="Short description (optional)"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60 md:col-span-2"
            maxLength={320}
          />
          <label className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight md:col-span-2">
            <span className="text-xs text-starlight/70">Listing image (optional)</span>
            <input
              key={imageInputKey}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={handleSellerImageUpload}
              className="mt-2 block w-full text-xs text-starlight/80 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-aurora/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-aurora"
            />
            <div className="mt-1 text-[11px] text-starlight/50">
              PNG/JPEG/WEBP/AVIF. Files are optimized client-side before upload.
            </div>
            {uploadStatus === "preparing" ? (
              <div className="mt-2 text-xs text-starlight/70">Optimizing image...</div>
            ) : null}
            {uploadStatus === "requesting" || uploadStatus === "uploading" ? (
              <div className="mt-2 space-y-2">
                <div className="text-xs text-starlight/70">
                  Uploading image{uploadStatus === "uploading" ? ` (${uploadPercent}%)` : "..."}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-aurora transition-[width] duration-150"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            ) : null}
            {uploadStatus === "success" && sellerForm.imageUrl ? (
              <div className="mt-2 space-y-2 text-xs text-aurora">
                <div>{uploadMessage}</div>
                <div
                  className="h-20 w-20 rounded-lg border border-white/10 bg-cover bg-center"
                  style={{ backgroundImage: `url(${sellerForm.imageUrl})` }}
                />
              </div>
            ) : null}
            {uploadStatus === "error" ? (
              <div className="mt-2 text-xs text-ember">{uploadMessage}</div>
            ) : null}
          </label>
          <select
            value={sellerForm.category}
            onChange={(event) =>
              setSellerForm((prev) => ({
                ...prev,
                category: event.target.value as MarketplaceCategory
              }))
            }
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
          >
            {MARKETPLACE_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={sellerForm.condition}
            onChange={(event) =>
              setSellerForm((prev) => ({
                ...prev,
                condition: event.target.value as MarketplaceCondition
              }))
            }
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
          >
            {MARKETPLACE_CONDITIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight">
            <input
              type="checkbox"
              checked={sellerForm.shipping}
              onChange={(event) =>
                setSellerForm((prev) => ({ ...prev, shipping: event.target.checked }))
              }
              className="accent-aurora"
            />
            Shipping available
          </label>
          <button
            type="submit"
            disabled={
              createStatus === "saving" ||
              uploadStatus === "requesting" ||
              uploadStatus === "uploading"
            }
            className="button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createStatus === "saving" ? "Posting..." : "Post listing"}
          </button>
        </form>
        {createStatus === "success" ? (
          <div className="mt-3 text-xs text-aurora">Listing posted successfully.</div>
        ) : null}
        {createStatus === "error" ? (
          <div className="mt-3 text-xs text-ember">Could not post listing. Check fields and try again.</div>
        ) : null}
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Quick update</div>
        <form onSubmit={submitEdit} className="mt-4 grid gap-3 md:grid-cols-4">
          <select
            value={editForm.id}
            onChange={(event) => {
              const selected = data?.listings.find((listing) => listing.id === event.target.value);
              if (!selected) return;
              setEditForm({
                id: selected.id,
                priceUsd: selected.priceUsd,
                condition: selected.condition,
                status: selected.status
              });
            }}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
            disabled={!data?.listings.length}
          >
            {(data?.listings ?? []).map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listing.title}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={editForm.priceUsd}
            onChange={(event) =>
              setEditForm((prev) => ({ ...prev, priceUsd: Number(event.target.value) || 0 }))
            }
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
            required
          />
          <select
            value={editForm.condition}
            onChange={(event) =>
              setEditForm((prev) => ({
                ...prev,
                condition: event.target.value as MarketplaceCondition
              }))
            }
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
          >
            {MARKETPLACE_CONDITIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={editForm.status}
            onChange={(event) =>
              setEditForm((prev) => ({
                ...prev,
                status: event.target.value as MarketplaceListing["status"]
              }))
            }
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-starlight outline-none focus:border-aurora/60"
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="hidden">Hidden</option>
          </select>
          <button
            type="submit"
            disabled={editStatus === "saving" || !editForm.id}
            className="button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editStatus === "saving" ? "Updating..." : "Update listing"}
          </button>
        </form>
        {editStatus === "success" ? (
          <div className="mt-3 text-xs text-aurora">Listing updated.</div>
        ) : null}
        {editStatus === "error" ? (
          <div className="mt-3 text-xs text-ember">Could not update listing.</div>
        ) : null}
      </div>

      {status === "error" ? (
        <div className="glass rounded-2xl p-4 text-sm text-ember">
          Marketplace data is temporarily unavailable.
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {(data?.listings ?? []).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {data && data.listings.length === 0 ? (
        <div className="glass rounded-2xl p-5 text-sm text-starlight/70">
          No listings match those filters. Increase max price or broaden category/condition.
        </div>
      ) : null}
    </div>
  );
}
