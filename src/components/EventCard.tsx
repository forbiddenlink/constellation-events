import type { EventItem } from "@/lib/mock";

export default function EventCard({ event }: { event: EventItem }) {
  return (
    <div className="glass rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-comet">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-starlight/50">
        <span>{event.date}</span>
        <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] text-aurora/80">
          {event.visibility}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-starlight">{event.title}</h3>
      <p className="mt-2 text-sm text-starlight/70">{event.summary}</p>
      <div className="mt-4 text-xs text-starlight/50">Best window: {event.window}</div>
    </div>
  );
}
