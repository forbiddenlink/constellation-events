"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface APODData {
  date: string;
  title: string;
  explanation: string;
  imageUrl: string;
  hdImageUrl?: string;
  mediaType: "image" | "video";
  copyright?: string;
  source: "nasa" | "cached" | "fallback";
}

/**
 * Astronomy Picture of the Day card
 *
 * Displays NASA's daily featured astronomical image with title and description.
 */
export default function APODCard() {
  const [apod, setApod] = useState<APODData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchAPOD() {
      try {
        const response = await fetch("/api/apod");
        if (response.ok) {
          const data = await response.json();
          setApod(data);
        }
      } catch (error) {
        console.error("Failed to fetch APOD:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAPOD();
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-3xl overflow-hidden animate-pulse">
        <div className="aspect-video bg-white/5" />
        <div className="p-6 space-y-3">
          <div className="h-6 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!apod) {
    return null;
  }

  const truncatedExplanation =
    apod.explanation.length > 200
      ? apod.explanation.slice(0, 200) + "..."
      : apod.explanation;

  return (
    <div className="glass rounded-3xl overflow-hidden group">
      {/* Image/Video */}
      <div className="relative aspect-video overflow-hidden">
        {apod.mediaType === "video" ? (
          <iframe
            src={apod.imageUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            title={apod.title}
          />
        ) : (
          <>
            <Image
              src={apod.imageUrl}
              alt={apod.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized={apod.imageUrl.startsWith("http")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        )}

        {/* NASA Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
          <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
          </svg>
          <span className="text-xs font-medium text-white">NASA APOD</span>
        </div>

        {/* Date */}
        <div className="absolute top-4 right-4 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-xs font-mono text-starlight/80">{apod.date}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <h3 className="font-display text-xl text-starlight">{apod.title}</h3>

        <p className="text-sm text-starlight/70 leading-relaxed">
          {expanded ? apod.explanation : truncatedExplanation}
        </p>

        {apod.explanation.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-aurora hover:text-aurora/80 transition-colors"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {apod.copyright && (
          <p className="text-xs text-starlight/40">
            Credit: {apod.copyright}
          </p>
        )}

        {/* HD Link */}
        {apod.hdImageUrl && (
          <a
            href={apod.hdImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-aurora/80 hover:text-aurora transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            View HD Image
          </a>
        )}
      </div>
    </div>
  );
}
