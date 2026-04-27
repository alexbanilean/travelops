/**
 * Metadata so users know how much to trust prices and where live data would plug in.
 * Demo catalog ≠ bookable NDC/GDS offers.
 */

export const DATA_PROVENANCE_SYNTHETIC_DEMO = "synthetic_catalog_demo" as const;

/** Hours until synthetic “offer” is considered stale for UX messaging. */
export const DEMO_OFFER_VALIDITY_HOURS = 24;

export function computeOfferExpiresAtIso(quotedAt: Date): string {
  return new Date(
    quotedAt.getTime() + DEMO_OFFER_VALIDITY_HOURS * 3_600_000
  ).toISOString();
}

export const DEMO_PRICING_DISCLAIMER =
  "This itinerary uses TravelOps' demo price catalog (not live airline/hotel APIs). Amounts were valid-style estimates at the quote time shown — always re-check availability, taxes, and fare rules before purchase. For production trust: integrate NDC/GDS (e.g. Duffel, Amadeus), hotel CRS, or direct supplier APIs.";
