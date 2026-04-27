export interface HotelOption {
  name: string;
  stars: number;
  pricePerNight: number;
  totalPrice: number;
  location: string;
  amenities: string[];
  rating: number;
  capacity: number;
}

const HOTEL_DATA: Record<string, HotelOption[]> = {
  default: [
    {
      name: "Grand Palace Hotel",
      stars: 5,
      pricePerNight: 220,
      totalPrice: 0,
      location: "City Centre",
      amenities: ["Conference rooms", "Pool", "Spa", "Restaurant"],
      rating: 4.8,
      capacity: 50,
    },
    {
      name: "Business Inn & Suites",
      stars: 4,
      pricePerNight: 145,
      totalPrice: 0,
      location: "Business District",
      amenities: ["Meeting rooms", "Gym", "Free WiFi", "Breakfast"],
      rating: 4.5,
      capacity: 80,
    },
    {
      name: "Comfort Stay Hotel",
      stars: 3,
      pricePerNight: 95,
      totalPrice: 0,
      location: "Near Airport",
      amenities: ["Free WiFi", "Parking", "Breakfast"],
      rating: 4.1,
      capacity: 100,
    },
  ],
  barcelona: [
    {
      name: "Hotel Arts Barcelona",
      stars: 5,
      pricePerNight: 280,
      totalPrice: 0,
      location: "Barceloneta Beach",
      amenities: ["Rooftop pool", "Spa", "3 restaurants", "Conference centre"],
      rating: 4.9,
      capacity: 60,
    },
    {
      name: "Pullman Barcelona Skipper",
      stars: 4,
      pricePerNight: 175,
      totalPrice: 0,
      location: "Port Olímpic",
      amenities: ["Meeting rooms", "Pool", "Restaurant", "Gym"],
      rating: 4.6,
      capacity: 40,
    },
    {
      name: "Novotel Barcelona City",
      stars: 4,
      pricePerNight: 130,
      totalPrice: 0,
      location: "Diagonal",
      amenities: ["Conference rooms", "Free WiFi", "Breakfast"],
      rating: 4.3,
      capacity: 90,
    },
  ],
  prague: [
    {
      name: "Mandarin Oriental Prague",
      stars: 5,
      pricePerNight: 260,
      totalPrice: 0,
      location: "Malá Strana",
      amenities: ["Spa", "Restaurant", "Conference rooms", "Garden"],
      rating: 4.9,
      capacity: 30,
    },
    {
      name: "Hilton Prague",
      stars: 5,
      pricePerNight: 190,
      totalPrice: 0,
      location: "Florenc",
      amenities: ["Conference centre", "Pool", "Gym", "Restaurant"],
      rating: 4.7,
      capacity: 70,
    },
    {
      name: "Vienna House Andel's Prague",
      stars: 4,
      pricePerNight: 120,
      totalPrice: 0,
      location: "Smíchov",
      amenities: ["Meeting rooms", "Restaurant", "Free WiFi"],
      rating: 4.4,
      capacity: 50,
    },
  ],
  amsterdam: [
    {
      name: "Waldorf Astoria Amsterdam",
      stars: 5,
      pricePerNight: 380,
      totalPrice: 0,
      location: "Herengracht Canal",
      amenities: ["Spa", "Fine dining", "Meeting suites"],
      rating: 4.9,
      capacity: 25,
    },
    {
      name: "Doubletree by Hilton Amsterdam",
      stars: 4,
      pricePerNight: 160,
      totalPrice: 0,
      location: "Centraal Station",
      amenities: ["Conference rooms", "Restaurant", "Bar"],
      rating: 4.5,
      capacity: 60,
    },
    {
      name: "NH Amsterdam Centre",
      stars: 4,
      pricePerNight: 125,
      totalPrice: 0,
      location: "City Centre",
      amenities: ["Meeting rooms", "Free WiFi", "Breakfast"],
      rating: 4.2,
      capacity: 80,
    },
  ],
};

export function searchHotels(params: {
  location: string;
  checkIn: string;
  checkOut: string;
  participants: number;
  maxPricePerNight?: number;
}): HotelOption[] {
  const key = params.location.toLowerCase().split(",")[0].trim();
  const baseData = HOTEL_DATA[key] || HOTEL_DATA.default;

  const nights = Math.max(
    1,
    Math.round(
      (new Date(params.checkOut).getTime() -
        new Date(params.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const rooms = Math.ceil(params.participants / 2);

  return baseData
    .filter((h) =>
      params.maxPricePerNight ? h.pricePerNight <= params.maxPricePerNight : true
    )
    .filter((h) => h.capacity >= params.participants)
    .map((h) => ({
      ...h,
      totalPrice: Math.round(h.pricePerNight * rooms * nights),
    }));
}
