import type { EventItem } from "@/lib/mock";
import type { AstronomyEvent } from "@/lib/events";

type EventCardProps = {
  event: EventItem | AstronomyEvent;
};

// Type guard to check if it's an AstronomyEvent
function isAstronomyEvent(event: EventItem | AstronomyEvent): event is AstronomyEvent {
  return 'dateDisplay' in event;
}

export default function EventCard({ event }: EventCardProps) {
  const displayDate = isAstronomyEvent(event) ? event.dateDisplay : event.date;
  const visibilityBadge = event.visibility;
  
  // Get badge color based on visibility
  const getBadgeColor = (vis: string) => {
    switch(vis.toLowerCase()) {
      case 'excellent': return 'text-aurora border-aurora/30';
      case 'good': return 'text-starlight border-starlight/30';
      case 'fair': return 'text-yellow-400 border-yellow-400/30';
      case 'poor': return 'text-ember border-ember/30';
      default: return 'text-starlight/80 border-white/20';
    }
  };
  
  return (
    <div className="glass rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-comet">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-starlight/50">
        <span>{displayDate}</span>
        <span className={`rounded-full border px-3 py-1 text-[10px] ${getBadgeColor(visibilityBadge)}`}>
          {visibilityBadge}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-starlight">{event.title}</h3>
      <p className="mt-2 text-sm text-starlight/70">{event.summary}</p>
      <div className="mt-4 text-xs text-starlight/50">
        Best window: {event.window}
        {isAstronomyEvent(event) && event.peak && (
          <span className="block mt-1">Peak: {event.peak}</span>
        )}
      </div>
    </div>
  );
}
