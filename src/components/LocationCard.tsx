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
  const score = location.darkSkyScore;

  return (
    <article className="field-row field-row-loc">
      <div className="field-row-date">
        <span className="field-row-score">{score}</span>
        <span className="field-row-unit">/100</span>
      </div>
      <div className="field-row-body">
        <h3 className="field-row-title">{location.name}</h3>
        <p className="field-row-meta">
          <span>{distance} away</span>
          <span aria-hidden="true"> · </span>
          Best viewing: {location.bestWindow}
        </p>
        <p className="field-row-note">{description}</p>
      </div>
    </article>
  );
}
