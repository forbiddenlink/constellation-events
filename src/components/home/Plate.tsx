"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type APODData = {
  date: string;
  title: string;
  explanation: string;
  imageUrl: string;
  hdImageUrl?: string;
  mediaType: "image" | "video";
  copyright?: string;
  source: "nasa" | "cached" | "fallback";
};

const SHORT = 220;

/** The plate: NASA's Astronomy Picture of the Day, mounted with photo corners. */
export default function Plate() {
  const [apod, setApod] = useState<APODData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [expanded, setExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/apod")
      .then((res) => {
        if (!res.ok) throw new Error("APOD request failed");
        return res.json() as Promise<APODData>;
      })
      .then((d) => {
        if (!live) return;
        setApod(d);
        setState("ready");
      })
      .catch(() => {
        if (live) setState("error");
      });
    return () => {
      live = false;
    };
  }, []);

  if (state !== "ready" || !apod) {
    return (
      <div className="log-page">
        <p className="mono">
          {state === "loading" ? "Loading today's plate..." : "Today's astronomy picture is unavailable right now."}
        </p>
      </div>
    );
  }

  const long = apod.explanation.length > SHORT;
  const text = expanded || !long ? apod.explanation : `${apod.explanation.slice(0, SHORT).trimEnd()}...`;

  const showPhoto = apod.mediaType === "video" || !imageFailed;

  return (
    <div className="log-page">
      <div className={showPhoto ? "plate" : "plate plate-solo"}>
        {showPhoto && (
        <div className="plate-photo">
          <span className="corner tl" aria-hidden="true" />
          <span className="corner tr" aria-hidden="true" />
          <span className="corner bl" aria-hidden="true" />
          <span className="corner br" aria-hidden="true" />
          {apod.mediaType === "video" ? (
            <iframe src={apod.imageUrl} allowFullScreen title={apod.title} />
          ) : (
            <Image
              src={apod.imageUrl}
              alt={apod.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 900px) 100vw, 55vw"
              unoptimized={apod.imageUrl.startsWith("http")}
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
        )}
        <div>
          <p className="mono">Plate, NASA APOD, {apod.date}</p>
          <h3 className="plate-title">{apod.title}</h3>
          <p className="plate-text" style={{ marginTop: 12 }}>
            {text}
          </p>
          {long && (
            <button type="button" className="link-ink" onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
          <p className="mono" style={{ marginTop: 8 }}>
            Credit: {apod.copyright ?? "NASA"}
            {apod.source !== "nasa" ? ` (${apod.source} copy)` : ""}
          </p>
          {!showPhoto && (
            <a href="https://apod.nasa.gov/apod/astropix.html" target="_blank" rel="noopener noreferrer" className="link-ink">
              Open today&apos;s picture on apod.nasa.gov
            </a>
          )}
          {apod.hdImageUrl && showPhoto && (
            <a href={apod.hdImageUrl} target="_blank" rel="noopener noreferrer" className="link-ink">
              View HD image
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
