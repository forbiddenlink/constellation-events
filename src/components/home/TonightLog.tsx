"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { tonightHighlights } from "@/lib/mock";
import type { TonightObject } from "@/lib/mock";
import useGeolocation from "@/hooks/useGeolocation";
import LocalTime from "@/components/LocalTime";

type TonightResponse = {
  highlights: TonightObject[];
  generatedAt: string;
  source?: string;
};

const ENTRY_COUNT = 5;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// bestTime is either an ISO UTC instant (JPL Horizons) or plain text
// ("Alt: 42°") from the astronomy-engine fallback. Only the former needs
// viewer-local formatting.
const isIsoInstant = (value: string) => ISO_INSTANT.test(value);

const METRIC_TOOLTIPS: Record<string, string> = {
  Mag: "Astronomical magnitude: lower numbers are brighter",
  Alt: "Altitude above the horizon at the best viewing time",
  Illum: "Percent of the visible disc that is illuminated"
};

function altitudePercent(item: TonightObject): number | null {
  if (item.metricLabel !== "Alt") return null;
  const n = Number.parseFloat(item.magnitude);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, (n / 90) * 100));
}

/**
 * Tonight's log. A pinned, scroll-scrubbed torch sweeps down a field-log page
 * (CSS scroll-driven animation in home.css, no JavaScript). The entries come
 * from /api/sky/tonight. Until that feed answers, and whenever it fails, the
 * page shows the three repo mock rows stamped SAMPLE.
 */
export default function TonightLog() {
  const [data, setData] = useState<TonightResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const geo = useGeolocation();

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }

    fetch(`/api/sky/tonight?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Sky feed request failed: ${res.status}`);
        return res.json() as Promise<TonightResponse>;
      })
      .then((payload) => {
        if (!isMounted) return;
        setData(payload);
        setFailed(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setFailed(true);
      });
    return () => {
      isMounted = false;
    };
  }, [geo.status, geo.lat, geo.lng]);

  const live = data !== null && data.highlights.length > 0;
  const sample = !live;
  const items = (live ? data.highlights : tonightHighlights).slice(0, ENTRY_COUNT);
  const short = live && items.length < ENTRY_COUNT;
  const rows = items.length + (short ? 1 : 0);

  return (
    <section id="tonight" className="torch-track" aria-labelledby="tonight-h">
      <div className="torch-stage">
        <div className="torch-stage-head">
          <p className="eyebrow">Tonight&apos;s log</p>
          <h2 id="tonight-h" className="display-sm">
            Entries for tonight.
          </h2>
        </div>

        <div
          className="sheet"
          role="group"
          aria-label="Tonight's log"
          style={{ "--rows": rows } as CSSProperties}
        >
          <div className="sheet-bg bg-dark" aria-hidden="true" />
          <div className="sheet-bg bg-lit" aria-hidden="true" />
          <div className="beam" aria-hidden="true" />
          <div className="sheet-content">
            <div className="sheet-head">
              <p className="mono">
                {sample ? (failed ? "Feed unavailable. Sample rows." : "Sample rows until the feed answers.") : "Live from the sky feed."}
              </p>
            </div>
            {sample && <span className="stamp sheet-stamp">Sample</span>}

            <ol className="entries" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {items.map((item, i) => {
                const alt = altitudePercent(item);
                return (
                  <li key={item.id} className="entry">
                    <span className="entry-n">{i + 1}</span>
                    <div>
                      <div className="entry-name">{item.name}</div>
                      <span className="entry-line">
                        {item.type} · best{" "}
                        {isIsoInstant(item.bestTime) ? (
                          <LocalTime iso={item.bestTime} format={formatTimestamp} />
                        ) : (
                          item.bestTime
                        )}
                      </span>
                    </div>
                    <div className="entry-metric">
                      <strong>{item.magnitude}</strong>
                      <span className="mono" title={METRIC_TOOLTIPS[item.metricLabel ?? "Mag"] ?? "Best-time observing metric"}>
                        {item.metricLabel ?? "Mag"}
                      </span>
                      {alt !== null && (
                        <span className="alt-bar" aria-hidden="true">
                          <i style={{ width: `${alt}%` }} />
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
              {short && (
                <li className="entry entry-end">
                  <span className="entry-n dark" aria-hidden="true">
                    -
                  </span>
                  <div>
                    <div className="entry-line">Nothing else bright tonight.</div>
                  </div>
                </li>
              )}
            </ol>

            <div className="sheet-foot">
              <span className="mono">
                {data?.generatedAt ? (
                  <>
                    Updated <LocalTime iso={data.generatedAt} format={formatTimestamp} />
                  </>
                ) : (
                  "Live feed"
                )}
              </span>
              {data?.source && <span className="mono">Source: {data.source}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
