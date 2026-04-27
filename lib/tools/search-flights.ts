import {
  DATA_PROVENANCE_SYNTHETIC_DEMO,
  computeOfferExpiresAtIso,
  DEMO_OFFER_VALIDITY_HOURS,
} from "@/lib/travel-data-provenance";
import { flightRadar24DataFlightUrl, googleFlightsSearchUrl } from "@/lib/travel-source-urls";

export interface FlightOption {
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  duration: string;
  pricePerPerson: number;
  totalPrice: number;
  class: string;
  /** User-facing discovery link (same route/date search for all options in this result set). */
  sourceUrl: string;
  sourceLabel: string;
  /** ISO-8601 when this row was priced (server clock). */
  priceQuotedAt: string;
  /** ISO-8601 suggested “stale after” for demo data (not airline fare expiry). */
  offerExpiresAt: string;
  dataProvenance: typeof DATA_PROVENANCE_SYNTHETIC_DEMO;
  pricingContextNote: string;
  /** FlightRadar24 flight history / schedule hub (not official ops data). */
  trackingUrl: string;
}

type FlightSeed = Omit<
  FlightOption,
  | "sourceUrl"
  | "sourceLabel"
  | "priceQuotedAt"
  | "offerExpiresAt"
  | "dataProvenance"
  | "pricingContextNote"
  | "trackingUrl"
>;

const FLIGHT_DATA: Record<string, FlightSeed[]> = {
  default: [
    {
      airline: "Lufthansa",
      flightNumber: "LH 1234",
      departure: "08:30",
      arrival: "11:45",
      duration: "3h 15m",
      pricePerPerson: 185,
      totalPrice: 0,
      class: "Economy",
    },
    {
      airline: "Austrian Airlines",
      flightNumber: "OS 567",
      departure: "13:10",
      arrival: "16:40",
      duration: "3h 30m",
      pricePerPerson: 155,
      totalPrice: 0,
      class: "Economy",
    },
    {
      airline: "Ryanair",
      flightNumber: "FR 8901",
      departure: "06:00",
      arrival: "09:05",
      duration: "3h 05m",
      pricePerPerson: 89,
      totalPrice: 0,
      class: "Economy",
    },
  ],
  barcelona: [
    {
      airline: "Vueling",
      flightNumber: "VY 1882",
      departure: "07:15",
      arrival: "09:50",
      duration: "2h 35m",
      pricePerPerson: 148,
      totalPrice: 0,
      class: "Economy",
    },
    {
      airline: "Iberia",
      flightNumber: "IB 3401",
      departure: "11:40",
      arrival: "14:20",
      duration: "2h 40m",
      pricePerPerson: 172,
      totalPrice: 0,
      class: "Economy",
    },
    {
      airline: "Wizz Air",
      flightNumber: "W6 2234",
      departure: "06:30",
      arrival: "09:00",
      duration: "2h 30m",
      pricePerPerson: 79,
      totalPrice: 0,
      class: "Economy",
    },
  ],
  prague: [
    {
      airline: "Czech Airlines",
      flightNumber: "OK 710",
      departure: "09:20",
      arrival: "11:35",
      duration: "2h 15m",
      pricePerPerson: 135,
      totalPrice: 0,
      class: "Economy",
    },
    {
      airline: "Eurowings",
      flightNumber: "EW 401",
      departure: "14:55",
      arrival: "17:10",
      duration: "2h 15m",
      pricePerPerson: 112,
      totalPrice: 0,
      class: "Economy",
    },
    {
      airline: "Ryanair",
      flightNumber: "FR 4423",
      departure: "06:45",
      arrival: "08:55",
      duration: "2h 10m",
      pricePerPerson: 65,
      totalPrice: 0,
      class: "Economy",
    },
  ],
};

export function searchFlights(params: {
  origin: string;
  destination: string;
  date: string;
  participants: number;
}): FlightOption[] {
  const key = params.destination.toLowerCase().split(",")[0].trim();
  const baseData = FLIGHT_DATA[key] || FLIGHT_DATA.default;

  const sourceUrl = googleFlightsSearchUrl(
    params.origin,
    params.destination,
    params.date
  );
  const sourceLabel = "Google Flights";
  const quoted = new Date();
  const priceQuotedAt = quoted.toISOString();
  const offerExpiresAt = computeOfferExpiresAtIso(quoted);
  const pricingContextNote = `Demo catalog total for ${params.participants} pax; indicative only. Stale after ~${DEMO_OFFER_VALIDITY_HOURS}h unless refreshed. Not an airline offer.`;

  return baseData.map((f) => ({
    ...f,
    totalPrice: Math.round(f.pricePerPerson * params.participants),
    sourceUrl,
    sourceLabel,
    priceQuotedAt,
    offerExpiresAt,
    dataProvenance: DATA_PROVENANCE_SYNTHETIC_DEMO,
    pricingContextNote,
    trackingUrl: flightRadar24DataFlightUrl(f.flightNumber),
  }));
}
