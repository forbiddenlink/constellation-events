# Constellation Events API Documentation

Complete API reference for the Constellation astronomy event tracker.

## Base URL

```
Development: http://localhost:3000/api
Production: https://constellation.app/api
```

## Authentication

Currently, all endpoints are publicly accessible. Authentication will be added in a future version for personalized features.

---

## Endpoints

### 1. Tonight's Sky Data

**GET** `/api/sky/tonight`

Returns current night sky highlights with celestial object positions from JPL Horizons.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | No | Latitude (-90 to 90) |
| `lng` | number | No | Longitude (-180 to 180) |

#### Response

```json
{
  "highlights": [
    {
      "id": "moon",
      "name": "Crescent Moon",
      "type": "Moon Phase",
      "bestTime": "20:12 UT",
      "magnitude": "75°",
      "metricLabel": "Alt",
      "highlight": "Peak elevation 75°"
    }
  ],
  "source": "JPL Horizons",
  "generatedAt": "2026-02-07T20:00:00.000Z"
}
```

#### Example

```bash
curl "http://localhost:3000/api/sky/tonight?lat=36.1147&lng=-115.1728"
```

---

### 2. Astronomy Events

**GET** `/api/events`

Returns upcoming celestial events including meteor showers, moon phases, and planetary events.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lat` | number | No | - | Latitude for visibility calculations |
| `lng` | number | No | - | Longitude for visibility calculations |
| `from` | string | No | now | Start date (ISO 8601 format) |
| `days` | number | No | 60 | Number of days ahead to fetch |

#### Response

```json
{
  "location": {
    "lat": 36.1147,
    "lng": -115.1728
  },
  "events": [
    {
      "id": "meteor-perseids-2026",
      "title": "Perseids Meteor Shower",
      "date": "2026-08-12T00:00:00.000Z",
      "dateDisplay": "Aug 12",
      "window": "10:00 PM – 4:00 AM",
      "peak": "Around 2:00 AM local time",
      "visibility": "excellent",
      "visibilityScore": 95,
      "summary": "Peak rate: 100 meteors/hour. Dark skies - excellent conditions!",
      "type": "meteor"
    }
  ],
  "generatedAt": "2026-02-07T20:00:00.000Z",
  "dateRange": {
    "from": "2026-02-07T00:00:00.000Z",
    "to": "2026-04-08T00:00:00.000Z"
  }
}
```

#### Event Types

- `moon` - Moon phase events (New, Full, Quarters)
- `meteor` - Meteor shower peaks
- `planet` - Planetary events (conjunctions, oppositions, elongations)
- `eclipse` - Solar and lunar eclipses
- `conjunction` - Close planetary alignments
- `other` - Other special events

#### Example

```bash
curl "http://localhost:3000/api/events?lat=36.1147&lng=-115.1728&days=30"
```

---

### 3. Dark-Sky Locations

**GET** `/api/locations`

Find dark-sky observation locations near the user with quality scores and amenities.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lat` | number | No | 36.1147 | User latitude |
| `lng` | number | No | -115.1728 | User longitude |
| `maxDistance` | number | No | 200 | Max distance in kilometers |
| `limit` | number | No | 10 | Maximum results to return |

#### Response

```json
{
  "location": {
    "lat": 36.1147,
    "lng": -115.1728
  },
  "userDarkSkyScore": 72,
  "locations": [
    {
      "id": "great-basin-nv",
      "name": "Great Basin National Park",
      "coordinates": {
        "lat": 38.98,
        "lng": -114.22
      },
      "distance": 342.5,
      "distanceDisplay": "213 mi",
      "darkSkyScore": 95,
      "bortleClass": 2,
      "elevation": 2000,
      "description": "IDA certified International Dark Sky Park",
      "amenities": ["Parking", "Restrooms", "Camping", "Visitor Center"],
      "bestWindow": "7:30 PM - 5:45 AM",
      "accessibility": "easy",
      "type": "park"
    }
  ],
  "count": 5,
  "generatedAt": "2026-02-07T20:00:00.000Z"
}
```

#### Bortle Scale Reference

| Class | Description | Limiting Magnitude | Typical Location |
|-------|-------------|-------------------|------------------|
| 1 | Excellent dark sky | 7.6-8.0 | Remote wilderness |
| 2 | Typical dark sky | 7.1-7.5 | Dark site parks |
| 3 | Rural sky | 6.6-7.0 | Rural areas |
| 4-5 | Rural/suburban | 6.0-6.5 | Small towns |
| 6-7 | Suburban/urban | 5.0-5.9 | Suburbs |
| 8-9 | City/inner city | 4.0-4.9 | Urban centers |

#### Example

```bash
curl "http://localhost:3000/api/locations?lat=36.1147&lng=-115.1728&maxDistance=150&limit=5"
```

---

### 4. Tonight's Observation Plan

**GET** `/api/planner/tonight`

Generate a comprehensive observation plan for tonight including optimal window, moon conditions, visible planets, and recommendations.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | No | Latitude for calculations |
| `lng` | number | No | Longitude for calculations |

#### Response

```json
{
  "location": {
    "lat": 36.1147,
    "lng": -115.1728
  },
  "date": "2026-02-07T20:00:00.000Z",
  "moon": {
    "phase": "Waxing Crescent",
    "illumination": 23.4,
    "age": 3.2,
    "rise": "2026-02-07T19:00:00.000Z",
    "set": "2026-02-08T07:00:00.000Z"
  },
  "sun": {
    "sunset": "2026-02-07T18:00:00.000Z",
    "sunrise": "2026-02-08T06:30:00.000Z",
    "astronomicalDusk": "2026-02-07T19:30:00.000Z",
    "astronomicalDawn": "2026-02-08T05:00:00.000Z"
  },
  "optimalWindow": {
    "start": "2026-02-07T19:30:00.000Z",
    "end": "2026-02-08T05:00:00.000Z",
    "quality": 85,
    "duration": 9.5
  },
  "visiblePlanets": [
    {
      "name": "Jupiter",
      "type": "Planet",
      "bestAltitude": 67,
      "bestTime": "21:20 UT",
      "visible": true
    }
  ],
  "tonightEvents": [],
  "activeShowers": [
    {
      "name": "Quadrantids",
      "zhr": 120,
      "peak": "2026-01-03T00:00:00.000Z"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "title": "Dark sky advantage",
      "description": "Low moonlight - perfect for deep-sky objects",
      "timing": "All night"
    }
  ],
  "overallQuality": {
    "score": 85,
    "rating": "Excellent",
    "description": "Great conditions for most celestial objects"
  }
}
```

#### Example

```bash
curl "http://localhost:3000/api/planner/tonight?lat=36.1147&lng=-115.1728"
```

---

### 5. Weather & Sky Quality

**GET** `/api/weather/sky-quality`

Returns current atmospheric conditions and sky quality for astronomy.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | No | Latitude |
| `lng` | number | No | Longitude |

#### Response

```json
{
  "cloudCover": 15,
  "seeing": "good",
  "transparency": 85,
  "humidity": 45,
  "temperature": 12.5,
  "windSpeed": 8.2,
  "moonPhase": 0.23,
  "quality": 82,
  "location": {
    "lat": 36.1147,
    "lng": -115.1728
  },
  "timestamp": "2026-02-07T20:00:00.000Z"
}
```

#### Seeing Conditions

- **excellent**: Steady air, minimal turbulence, wind < 10 km/h
- **good**: Slight turbulence, wind < 20 km/h
- **fair**: Moderate turbulence, wind < 30 km/h
- **poor**: Heavy turbulence, wind > 30 km/h

#### Example

```bash
curl "http://localhost:3000/api/weather/sky-quality?lat=36.1147&lng=-115.1728"
```

---

### 6. Marketplace

**GET** `/api/marketplace`

Returns curated astronomy gear and equipment listings.

#### Response

```json
{
  "listings": [
    {
      "id": "listing-1",
      "title": "Celestron NexStar 8SE",
      "price": "$1,399",
      "condition": "New",
      "tag": "Best-seller"
    }
  ]
}
```

---

## Rate Limiting

Currently no rate limiting is enforced. In production:
- Free tier: 1000 requests/day
- Authenticated: 10,000 requests/day

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description",
  "location": { "lat": 36.1147, "lng": -115.1728 },
  "timestamp": "2026-02-07T20:00:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (external API failure)

---

## Data Sources

- **JPL Horizons**: Planetary positions, moon data
- **NASA VIIRS**: Light pollution data
- **OpenWeather**: Atmospheric conditions (optional)
- **Internal Database**: Meteor showers, dark-sky locations

---

## Best Practices

1. **Cache responses** - Most data updates hourly at most
2. **Include coordinates** - Provides more accurate calculations
3. **Handle fallbacks** - APIs gracefully degrade when external services are unavailable
4. **Respect privacy** - Location data is never stored

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function getTonightPlan(lat: number, lng: number) {
  const response = await fetch(
    `${BASE_URL}/planner/tonight?lat=${lat}&lng=${lng}`
  );
  return response.json();
}

async function getUpcomingEvents(lat: number, lng: number, days = 30) {
  const response = await fetch(
    `${BASE_URL}/events?lat=${lat}&lng=${lng}&days=${days}`
  );
  return response.json();
}
```

### Python

```python
import requests

BASE_URL = "http://localhost:3000/api"

def get_tonight_plan(lat, lng):
    response = requests.get(
        f"{BASE_URL}/planner/tonight",
        params={"lat": lat, "lng": lng}
    )
    return response.json()

def get_dark_sky_locations(lat, lng, max_distance=200):
    response = requests.get(
        f"{BASE_URL}/locations",
        params={"lat": lat, "lng": lng, "maxDistance": max_distance}
    )
    return response.json()
```

---

## Changelog

### v0.2.0 (February 2026)
- Added `/api/planner/tonight` endpoint
- Enhanced `/api/events` with real astronomy calculations
- Enhanced `/api/locations` with distance and quality scoring
- Added `/api/weather/sky-quality` endpoint

### v0.1.0 (February 2026)
- Initial API release
- Basic endpoints for events, locations, sky data

---

## Support

For API questions or issues:
- GitHub Issues: [github.com/forbiddenlink/constellation-events/issues](https://github.com/forbiddenlink/constellation-events/issues)
- Email: support@constellation.app (Coming soon)

---

Built with ❤️ for the astronomy community
