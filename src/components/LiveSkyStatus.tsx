"use client";

import { useEffect, useState } from "react";

export default function LiveSkyStatus() {
  const [status, setStatus] = useState("Checking sky quality...");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStatus("Live sky quality: 83% clear");
    }, 600);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-starlight/70">
      <span className="h-2 w-2 animate-pulse rounded-full bg-aurora shadow-glow" />
      {status}
    </div>
  );
}
