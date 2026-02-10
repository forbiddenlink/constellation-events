import type { LocationItem } from "@/lib/mock";
import type { DarkSkyLocation } from "@/lib/locations";

type LocationCardProps = {
  location: LocationItem | DarkSkyLocation;
};

function isDarkSkyLocation(location: LocationItem | DarkSkyLocation): location is DarkSkyLocation {
  return "distanceDisplay" in location;
}

export default function LocationCard({ location }: LocationCardProps) {
  const distance = isDarkSkyLocation(location) ? location.distanceDisplay : location.distance;
  const description = isDarkSkyLocation(location) ? location.description : location.note;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-starlight">{location.name}</h3>
          <p className="text-xs text-starlight/50">{distance} away</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-aurora">{location.darkSkyScore}</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-starlight/50">Score</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-starlight/70">{description}</p>
      <div className="mt-4 text-xs text-starlight/50">Best viewing: {location.bestWindow}</div>
    </div>
  );
}
