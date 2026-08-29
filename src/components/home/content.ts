import { BedDouble, MessageSquare, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import {
  WYNDHAM_REWARDS_EARN_URL,
  WYNDHAM_REWARDS_JOIN_URL,
  WYNDHAM_REWARDS_TERMS_URL,
} from "@/components/franchise-footer";

/**
 * Static marketing copy for the guest landing page. Kept apart from the layout
 * so the page's sections stay readable and this stays easy to hand to whoever
 * owns the property's wording.
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

export const ROOM_TYPES = [
  {
    key: "king",
    name: "One King Bed",
    sleeps: "Sleeps 2",
    beds: "1 king bed · 300 sq ft",
    body: "Work desk, mini fridge, microwave, flat-screen TV and free Wi-Fi.",
    image: photo("p-king"),
    alt: "King room with lounge chair, artwork and vanity beyond",
  },
  {
    key: "double_queen",
    name: "Two Queen Beds",
    sleeps: "Sleeps 4",
    beds: "2 queen beds · 330 sq ft",
    body: "Our most popular room for families and road-trip crews heading down I-75.",
    image: photo("p-two-queen"),
    alt: "Guest room with two queen beds and balcony doors",
  },
  {
    key: "double_queen",
    name: "Hospitality Suite",
    sleeps: "Sleeps 4",
    beds: "1 king bed + sofa · sitting area",
    body: "Extra living space with sofa, desk and second TV for longer stays.",
    image: photo("p-suite"),
    alt: "Suite with two beds, sofa and a separate work area",
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
    q: "How far is the hotel from I-75?",
    a: "We're less than a minute from I-75 Exit 329 at 551 East SR 44, Wildwood — an easy stop between Ocala and Orlando and about 10 minutes from The Villages.",
  },
  {
    q: "Is breakfast included?",
    a: "Yes. Complimentary Daybreak® breakfast is served every morning in the lobby, with coffee available throughout the day.",
  },
  {
    q: "Do you allow pets?",
    a: "Pets are welcome in select rooms. A pet fee is collected at check-in — please tell the front desk when you book so we can assign the right room.",
  },
  {
    q: "Is there parking for trucks and RVs?",
    a: "Free on-site parking is available, including oversized spaces for trucks and RVs on a first-come basis.",
  },
  {
    q: "How do Wyndham Rewards member rates and points work?",
    a: "Use the official Wyndham booking flow to view current member offers. Wyndham Rewards points are earned on qualifying stays at participating properties; program terms apply.",
  },
];
