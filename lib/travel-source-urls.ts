/**
 * Build stable, user-openable discovery URLs for demo / TravelOps mock search.
 * (Production would use airline GDS, hotel CRS, or Maps Place IDs from APIs.)
 */

export function googleFlightsSearchUrl(
  origin: string,
  destination: string,
  dateIso: string
): string {
  const q = `Flights from ${origin} to ${destination} on ${dateIso}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}

export function googleMapsPlaceSearchUrl(place: string, near: string): string {
  const q = `${place}, ${near}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function googleTravelHotelsSearchUrl(hotelName: string, near: string): string {
  const q = `${hotelName} ${near}`;
  return `https://www.google.com/travel/hotels?q=${encodeURIComponent(q)}`;
}

export function googleWebSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * FlightRadar24 historical / schedule data page for a flight number (e.g. OK710).
 * Not a booking link; useful for tracking and schedule context.
 */
export function flightRadar24DataFlightUrl(flightNumber: string): string {
  const slug = flightNumber.replace(/\s+/g, "").toUpperCase();
  return `https://www.flightradar24.com/data/flights/${encodeURIComponent(slug)}`;
}
