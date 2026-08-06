"use client";

import { useState } from "react";
import type { AstronomyEvent } from "@/lib/events";

type ConstellationVizProps = {
  /** Upcoming celestial events, already sorted by date. */
  events?: AstronomyEvent[];
  /** Max nodes to plot (keeps the constellation legible). */
  limit?: number;
};

// Node color per event type — mapped to the theme's aurora/comet/ember palette.
const TYPE_COLORS: Record<AstronomyEvent["type"], string> = {
  moon: "#F1F5F9", // starlight
  meteor: "#38BDF8", // aurora
  planet: "#818CF8", // comet
  eclipse: "#F472B6", // ember
  conjunction: "#34D399", // success
  other: "#FBBF24", // caution
};

const VIEW_W = 600;
const VIEW_H = 300;
const PAD_X = 44;
const PAD_TOP = 56;
const PAD_BOTTOM = 250;

type PlottedStar = {
  event: AstronomyEvent;
  x: number;
  y: number;
  r: number;
  color: string;
};

function plotStars(events: AstronomyEvent[]): PlottedStar[] {
  const n = events.length;
  return events.map((event, i) => {
    // x = chronological position across the timeline
    const x = n <= 1 ? VIEW_W / 2 : PAD_X + (i / (n - 1)) * (VIEW_W - PAD_X * 2);
    // y = higher visibility sits higher in the sky
    const score = Math.max(0, Math.min(100, event.visibilityScore));
    const y = PAD_BOTTOM - (score / 100) * (PAD_BOTTOM - PAD_TOP);
    // radius + glow scale with visibility
    const r = 3 + (score / 100) * 5;
    return { event, x, y, r, color: TYPE_COLORS[event.type] ?? TYPE_COLORS.other };
  });
}

export default function ConstellationViz({ events = [], limit = 9 }: ConstellationVizProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const stars = plotStars(events.slice(0, limit));
  const linePoints = stars.map((s) => `${s.x},${s.y}`).join(" ");

  const ariaLabel =
    stars.length > 0
      ? `Star map of ${stars.length} upcoming celestial events, plotted left to right by date and vertically by visibility.`
      : "Star map awaiting upcoming celestial events.";

  return (
    <div className="glass relative h-72 overflow-hidden rounded-3xl p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_80%_60%,rgba(129,140,248,0.18),transparent_50%)]" />

      <div className="relative flex items-center justify-between text-xs uppercase tracking-[0.3em] text-starlight/50">
        <span>Sky timeline</span>
        <span className="text-starlight/30">next {events.length ? "60 nights" : "—"}</span>
      </div>

      <svg
        className="relative mt-1 h-[calc(100%-3.5rem)] w-full"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        fill="none"
        role="img"
        aria-label={ariaLabel}
      >
        <title>{ariaLabel}</title>

        {/* Timeline path connecting the events in date order */}
        {stars.length > 1 && (
          <polyline
            points={linePoints}
            stroke="rgba(232,241,255,0.35)"
            strokeWidth={1.25}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {stars.map((star, i) => {
          const isActive = hovered === i;
          return (
            <g
              key={star.event.id}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              {/* Soft twinkling halo — glow scales with visibility */}
              <circle
                cx={star.x}
                cy={star.y}
                r={star.r * (isActive ? 3 : 2.4)}
                fill={star.color}
                opacity={0.14}
                className="animate-pulseSoft motion-reduce:animate-none"
                style={{ animationDelay: `${(i % 5) * 0.6}s` }}
              />
              {/* Core star */}
              <circle cx={star.x} cy={star.y} r={star.r} fill={star.color}>
                <title>
                  {star.event.title} — {star.event.dateDisplay} (visibility {Math.round(star.event.visibilityScore)})
                </title>
              </circle>
              {isActive && (
                <text
                  x={star.x}
                  y={star.y - star.r - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#F1F5F9"
                  className="pointer-events-none"
                >
                  {star.event.title}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="relative mt-1 flex items-center justify-between text-[10px] text-starlight/40">
        <span>
          {stars.length > 0
            ? `${stars.length} events · brighter = better visibility`
            : "No upcoming events plotted"}
        </span>
        {hovered !== null && stars[hovered] && (
          <span className="text-aurora">{stars[hovered].event.dateDisplay}</span>
        )}
      </div>
    </div>
  );
}
