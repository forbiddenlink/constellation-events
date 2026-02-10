export type Coordinates = {
  lat: number;
  lng: number;
};

export function parseCoordinates(lat?: string | null, lng?: string | null): Coordinates | null {
  if (!lat || !lng) return null;
  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);
  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) return null;
  if (parsedLat < -90 || parsedLat > 90) return null;
  if (parsedLng < -180 || parsedLng > 180) return null;
  return { lat: parsedLat, lng: parsedLng };
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function darkSkyScore(coords: Coordinates) {
  const latFactor = 1 - Math.abs(coords.lat) / 90;
  const lngFactor = 1 - Math.abs(coords.lng) / 180;
  const base = 70 + latFactor * 18 + lngFactor * 8;
  return Math.round(clamp(base, 48, 96));
}

export function visibilityScore(coords: Coordinates, baseScore: number) {
  const latFactor = 1 - Math.abs(coords.lat) / 90;
  const lngFactor = 1 - Math.abs(coords.lng) / 180;
  const score = baseScore + latFactor * 12 + lngFactor * 6;
  return Math.round(clamp(score, 35, 98));
}
