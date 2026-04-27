import {
  DATA_PROVENANCE_SYNTHETIC_DEMO,
  computeOfferExpiresAtIso,
  DEMO_OFFER_VALIDITY_HOURS,
} from "@/lib/travel-data-provenance";
import { googleMapsPlaceSearchUrl } from "@/lib/travel-source-urls";

export interface RestaurantOption {
  name: string;
  cuisine: string;
  pricePerPerson: number;
  totalPrice: number;
  capacity: number;
  rating: number;
  location: string;
  description: string;
  privateRoom: boolean;
  sourceUrl: string;
  sourceLabel: string;
  priceQuotedAt: string;
  offerExpiresAt: string;
  dataProvenance: typeof DATA_PROVENANCE_SYNTHETIC_DEMO;
  pricingContextNote: string;
}

type RestaurantSeed = Omit<
  RestaurantOption,
  | "sourceUrl"
  | "sourceLabel"
  | "priceQuotedAt"
  | "offerExpiresAt"
  | "dataProvenance"
  | "pricingContextNote"
>;

const RESTAURANT_DATA: Record<string, RestaurantSeed[]> = {
  default: [
    {
      name: "The Grand Brasserie",
      cuisine: "European",
      pricePerPerson: 65,
      totalPrice: 0,
      capacity: 80,
      rating: 4.7,
      location: "City Centre",
      description: "Elegant brasserie with private dining rooms for groups.",
      privateRoom: true,
    },
    {
      name: "Bistro Moderne",
      cuisine: "Contemporary",
      pricePerPerson: 45,
      totalPrice: 0,
      capacity: 50,
      rating: 4.5,
      location: "Old Town",
      description: "Modern European cuisine in a relaxed setting.",
      privateRoom: false,
    },
    {
      name: "Panorama Rooftop Restaurant",
      cuisine: "International",
      pricePerPerson: 80,
      totalPrice: 0,
      capacity: 60,
      rating: 4.8,
      location: "Business District",
      description: "Stunning city views with an international menu.",
      privateRoom: true,
    },
  ],
  barcelona: [
    {
      name: "Tickets (El Barri)",
      cuisine: "Tapas / Avant-garde",
      pricePerPerson: 95,
      totalPrice: 0,
      capacity: 60,
      rating: 4.9,
      location: "Poble Sec",
      description:
        "Iconic tapas bar by the Adrià brothers with creative Catalan cuisine.",
      privateRoom: true,
    },
    {
      name: "La Mar Salada",
      cuisine: "Seafood",
      pricePerPerson: 70,
      totalPrice: 0,
      capacity: 80,
      rating: 4.7,
      location: "Barceloneta",
      description: "Fresh Mediterranean seafood with a view of the beach.",
      privateRoom: false,
    },
    {
      name: "Bodega 1900",
      cuisine: "Traditional Catalan",
      pricePerPerson: 60,
      totalPrice: 0,
      capacity: 50,
      rating: 4.8,
      location: "Eixample",
      description: "Rustic vermouth bar and Catalan comfort food classics.",
      privateRoom: false,
    },
  ],
  prague: [
    {
      name: "La Degustation Bohême Bourgeoise",
      cuisine: "Czech Fine Dining",
      pricePerPerson: 110,
      totalPrice: 0,
      capacity: 30,
      rating: 4.9,
      location: "Old Town",
      description: "Michelin-starred Czech cuisine with a modern touch.",
      privateRoom: true,
    },
    {
      name: "Lokál Dlouhááá",
      cuisine: "Czech Traditional",
      pricePerPerson: 45,
      totalPrice: 0,
      capacity: 100,
      rating: 4.6,
      location: "Old Town",
      description:
        "Classic Czech pub with tank-fresh Pilsner Urquell and hearty dishes.",
      privateRoom: true,
    },
    {
      name: "Sansho",
      cuisine: "Asian Fusion",
      pricePerPerson: 60,
      totalPrice: 0,
      capacity: 40,
      rating: 4.7,
      location: "Anděl",
      description: "Prague's celebrated farm-to-table Asian fusion restaurant.",
      privateRoom: false,
    },
  ],
  amsterdam: [
    {
      name: "Rijks Restaurant",
      cuisine: "Dutch Contemporary",
      pricePerPerson: 90,
      totalPrice: 0,
      capacity: 60,
      rating: 4.8,
      location: "Museum Quarter",
      description:
        "Michelin-starred restaurant inside the Rijksmuseum with Dutch classics.",
      privateRoom: true,
    },
    {
      name: "Brouwerij 't IJ",
      cuisine: "Dutch / Pub",
      pricePerPerson: 40,
      totalPrice: 0,
      capacity: 80,
      rating: 4.6,
      location: "Waterlooplein",
      description:
        "Craft brewery inside a windmill with hearty Dutch bar food.",
      privateRoom: false,
    },
    {
      name: "De Kas",
      cuisine: "Farm-to-table",
      pricePerPerson: 75,
      totalPrice: 0,
      capacity: 50,
      rating: 4.9,
      location: "Frankendael Park",
      description:
        "Restaurant inside a greenhouse serving seasonal Dutch produce.",
      privateRoom: true,
    },
  ],
};

export function searchRestaurants(params: {
  location: string;
  cuisine?: string;
  participants: number;
}): RestaurantOption[] {
  const key = params.location.toLowerCase().split(",")[0].trim();
  const baseData = RESTAURANT_DATA[key] || RESTAURANT_DATA.default;
  const quoted = new Date();
  const priceQuotedAt = quoted.toISOString();
  const offerExpiresAt = computeOfferExpiresAtIso(quoted);
  const pricingContextNote = `Demo per-person estimate for ${params.participants} guests; not a live menu quote. Refresh within ~${DEMO_OFFER_VALIDITY_HOURS}h.`;

  return baseData
    .filter((r) => r.capacity >= params.participants)
    .filter((r) =>
      !params.cuisine ||
      r.cuisine.toLowerCase().includes(params.cuisine.toLowerCase())
    )
    .map((r) => ({
      ...r,
      totalPrice: Math.round(r.pricePerPerson * params.participants),
      sourceUrl: googleMapsPlaceSearchUrl(r.name, params.location),
      sourceLabel: "Google Maps",
      priceQuotedAt,
      offerExpiresAt,
      dataProvenance: DATA_PROVENANCE_SYNTHETIC_DEMO,
      pricingContextNote,
    }));
}
