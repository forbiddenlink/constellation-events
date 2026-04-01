/**
 * Satellite tracking module
 *
 * Provides satellite tracking functionality using satellite.js for
 * TLE-based orbit propagation and pass predictions.
 */

// Types
export type {
  SatellitePass,
  SatellitePosition,
  TLEData,
  SatelliteInfo,
  GroundTrackPoint,
  ObserverLocation,
  PassPredictionOptions,
  SatelliteCatalogEntry,
} from "./types";

export { POPULAR_SATELLITES } from "./types";

// TLE fetching
export {
  fetchTLE,
  fetchTLEGroup,
  getTLEAge,
  isTLEStale,
  clearTLECache,
  getCachedTLE,
  TLE_GROUPS,
} from "./tle";

export type { TLEGroup } from "./tle";

// Position propagation
export {
  propagatePosition,
  propagatePositionForObserver,
  generateGroundTrack,
  isSatelliteSunlit,
  getOrbitalPeriod,
  getTLEEpoch,
} from "./propagate";

// Pass predictions
export {
  calculatePasses,
  filterVisiblePasses,
  azimuthToCardinal,
  formatPass,
  getNextVisiblePass,
} from "./passes";

// ISS-specific
export {
  ISS_NORAD_ID,
  getISSTLE,
  getISSPosition,
  getISSGroundTrack,
  getISSPasses,
  getNextISSPass,
  getISSOrbitData,
  getISSCrew,
  formatISSPass,
  isISSVisible,
  ISS_STATS,
} from "./iss";

export type { ISSOrbitData, ISSCrewMember } from "./iss";
