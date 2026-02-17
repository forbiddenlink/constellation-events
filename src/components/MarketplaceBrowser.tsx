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
        <LoadingSpinner message="Scanning deep-space inventory..." />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Grid Lines to enhance 'Technical' feel */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="mx-auto max-w-[1600px] p-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* LEFT PANEL: The Manifest (List) */}
          <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
            
            {/* Control Deck (Filters) */}
            <div className="glass-panel relative rounded-lg border border-white/10 p-6">
                <div className="absolute top-0 left-0 h-2 w-2 border-l-2 border-t-2 border-aurora" />
                <div className="absolute top-0 right-0 h-2 w-2 border-r-2 border-t-2 border-aurora" />
                
                <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-aurora">System Query Protocol</h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="relative">
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="SEARCH MANIFEST..."
                            className="w-full bg-deep-space/50 p-3 font-mono text-sm text-starlight placeholder:text-starlight/20 focus:outline-none focus:ring-1 focus:ring-aurora"
                        />
                        <div className="absolute right-3 top-3 h-2 w-2 animate-pulse bg-aurora rounded-full" />
                    </div>
                     <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        className="bg-deep-space/50 p-3 font-mono text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora uppercase"
                    >
                        <option value="all">Category: All</option>
                        {MARKETPLACE_CATEGORIES.map((item) => (
                        <option key={item.value} value={item.value}>
                            Category: {item.label}
                        </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Manifest List */}
            <div className="min-h-[600px] border-t border-white/20">
                <div className="flex items-center justify-between border-b border-white/10 py-2 px-4 font-mono text-[10px] uppercase tracking-widest text-starlight/50">
                    <span>ID / Visual</span>
                    <span>Specification</span>
                    <span className="hidden sm:inline-block">Status</span>
                </div>
                
                {status === "loading" && !data ? (
                    <div className="flex h-96 flex-col items-center justify-center gap-4 text-aurora">
                        <div className="h-16 w-16 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <div className="font-mono text-xs animate-pulse">ACCESSING DATABASE...</div>
                    </div>
                ) : (
                    <>
                        {filteredListings.length === 0 ? (
                            <div className="py-20 text-center font-mono text-starlight/30">
                                NO RESULTS FOUND IN SECTOR
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {filteredListings.map((listing) => (
                                     <button 
                                        key={listing.id} 
                                        onClick={() => setSelectedListing(listing)}
                                        className="w-full text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-aurora"
                                        type="button"
                                     >
                                        <ListingCard listing={listing} />
                                     </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Seller Command Center (Collapsible) */}
             <div className="mt-8">
                 <button 
                    onClick={() => setShowSellerForm(!showSellerForm)}
                    className="flex w-full items-center justify-between border border-white/10 bg-white/5 p-4 text-left font-mono text-xs uppercase tracking-widest text-starlight hover:bg-white/10"
                 >
                     <span>{showSellerForm ? "[-] Terminate Uplink" : "[+] Initialize Seller Uplink"}</span>
                     <span className={showSellerForm ? "text-aurora" : "text-starlight/30"}>{showSellerForm ? "ACTIVE" : "STANDBY"}</span>
                 </button>
                 
                {showSellerForm && (
                <div className="mt-4 border border-white/10 bg-midnight p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="font-mono text-xs uppercase text-aurora">New Manifest Entry</div>
                    </div>
                    
                    <form onSubmit={submitListing} className="grid gap-6">
                        <div>
                             <label className="mb-2 block font-mono text-[10px] uppercase text-aurora">
                                 Item Designation
                                 <input
                                    value={sellerForm.title}
                                    onChange={(e) => setSellerForm({...sellerForm, title: e.target.value})}
                                    required
                                    className="mt-2 w-full bg-deep-space border border-white/10 p-2 font-mono text-sm text-starlight focus:border-aurora focus:outline-none"
                                    placeholder="E.g. CELESTRON 8SE"
                                />
                             </label>
                        </div>
                        {/* Compact Grid for other inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block font-mono text-[10px] uppercase text-aurora">
                                    Value (Credits)
                                    <input
                                        type="number"
                                        value={sellerForm.priceUsd}
                                        onChange={(e) => setSellerForm({...sellerForm, priceUsd: Number(e.target.value)})}
                                        required
                                        className="mt-2 w-full bg-deep-space border border-white/10 p-2 font-mono text-sm text-starlight focus:border-aurora focus:outline-none"
                                    />
                                </label>
                            </div>
                            <div>
                                <label className="mb-2 block font-mono text-[10px] uppercase text-aurora">
                                    Class
                                    <select 
                                        value={sellerForm.tag}
                                        onChange={(e) => setSellerForm({...sellerForm, tag: e.target.value})}
                                        className="mt-2 w-full bg-deep-space border border-white/10 p-2 font-mono text-sm text-starlight focus:border-aurora focus:outline-none"
                                    >
                                        {MARKETPLACE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </label>
                            </div>
                        </div>
                        
                        <div>
                             <label className="mb-2 block font-mono text-[10px] uppercase text-aurora">
                                 Technical Specs / Description
                                 <textarea
                                    value={sellerForm.description}
                                    onChange={(e) => setSellerForm({...sellerForm, description: e.target.value})}
                                    required
                                    rows={4}
                                    className="mt-2 w-full bg-deep-space border border-white/10 p-2 font-mono text-sm text-starlight focus:border-aurora focus:outline-none"
                                />
                             </label>
                        </div>

                         <div className="flex justify-end">
                            <button type="submit" disabled={createStatus === "saving"} className="bg-aurora px-6 py-2 font-mono text-xs font-bold text-deep-space hover:bg-white">
                                {createStatus === "saving" ? "TRANSMITTING..." : "UPLOAD MANIFEST"}
                            </button>
                         </div>
                    </form>
                </div>
                )}
             </div>

          </div>

          {/* RIGHT PANEL: The Lens (Preview) */}
          <div className="hidden lg:col-span-5 lg:block xl:col-span-4">
            <div className="sticky top-24">
                <div className="relative overflow-hidden border border-white/20 bg-deep-space/80 backdrop-blur-xl p-1 shadow-cinematic">
                     <div className="absolute top-0 right-0 p-2">
                        <div className="font-mono text-[10px] text-aurora animate-pulse">LIVE FEED // ONLINE</div>
                     </div>
                     
                     {/* Placeholder for 'Selected Item' - defaulting to first item or selectedListing state if we added it */}
                     {selectedListing ? (
                        <>
                             {selectedListing.imageUrl ? (
                                <div className="h-64 w-full bg-cover bg-center" style={{ backgroundImage: `url(${selectedListing.imageUrl})` }}>
                                    <div className="h-full w-full bg-gradient-to-t from-deep-space to-transparent" />
                                </div>
                             ) : (
                                <div className="flex h-64 w-full items-center justify-center bg-white/5">
                                    <span className="font-mono text-xs text-white/20">NO VISUAL DATA</span>
                                </div>
                             )}
                             
                             <div className="p-6">
                                <h2 className="font-mono text-2xl font-bold text-starlight uppercase">{selectedListing.title}</h2>
                                <div className="mt-4 grid grid-cols-2 gap-4 border-y border-white/10 py-4">
                                    <div>
                                        <div className="font-mono text-[9px] text-starlight/50 uppercase">Classification</div>
                                        <div className="text-aurora">{selectedListing.tag}</div>
                                    </div>
                                    <div>
                                        <div className="font-mono text-[9px] text-starlight/50 uppercase">Condition</div>
                                        <div className="text-starlight">{selectedListing.condition}</div>
                                    </div>
                                </div>
                                <p className="mt-4 font-mono text-xs leading-relaxed text-starlight/70">
                                    {selectedListing.description}
                                </p>
                                
                                <button className="mt-6 w-full border border-aurora bg-aurora/10 py-3 font-mono text-xs uppercase tracking-widest text-aurora hover:bg-aurora hover:text-deep-space transition-colors">
                                    Initiate Acquisition
                                </button>
                             </div>
                        </>
                     ) : (
                         <div className="flex h-96 items-center justify-center text-center">
                            <div className="font-mono text-xs text-starlight/30">
                                SELECT TARGET FROM MANIFEST
                            </div>
                         </div>
                     )}
                     
                     {/* Decoration */}
                     <div className="absolute bottom-2 right-2 flex gap-1">
                         <div className="h-1 w-1 bg-aurora rounded-full" />
                         <div className="h-1 w-1 bg-aurora/50 rounded-full" />
                         <div className="h-1 w-1 bg-aurora/20 rounded-full" />
                     </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
