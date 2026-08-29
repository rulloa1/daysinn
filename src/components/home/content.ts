import {
  BedDouble,
  Car,
  Coffee,
  Dog,
  Flame,
  KeyRound,
  MessageSquare,
  Sparkles,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  WYNDHAM_REWARDS_EARN_URL,
  WYNDHAM_REWARDS_JOIN_URL,
  WYNDHAM_REWARDS_TERMS_URL,
} from "@/components/franchise-footer";

/**
 * Static marketing copy & structured data for the guest landing page.
 */

/** Property photography, served straight from `public/property/`. */
const photo = (name: string) => `/property/${name}.avif`;

export const HERO_PHOTO = photo("p-exterior-dusk");
export const POOL_PHOTO = photo("p-pool");
export const POOL_PHOTO_ALT = "Outdoor heated pool with lounge chairs and palm trees";

export type ServiceRequest = {
  id: string;
  label: string;
  prompt: string;
  blurb?: string;
  icon?: LucideIcon;
};

export type RoomSpec = {
  key: string;
  id: string;
  name: string;
  category: "all" | "king" | "queen" | "suite";
  tag: string;
  sleeps: string;
  maxOccupancy: number;
  beds: string;
  sqft: number;
  rateEstimate: number;
  body: string;
  image: string;
  alt: string;
  features: string[];
  appliances: string[];
  accessibility: string;
};

export const ROOM_SPECS: RoomSpec[] = [
  {
    key: "king",
    id: "one-king",
    name: "One King Bed",
    category: "king",
    tag: "Solo & Couples Favorite",
    sleeps: "Sleeps 2",
    maxOccupancy: 2,
    beds: "1 Plush King Bed",
    sqft: 300,
    rateEstimate: 89,
    body: "Spacious layout with a plush king-size bed, ergonomic work desk, armchair, microwave, mini-refrigerator, and high-speed Wi-Fi.",
    image: photo("p-king"),
    alt: "King room with lounge chair, artwork and vanity beyond",
    features: [
      "Plush King Mattress",
      "Ergonomic Work Desk & Chair",
      "Sitting Area & Armchair",
      "Free High-Speed Wi-Fi",
      "40-inch HD Flat-Screen TV",
    ],
    appliances: [
      "Mini Refrigerator",
      "Microwave",
      "Single-serve Coffee Maker",
      "Hair Dryer & Ironing Set",
    ],
    accessibility: "ADA Accessible King options available on request",
  },
  {
    key: "double_queen",
    id: "two-queen",
    name: "Two Queen Beds",
    category: "queen",
    tag: "Most Popular for Families",
    sleeps: "Sleeps 4",
    maxOccupancy: 4,
    beds: "2 Queen Beds",
    sqft: 330,
    rateEstimate: 99,
    body: "Ideal for road trippers, families, and golf groups heading to The Villages. Includes two comfy queen beds, workspace, and micro-fridge.",
    image: photo("p-two-queen"),
    alt: "Guest room with two queen beds and balcony doors",
    features: [
      "2 Deluxe Queen Mattresses",
      "Spacious Family Layout",
      "Free High-Speed Wi-Fi",
      "40-inch HD Flat-Screen TV",
      "Individual Climate Control AC/Heat",
    ],
    appliances: [
      "Mini Refrigerator",
      "Microwave",
      "Single-serve Coffee Maker",
      "Hair Dryer & Ironing Set",
    ],
    accessibility: "ADA Double Queen ground-floor rooms available",
  },
  {
    key: "double_queen",
    id: "hospitality-suite",
    name: "Hospitality Suite",
    category: "suite",
    tag: "Extra Living Space",
    sleeps: "Sleeps 4",
    maxOccupancy: 4,
    beds: "1 King Bed + Sleeper Sofa",
    sqft: 420,
    rateEstimate: 124,
    body: "Extended space featuring a king bedroom, separate sitting lounge with sofa bed, dedicated dining/work desk, and upgraded amenities.",
    image: photo("p-suite"),
    alt: "Suite with two beds, sofa and a separate work area",
    features: [
      "Separate Living & Sleeping Zone",
      "Convertible Sofa Bed",
      "Enhanced Workstation",
      "Free High-Speed Wi-Fi",
      "Multiple HD Flat-Screen TVs",
    ],
    appliances: [
      "Large Mini Refrigerator",
      "Microwave",
      "Coffee & Tea Station",
      "Hair Dryer, Iron & Extra Linens",
    ],
    accessibility: "Ground floor convenient parking access",
  },
];

export const ROOM_TYPES = ROOM_SPECS;

export type AmenityCategory = {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  items: {
    title: string;
    description: string;
    icon: LucideIcon;
    highlight?: boolean;
  }[];
};

export const AMENITY_CATEGORIES: AmenityCategory[] = [
  {
    id: "top-perks",
    name: "Top Guest Perks",
    icon: Sparkles,
    description: "Everyday essentials included complimentary with every reservation",
    items: [
      {
        title: "Free Daybreak® Breakfast",
        description: "Fresh waffles, hot coffee, juices, oatmeal, cereals & pastries served daily.",
        icon: Coffee,
        highlight: true,
      },
      {
        title: "Outdoor Heated Swimming Pool",
        description: "Year-round heated pool with sun loungers, umbrella shade, and pool lift.",
        icon: Waves,
        highlight: true,
      },
      {
        title: "High-Speed Wi-Fi Everywhere",
        description: "Complimentary ultra-fast wireless internet in all rooms and public areas.",
        icon: Wifi,
        highlight: true,
      },
      {
        title: "Free RV, Truck & Bus Parking",
        description: "Spacious on-site parking accommodating large vehicles, trailers & campers.",
        icon: Car,
        highlight: true,
      },
    ],
  },
  {
    id: "in-room",
    name: "In-Room Comforts",
    icon: BedDouble,
    description: "Modern conveniences to make your room feel like home",
    items: [
      {
        title: "Micro-Fridge in Every Room",
        description: "Keep snacks, beverages, and groceries chilled during your trip.",
        icon: Utensils,
      },
      {
        title: "Microwave Oven",
        description: "Warm up meals and snacks whenever you need them.",
        icon: Flame,
      },
      {
        title: "HD Flat-Screen Television",
        description: "Premium high-definition cable channels, sports, and news.",
        icon: Tv,
      },
      {
        title: "Climate Control AC & Heat",
        description: "Individual in-room digital temperature control for your optimal comfort.",
        icon: Wind,
      },
    ],
  },
  {
    id: "services",
    name: "Hotel Services & Pets",
    icon: KeyRound,
    description: "Thoughtful hospitality for smooth travel and extended stays",
    items: [
      {
        title: "Pet-Friendly Accommodations",
        description: "Bring your furry companions along! Dedicated pet-friendly rooms available.",
        icon: Dog,
        highlight: true,
      },
      {
        title: "24/7 Front Desk Reception",
        description: "Always staffed for late check-ins, local recommendations, and assistance.",
        icon: KeyRound,
      },
      {
        title: "Guest Laundry Facility",
        description: "Self-service coin-operated laundry machines available on-property.",
        icon: Sparkles,
      },
      {
        title: "Direct Digital In-Room Requests",
        description: "Request extra towels, toiletries, or late checkout right from your phone.",
        icon: MessageSquare,
        highlight: true,
      },
    ],
  },
];

export const AMENITIES = [
  "Free Daybreak® hot breakfast",
  "Outdoor heated pool",
  "Free high-speed Wi-Fi",
  "Free parking — RV & truck friendly",
  "Pet-friendly rooms (fees apply)",
  "Micro-fridge in every room",
  "Guest laundry access",
  "Right off I-75 Exit 329",
];

export type Attraction = {
  title: string;
  category: "The Villages" | "Dining" | "Nature & Springs" | "Travel & Transit";
  distance: string;
  driveTime: string;
  body: string;
  mapQuery: string;
  highlight?: string;
};

export const ATTRACTIONS: Attraction[] = [
  {
    title: "Brownwood Paddock Square®",
    category: "The Villages",
    distance: "5.4 miles",
    driveTime: "8 mins",
    body: "Western-themed town square with nightly live music, outdoor bars, movie theatre, and fine dining.",
    mapQuery: "Brownwood+Paddock+Square+The+Villages+FL",
    highlight: "Nightly Live Music & Dining",
  },
  {
    title: "Lake Sumter Landing® Market Square",
    category: "The Villages",
    distance: "9.2 miles",
    driveTime: "14 mins",
    body: "Lakeside square with scenic boardwalks, live entertainment every evening, waterfront restaurants & boutiques.",
    mapQuery: "Lake+Sumter+Landing+Market+Square+The+Villages+FL",
    highlight: "Waterfront Boardwalk & Shops",
  },
  {
    title: "Spanish Springs Town Square®",
    category: "The Villages",
    distance: "12.8 miles",
    driveTime: "18 mins",
    body: "Southwestern-styled hub featuring the Sharon L. Morse Performing Arts Center, shops, bowling, and nightlife.",
    mapQuery: "Spanish+Springs+Town+Square+The+Villages+FL",
  },
  {
    title: "Local Wildwood Diners & BBQ",
    category: "Dining",
    distance: "0.4 miles",
    driveTime: "2 mins",
    body: "Authentic Southern comfort dining, fresh BBQ pits, classic roadside diners, and bakery coffee shops.",
    mapQuery: "Restaurants+near+551+East+SR+44+Wildwood+FL",
    highlight: "2 Minutes from Lobby",
  },
  {
    title: "Rainbow Springs State Park",
    category: "Nature & Springs",
    distance: "28 miles",
    driveTime: "35 mins",
    body: "Crystal-clear 72°F freshwater springs, tubing, kayaking, waterfall gardens, and scenic Florida nature trails.",
    mapQuery: "Rainbow+Springs+State+Park+FL",
    highlight: "Crystal Clear Springs & Kayaking",
  },
  {
    title: "Lake Griffin State Park",
    category: "Nature & Springs",
    distance: "14 miles",
    driveTime: "19 mins",
    body: "Home to the 400-year-old mammoth Live Oak tree, kayak launch, birding, and bass fishing.",
    mapQuery: "Lake+Griffin+State+Park+FL",
  },
  {
    title: "I-75 Exit 329 & Florida's Turnpike Interchange",
    category: "Travel & Transit",
    distance: "0.2 miles",
    driveTime: "1 min",
    body: "Immediate access to Interstate 75 and Florida's Turnpike — gateway connecting Ocala, Orlando, and Tampa.",
    mapQuery: "Exit+329+I-75+Wildwood+FL",
    highlight: "Immediate Highway Access",
  },
  {
    title: "Orlando International Airport (MCO)",
    category: "Travel & Transit",
    distance: "58 miles",
    driveTime: "55 mins",
    body: "Direct highway drive via Florida's Turnpike into Orlando airport and central Florida attractions.",
    mapQuery: "Orlando+International+Airport+MCO",
  },
];

export const STOPS = [
  {
    title: "Breakfast & Coffee",
    body: "Complimentary Daybreak® breakfast in the lobby, plus local diner options nearby.",
    category: "Dining",
  },
  {
    title: "Fuel & Travel Essentials",
    body: "Convenient I-75 service stations, travel convenience stores, and ATM access.",
    category: "Convenience",
  },
  {
    title: "Local Attractions & Dining",
    body: "Ask our front desk for curated recommendations in Wildwood and The Villages.",
    category: "Explore",
  },
];

export type GuestReview = {
  author: string;
  location: string;
  travelType: "Road Tripper" | "The Villages Visitor" | "Family Stay" | "Pet Owner" | "Couples Stay";
  rating: number;
  title: string;
  body: string;
  stayDate: string;
  verified: boolean;
};

export const GUEST_REVIEWS: GuestReview[] = [
  {
    author: "Robert & Karen M.",
    location: "Atlanta, GA",
    travelType: "Road Tripper",
    rating: 5,
    title: "Perfect stop off I-75 — Spotless and quiet!",
    body: "We stay here every year driving down to South Florida. Less than 2 minutes off the interstate exit. The room was super clean, the bed was comfortable, and having hot breakfast ready at 6 AM was a huge plus.",
    stayDate: "Verified Stay · Last Month",
    verified: true,
  },
  {
    author: "David L.",
    location: "Columbus, OH",
    travelType: "The Villages Visitor",
    rating: 5,
    title: "Best value when visiting family in The Villages",
    body: "Only about 8–10 minutes from Brownwood Paddock Square. Way more affordable than the resort hotels inside the Villages, but with clean rooms, free parking, and very friendly front desk staff.",
    stayDate: "Verified Stay · 2 Weeks Ago",
    verified: true,
  },
  {
    author: "Sarah & Mark T.",
    location: "Charlotte, NC",
    travelType: "Pet Owner",
    rating: 5,
    title: "Very accommodating for traveling with our Golden Retriever",
    body: "Finding clean, pet-friendly hotels right off I-75 can be tough. The staff greeted our dog warmly, gave us a ground floor room near the grass area, and the pool area was very relaxing in the afternoon.",
    stayDate: "Verified Stay · 3 Weeks Ago",
    verified: true,
  },
  {
    author: "Elena G.",
    location: "Miami, FL",
    travelType: "Family Stay",
    rating: 5,
    title: "Kids loved the heated pool and waffle breakfast",
    body: "Two queen beds with plenty of room for 4 of us. The mini-fridge and microwave were great for snacks, and the kids really enjoyed swimming after a long day in the car. We will be back!",
    stayDate: "Verified Stay · Last Week",
    verified: true,
  },
];

export const REWARDS = [
  {
    title: "Member rates & offers",
    body: "Join or sign in on Wyndham.com to see currently available Wyndham Rewards® member offers.",
    badge: "Official booking",
    href: WYNDHAM_REWARDS_JOIN_URL,
  },
  {
    title: "Earn points on qualifying stays",
    body: "At most participating Wyndham Hotels & Resorts, earn 10 points per dollar or 1,000 points per qualified stay—whichever is more.",
    badge: "Program earning",
    href: WYNDHAM_REWARDS_EARN_URL,
  },
  {
    title: "Review program terms",
    body: "Member benefits, qualifying stays, and redemption options are subject to the current Wyndham Rewards program terms.",
    badge: "Terms apply",
    href: WYNDHAM_REWARDS_TERMS_URL,
  },
];

export const GALLERY = [
  {
    src: photo("p-exterior-day"),
    alt: "Days Inn Wildwood exterior and porte-cochère by day",
    caption: "Front Entrance & Canopy",
  },
  {
    src: photo("p-two-queen"),
    alt: "Two queen beds with pier artwork",
    caption: "Two Queen Guest Room",
  },
  {
    src: photo("p-king-wide"),
    alt: "King room with lounge chair and desk",
    caption: "One King Guest Room",
  },
  {
    src: photo("p-pool"),
    alt: "Outdoor pool with lounge chairs and pool lift",
    caption: "Outdoor Heated Pool",
  },
  {
    src: photo("p-pool-lawn"),
    alt: "Shaded picnic tables on the lawn beside the pool",
    caption: "Picnic Lawn & Grills",
  },
  {
    src: photo("p-breakfast"),
    alt: "Breakfast dining room with tables and chairs",
    caption: "Daybreak® Breakfast Room",
  },
  {
    src: photo("p-business"),
    alt: "Business centre desk with computer and printer",
    caption: "Business Center",
  },
  {
    src: photo("p-suite-alt"),
    alt: "Suite bedroom with pier artwork",
    caption: "Hospitality Suite",
  },
  {
    src: photo("p-amenity"),
    alt: "In-room fridge, microwave and work desk",
    caption: "Fridge & Microwave",
  },
  { src: photo("p-bath"), alt: "Bathroom with tub and shower", caption: "Guest Bath" },
];

export const MAP_URL = "https://www.google.com/maps/search/?api=1&query=28.872883,-82.093933";

export const REQUESTS: Required<ServiceRequest>[] = [
  {
    id: "towels",
    label: "Fresh Towels & Linens",
    blurb: "Bath towels, washcloths, extra pillows",
    prompt: "How many towels or linens do you need?",
    icon: Sparkles,
  },
  {
    id: "housekeeping",
    label: "Housekeeping Refresh",
    blurb: "Room tidy, trash removal & amenities",
    prompt: "Tell us the best time to stop by your room.",
    icon: BedDouble,
  },
  {
    id: "problem",
    label: "Maintenance & Repairs",
    blurb: "Fast repair dispatch to your room",
    prompt: "What needs attention in your room?",
    icon: Wrench,
  },
  {
    id: "front-desk",
    label: "Front Desk Assistance",
    blurb: "Direct messaging with our front team",
    prompt: "How can our desk staff assist you right now?",
    icon: MessageSquare,
  },
];

export const POLICIES = [
  { label: "Check-in", value: "3:00 PM" },
  { label: "Check-out", value: "11:00 AM" },
  { label: "Cancellation", value: "Free until 4:00 PM day of arrival on most rates" },
  { label: "Pets", value: "Welcome in select rooms — additional fee at check-in" },
  { label: "Smoking", value: "Non-smoking property" },
  { label: "Age to check in", value: "21+ with valid photo ID and credit card" },
];

export const FAQS = [
  {
    q: "How far is the hotel from I-75 and The Villages?",
    a: "We are less than 1 minute from I-75 Exit 329 at 551 East SR 44, Wildwood, and only 8–10 minutes from Brownwood Paddock Square in The Villages.",
  },
  {
    q: "Is hot breakfast included with our reservation?",
    a: "Yes! Complimentary Daybreak® breakfast is served fresh every morning in our breakfast dining room, with hot waffles, coffee, pastries, juices, and cereal.",
  },
  {
    q: "Are the guest rooms pet friendly?",
    a: "Yes, we welcome well-behaved pets in designated pet-friendly rooms. A small nominal pet fee applies at check-in. Please select or mention pet needs when reserving.",
  },
  {
    q: "Is there on-site parking for large RVs, moving trucks, or trailers?",
    a: "Yes! We offer complimentary oversized parking spaces that comfortably accommodate RVs, buses, semi-trucks, and utility trailers.",
  },
  {
    q: "How do Wyndham Rewards member rates and point earnings work?",
    a: "Members earn 10 points per dollar spent or a guaranteed 1,000 points per qualifying stay (whichever is more). You can redeem points starting at 7,500 points for free nights across thousands of Wyndham properties.",
  },
];

