export type TonightObject = {
  id: string;
  name: string;
  type: string;
  bestTime: string;
  magnitude: string;
  highlight: string;
  metricLabel?: string;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  window: string;
  visibility: string;
  summary: string;
};

export type LocationItem = {
  id: string;
  name: string;
  distance: string;
  darkSkyScore: number;
  bestWindow: string;
  note: string;
};

export type ListingItem = {
  id: string;
  title: string;
  price: string;
  condition: string;
  tag: string;
};

export const tonightHighlights: TonightObject[] = [
  {
    id: "moon-1",
    name: "Crescent Moon",
    type: "Moon Phase",
    bestTime: "8:12 PM – 10:30 PM",
    magnitude: "-10.7",
    highlight: "Low glare tonight, ideal for deep sky.",
    metricLabel: "Mag"
  },
  {
    id: "jupiter",
    name: "Jupiter + Galilean Moons",
    type: "Planet",
    bestTime: "9:20 PM – 1:40 AM",
    magnitude: "-2.3",
    highlight: "Great seeing forecast; capture Io transit.",
    metricLabel: "Mag"
  },
  {
    id: "orion",
    name: "Orion Nebula (M42)",
    type: "Nebula",
    bestTime: "10:15 PM – 2:00 AM",
    magnitude: "4.0",
    highlight: "Peak clarity window after 11 PM.",
    metricLabel: "Mag"
  }
];

export const upcomingEvents: EventItem[] = [
  {
    id: "event-1",
    title: "Quadrantids Afterglow",
    date: "Feb 7",
    window: "10:00 PM – 2:30 AM",
    visibility: "High",
    summary: "Radiant remains strong with dark skies nearby."
  },
  {
    id: "event-2",
    title: "Venus at Greatest Elongation",
    date: "Feb 9",
    window: "Sunset – 9:15 PM",
    visibility: "Excellent",
    summary: "Longest evening visibility this cycle."
  },
  {
    id: "event-3",
    title: "Lunar X Feature",
    date: "Feb 12",
    window: "7:45 PM – 8:10 PM",
    visibility: "Brief",
    summary: "Short window; set reminder to catch it."
  }
];

export const nearbyLocations: LocationItem[] = [
  {
    id: "loc-1",
    name: "Sierra Vista Overlook",
    distance: "42 mi",
    darkSkyScore: 92,
    bestWindow: "9:00 PM – 2:00 AM",
    note: "Clear horizon; low humidity."
  },
  {
    id: "loc-2",
    name: "Lake Serene Causeway",
    distance: "58 mi",
    darkSkyScore: 88,
    bestWindow: "8:40 PM – 1:30 AM",
    note: "Mirror reflections for astrophotography."
  },
  {
    id: "loc-3",
    name: "Highlands Research Field",
    distance: "67 mi",
    darkSkyScore: 85,
    bestWindow: "10:00 PM – 3:00 AM",
    note: "Open access after dusk."
  }
];

export const featuredListings: ListingItem[] = [
  {
    id: "list-1",
    title: "Celestron NexStar 6SE",
    price: "$680",
    condition: "Excellent",
    tag: "Motorized"
  },
  {
    id: "list-2",
    title: "Sky-Watcher Dobsonian 8",
    price: "$420",
    condition: "Very good",
    tag: "Beginner friendly"
  },
  {
    id: "list-3",
    title: "ZWO ASI224MC Camera",
    price: "$210",
    condition: "Like new",
    tag: "Astrophotography"
  }
];
