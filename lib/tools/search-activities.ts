import {
  DATA_PROVENANCE_SYNTHETIC_DEMO,
  computeOfferExpiresAtIso,
  DEMO_OFFER_VALIDITY_HOURS,
} from "@/lib/travel-data-provenance";
import { googleWebSearchUrl } from "@/lib/travel-source-urls";

export interface ActivityOption {
  name: string;
  type: string;
  duration: string;
  pricePerPerson: number;
  totalPrice: number;
  maxParticipants: number;
  description: string;
  rating: number;
  sourceUrl: string;
  sourceLabel: string;
  priceQuotedAt: string;
  offerExpiresAt: string;
  dataProvenance: typeof DATA_PROVENANCE_SYNTHETIC_DEMO;
  pricingContextNote: string;
}

type ActivitySeed = Omit<
  ActivityOption,
  | "sourceUrl"
  | "sourceLabel"
  | "priceQuotedAt"
  | "offerExpiresAt"
  | "dataProvenance"
  | "pricingContextNote"
>;

const ACTIVITY_DATA: Record<string, ActivitySeed[]> = {
  default: [
    {
      name: "City Walking Tour",
      type: "tour",
      duration: "3 hours",
      pricePerPerson: 35,
      totalPrice: 0,
      maxParticipants: 25,
      description: "Guided walking tour of city highlights with a local expert.",
      rating: 4.7,
    },
    {
      name: "Team Escape Room Challenge",
      type: "team-building",
      duration: "2 hours",
      pricePerPerson: 45,
      totalPrice: 0,
      maxParticipants: 30,
      description:
        "Interactive escape room designed for corporate team building.",
      rating: 4.8,
    },
    {
      name: "Cooking Class",
      type: "team-building",
      duration: "3 hours",
      pricePerPerson: 65,
      totalPrice: 0,
      maxParticipants: 20,
      description: "Learn local cuisine with a professional chef.",
      rating: 4.9,
    },
  ],
  barcelona: [
    {
      name: "Sailing in the Mediterranean",
      type: "outdoor",
      duration: "4 hours",
      pricePerPerson: 95,
      totalPrice: 0,
      maxParticipants: 25,
      description:
        "Corporate sailing regatta or leisure cruise along Barcelona's coast.",
      rating: 4.9,
    },
    {
      name: "Gaudi Architecture Tour",
      type: "tour",
      duration: "3 hours",
      pricePerPerson: 55,
      totalPrice: 0,
      maxParticipants: 30,
      description:
        "Guided tour of Sagrada Família, Park Güell and Casa Batlló.",
      rating: 4.8,
    },
    {
      name: "Paella Cooking Workshop",
      type: "team-building",
      duration: "3 hours",
      pricePerPerson: 70,
      totalPrice: 0,
      maxParticipants: 20,
      description: "Learn to cook authentic Catalan paella with tapas.",
      rating: 4.7,
    },
    {
      name: "FC Barcelona Stadium Tour",
      type: "tour",
      duration: "2 hours",
      pricePerPerson: 40,
      totalPrice: 0,
      maxParticipants: 50,
      description: "Behind-the-scenes tour of the legendary Camp Nou.",
      rating: 4.6,
    },
  ],
  prague: [
    {
      name: "Prague Castle & Old Town Tour",
      type: "tour",
      duration: "4 hours",
      pricePerPerson: 48,
      totalPrice: 0,
      maxParticipants: 30,
      description:
        "Guided tour of Prague Castle complex and Old Town Square.",
      rating: 4.9,
    },
    {
      name: "Czech Beer & Brewery Tour",
      type: "team-building",
      duration: "3 hours",
      pricePerPerson: 55,
      totalPrice: 0,
      maxParticipants: 25,
      description:
        "Visit a historic Czech brewery, learn about beer culture, enjoy tasting.",
      rating: 4.8,
    },
    {
      name: "Kayaking on the Vltava River",
      type: "outdoor",
      duration: "3 hours",
      pricePerPerson: 45,
      totalPrice: 0,
      maxParticipants: 20,
      description: "Team kayaking experience through the heart of Prague.",
      rating: 4.7,
    },
  ],
  amsterdam: [
    {
      name: "Canal Boat Team Cruise",
      type: "outdoor",
      duration: "2 hours",
      pricePerPerson: 60,
      totalPrice: 0,
      maxParticipants: 40,
      description: "Private canal boat cruise through Amsterdam's waterways.",
      rating: 4.8,
    },
    {
      name: "Rijksmuseum Private Tour",
      type: "tour",
      duration: "2.5 hours",
      pricePerPerson: 55,
      totalPrice: 0,
      maxParticipants: 25,
      description: "Private guided tour of Dutch masters at the Rijksmuseum.",
      rating: 4.7,
    },
    {
      name: "Dutch Cheese & Wine Workshop",
      type: "team-building",
      duration: "2 hours",
      pricePerPerson: 65,
      totalPrice: 0,
      maxParticipants: 30,
      description: "Dutch cheese tasting paired with local wines and stories.",
      rating: 4.9,
    },
  ],
};

export function searchActivities(params: {
  location: string;
  type?: string;
  participants: number;
}): ActivityOption[] {
  const key = params.location.toLowerCase().split(",")[0].trim();
  const baseData = ACTIVITY_DATA[key] || ACTIVITY_DATA.default;
  const quoted = new Date();
  const priceQuotedAt = quoted.toISOString();
  const offerExpiresAt = computeOfferExpiresAtIso(quoted);
  const pricingContextNote = `Demo activity price for ${params.participants} pax; confirm with operator. ~${DEMO_OFFER_VALIDITY_HOURS}h freshness window.`;

  return baseData
    .filter((a) => a.maxParticipants >= params.participants)
    .filter((a) => (!params.type || a.type === params.type))
    .map((a) => ({
      ...a,
      totalPrice: Math.round(a.pricePerPerson * params.participants),
      sourceUrl: googleWebSearchUrl(`${a.name} ${params.location} booking`),
      sourceLabel: "Web search",
      priceQuotedAt,
      offerExpiresAt,
      dataProvenance: DATA_PROVENANCE_SYNTHETIC_DEMO,
      pricingContextNote,
    }));
}
