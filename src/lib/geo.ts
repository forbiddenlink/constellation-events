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
