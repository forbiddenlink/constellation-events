"use client";

import { useEffect, useState } from "react";
import type { TonightObject } from "@/lib/mock";
import useGeolocation from "@/hooks/useGeolocation";

type TonightResponse = {
  highlights: TonightObject[];
  generatedAt: string;
  source?: string;
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function TonightAtGlance() {
  const [data, setData] = useState<TonightResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const geo = useGeolocation();

  useEffect(() => {
    let isMounted = true;
    setStatus("loading");
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }

    fetch(`/api/sky/tonight?${params.toString()}`)
      .then((res) => res.json())
      .then((payload: TonightResponse) => {
        if (!isMounted) return;
        setData(payload);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });
    return () => {
      isMounted = false;
    };
  }, [geo.status, geo.lat, geo.lng]);

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-starlight/50">
        <span>Tonight at a glance</span>
        <span className="text-[10px] tracking-[0.3em] text-starlight/40">
          {data?.generatedAt ? `Updated ${formatTimestamp(data.generatedAt)}` : "Live feed"}
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {status === "loading" && (
          <div className="text-sm text-starlight/60">Syncing the sky feed...</div>
        )}
        {status === "error" && (
          <div className="text-sm text-ember">Sky feed unavailable. Showing cached highlights.</div>
        )}
        {(data?.highlights ?? []).map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-6">
            <div>
              <div className="text-sm text-starlight/80">{item.type}</div>
              <div className="text-lg font-semibold text-starlight">{item.name}</div>
              <div className="text-xs text-starlight/60">Best window: {item.bestTime}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-aurora">{item.magnitude}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-starlight/40">
                {item.metricLabel ?? "Mag"}
              </div>
            </div>
          </div>
        ))}
      </div>
      {data?.source && (
        <div className="mt-4 text-[10px] uppercase tracking-[0.3em] text-starlight/40">
          Source: {data.source}
        </div>
      )}
    </div>
  );
}
