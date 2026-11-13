import Link from "next/link";
import type { AstronomyEvent } from "@/lib/events";

const MAX_ROWS = 9;
const W = 560;
const H = 400;
const PAD_L = 40;
const PAD_R = 24;
const PAD_T = 24;
const PAD_B = 44;

/** Dot radius from the brief: 3 + score/100 * 5. */
export function dotRadius(score: number): number {
  const s = Math.max(0, Math.min(100, score));
  return 3 + (s / 100) * 5;
}

/**
 * Coming weeks: an ephemeris table with dotted leaders plus a pencil-dot plot
 * (x date, y visibility score). Server-rendered from the same generator the
 * events page uses, so it is complete with JavaScript off.
 */
export default function Ephemeris({ events }: { events: AstronomyEvent[] }) {
  const rows = events.slice(0, MAX_ROWS);

  if (rows.length === 0) {
    return (
      <p className="mono">No upcoming events in the next 60 nights.</p>
    );
  }

  const times = rows.map((e) => new Date(e.date).getTime());
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const span = Math.max(1, t1 - t0);
  const pts = rows.map((e, i) => {
    const x = rows.length === 1 ? W / 2 : PAD_L + ((times[i] - t0) / span) * (W - PAD_L - PAD_R);
    const y = H - PAD_B - (Math.max(0, Math.min(100, e.visibilityScore)) / 100) * (H - PAD_T - PAD_B);
    return { e, x, y, r: dotRadius(e.visibilityScore) };
  });

  const summary = `Plot of ${rows.length} upcoming events by date, left to right, and visibility score, bottom to top.`;

  return (
    <div className="two-col">
      <div className="log-page">
        <ol className="ephem" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {rows.map((e, i) => (
            <li key={e.id} className="eph-row mono">
              <span className="eph-n">{i + 1}</span>
              <span className="eph-date">{e.dateDisplay}</span>
              <span className="eph-title">{e.title}</span>
              <span className="eph-leader" aria-hidden="true" />
              <span className="eph-vis">{e.visibility}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="plot-col">
      <figure className="plot" style={{ margin: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
          <title>{summary}</title>
          {[0, 50, 100].map((v) => {
            const y = H - PAD_B - (v / 100) * (H - PAD_T - PAD_B);
            return (
              <g key={v}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 5" />
                <text x={PAD_L - 8} y={y + 4} textAnchor="end" fill="currentColor" fontSize="12" fontFamily="var(--font-mono), monospace">
                  {v}
                </text>
              </g>
            );
          })}
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.5"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pts.map((p, i) => (
            <circle
              key={p.e.id}
              className="plot-dot"
              style={{ ["--i" as string]: Math.min(i, 11) }}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="currentColor"
            >
              <title>{`${p.e.title}, ${p.e.dateDisplay}, visibility ${p.e.visibilityScore}`}</title>
            </circle>
          ))}
          <text x={PAD_L} y={H - 14} fill="currentColor" fontSize="12" fontFamily="var(--font-mono), monospace">
            {rows[0].dateDisplay}
          </text>
          <text x={W - PAD_R} y={H - 14} textAnchor="end" fill="currentColor" fontSize="12" fontFamily="var(--font-mono), monospace">
            {rows[rows.length - 1].dateDisplay}
          </text>
        </svg>
        <figcaption className="plot-caption mono">
          <span>x: date</span>
          <span>y: visibility score, 0 to 100</span>
        </figcaption>
      </figure>
        <p className="hand plot-note">dates are for your sky</p>
        <p style={{ margin: 0 }}>
          <Link href="/events" className="btn-line">
            All events
          </Link>
        </p>
      </div>
    </div>
  );
}
