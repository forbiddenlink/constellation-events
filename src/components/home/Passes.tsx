"use client";

import { useEffect, useState } from "react";
import useGeolocation from "@/hooks/useGeolocation";

const DEFAULT_LAT = 36.1147;
const DEFAULT_LNG = -115.1728;

type ISSPass = {
  risetime: string;
  duration: number;
  brightness: "visible" | "possibly-visible" | "not-visible";
  formatted: { time: string; riseDirection: string; setDirection: string; maxAltitude: string };
};

type ISSData = {
  position: { latitude: number; longitude: number; altitude: number; velocity: number } | null;
  passes: ISSPass[];
  source: "satellite.js" | "api" | "estimated";
  generatedAt: string;
};

type AuroraData = {
  current: { kp: number; stormLevel: string; description: string };
  forecast: Array<{ time: string; kp: number; observed: boolean }>;
  visibility: { probability: string; minimumLatitude: number; message: string };
  source: "noaa" | "estimated";
};

const BRIGHTNESS: Record<ISSPass["brightness"], string> = {
  visible: "Bright",
  "possibly-visible": "Visible",
  "not-visible": "Dim"
};

function useTarget() {
  const geo = useGeolocation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (geo.status === "loading") return null;
  if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
    return { lat: geo.lat, lng: geo.lng, isDefault: false };
  }
  return { lat: DEFAULT_LAT, lng: DEFAULT_LNG, isDefault: true };
}

function IssStrip({ lat, lng }: { lat: number; lng: number }) {
  const [data, setData] = useState<ISSData | null>(null);
  const [failed, setFailed] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    let live = true;
    const load = () =>
      fetch(`/api/iss?lat=${lat}&lng=${lng}&count=5`)
        .then((res) => {
          if (!res.ok) throw new Error("ISS request failed");
          return res.json() as Promise<ISSData>;
        })
        .then((d) => {
          if (!live) return;
          setData(d);
          setFailed(false);
        })
        .catch(() => {
          if (live) setFailed(true);
        });
    load();
    const id = setInterval(load, 30000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [lat, lng]);

  const next = data?.passes[0];

  return (
    <div className="strip">
      <h3 className="strip-label">ISS</h3>
      <div>
        {failed && !data && <p className="mono">ISS data unavailable right now.</p>}
        {!data && !failed && <p className="mono">Tracking the station...</p>}
        {data?.position && (
          <dl className="kv">
            <div>
              <dt>Latitude</dt>
              <dd>{data.position.latitude.toFixed(2)}°</dd>
            </div>
            <div>
              <dt>Longitude</dt>
              <dd>{data.position.longitude.toFixed(2)}°</dd>
            </div>
            <div>
              <dt>Altitude</dt>
              <dd>{Math.round(data.position.altitude)} km</dd>
            </div>
            <div>
              <dt>Speed</dt>
              <dd>{Math.round(data.position.velocity).toLocaleString()} km/h</dd>
            </div>
          </dl>
        )}
        {next && (
          <p className="mono" style={{ marginTop: 8 }}>
            Next pass {next.formatted.time}: {next.formatted.riseDirection} to {next.formatted.setDirection}, max{" "}
            {next.formatted.maxAltitude}, {BRIGHTNESS[next.brightness]}, {Math.round(next.duration / 60)} min.
          </p>
        )}
        {data && !next && <p className="mono">No visible passes in the window.</p>}
        {data && data.passes.length > 1 && (
          <>
            <button type="button" className="mini-btn" aria-expanded={more} onClick={() => setMore(!more)}>
              {more ? "Fewer passes" : "More passes"}
            </button>
            {more && (
              <ul className="mini-list mono">
                {data.passes.slice(1).map((p) => (
                  <li key={p.risetime}>
                    <span>{p.formatted.time}</span>
                    <span>
                      {p.formatted.riseDirection} to {p.formatted.setDirection}, {p.formatted.maxAltitude}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {data && (
          <p className="mono faint" style={{ marginTop: 8 }}>
            Source: {data.source}
          </p>
        )}
      </div>
    </div>
  );
}

function AuroraStrip({ lat }: { lat: number }) {
  const [data, setData] = useState<AuroraData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/aurora?lat=${lat}`)
      .then((res) => {
        if (!res.ok) throw new Error("Aurora request failed");
        return res.json() as Promise<AuroraData>;
      })
      .then((d) => {
        if (!live) return;
        setData(d);
        setFailed(false);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [lat]);

  const kp = data ? Math.max(0, Math.min(9, Math.round(data.current.kp))) : 0;

  return (
    <div className="strip">
      <h3 className="strip-label">Aurora</h3>
      <div>
        {failed && !data && <p className="mono">Aurora forecast unavailable right now.</p>}
        {!data && !failed && <p className="mono">Reading the Kp index...</p>}
        {data && (
          <>
            <dl className="kv">
              <div>
                <dt>Kp index</dt>
                <dd>{data.current.kp.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Storm level</dt>
                <dd>{data.current.stormLevel}</dd>
              </div>
              <div>
                <dt>Visible here</dt>
                <dd>{data.visibility.probability}</dd>
              </div>
              <div>
                <dt>Needs latitude</dt>
                <dd>{data.visibility.minimumLatitude}° or higher</dd>
              </div>
            </dl>
            <div className="kp-bar" role="img" aria-label={`Kp ${data.current.kp.toFixed(1)} of 9`}>
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} className={i < kp ? "on" : ""} />
              ))}
            </div>
            <p className="mono">{data.visibility.message}</p>
            <p className="mono faint">Source: {data.source}</p>
          </>
        )}
      </div>
    </div>
  );
}

/** ISS and aurora as two ruled strips with real values. */
export default function Passes() {
  const target = useTarget();
  if (!target) {
    return (
      <div className="log-page">
        <p className="mono">Reading passes...</p>
      </div>
    );
  }
  return (
    <div className="log-page">
      {target.isDefault && <p className="mono faint">For Las Vegas, NV (default). Choose a place above to change it.</p>}
      <IssStrip lat={target.lat} lng={target.lng} />
      <AuroraStrip lat={target.lat} />
    </div>
  );
}
