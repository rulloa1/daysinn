import { BedDouble, MessageSquare, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import exteriorAsset from "@/assets/unnamed-2.webp.asset.json";
import roomAsset from "@/assets/room.webp.asset.json";
import pool1Asset from "@/assets/unnamed_1.webp.asset.json";
import bathAsset from "@/assets/unnamed_2.webp.asset.json";
import pool2Asset from "@/assets/unnamed_3.webp.asset.json";
import lobbyAsset from "@/assets/unnamed_4.webp.asset.json";
import doubleAsset from "@/assets/unnamed_5.webp.asset.json";
import breakfastAsset from "@/assets/unnamed_6.webp.asset.json";
import suiteAsset from "@/assets/unnamed_8.webp.asset.json";
import deskAsset from "@/assets/unnamed_9.webp.asset.json";
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
    src: exteriorAsset.url,
    alt: "Days Inn Wildwood exterior at dusk",
    caption: "Front Entrance & Walkway",
  },
  {
    src: roomAsset.url,
    alt: "Two queen beds with coastal artwork",
    caption: "Two Queen Guest Room",
  },
  {
    src: doubleAsset.url,
    alt: "Guest room with two beds, desk and window",
    caption: "Executive Room View",
  },
  {
    src: pool1Asset.url,
    alt: "Outdoor pool with lounge chairs and palm trees",
    caption: "Outdoor Heated Pool",
  },
  {
    src: pool2Asset.url,
    alt: "Pool deck beside the guest room building",
    caption: "Sunny Pool Deck",
  },
  { src: lobbyAsset.url, alt: "Front desk in the lobby", caption: "Guest Welcome Lobby" },
  {
    src: breakfastAsset.url,
    alt: "Breakfast counter with coffee and waffle makers",
    caption: "Daybreak® Breakfast",
  },
  {
    src: suiteAsset.url,
    alt: "Suite sitting area with sofa, desk and TV",
    caption: "Hospitality Suite",
  },
  {
    src: deskAsset.url,
    alt: "In-room work desk with fridge, microwave and TV",
    caption: "Workstation & Kitchenette",
  },
  { src: bathAsset.url, alt: "Bathroom with tub and shower", caption: "Spacious En-Suite Bath" },
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
    image: deskAsset.url,
    alt: "King room with work desk, fridge and microwave",
  },
  {
    key: "double_queen",
    name: "Two Queen Beds",
    sleeps: "Sleeps 4",
    beds: "2 queen beds · 330 sq ft",
    body: "Our most popular room for families and road-trip crews heading down I-75.",
    image: roomAsset.url,
    alt: "Guest room with two queen beds",
  },
  {
    key: "double_queen",
    name: "Hospitality Suite",
    sleeps: "Sleeps 4",
    beds: "1 king bed + sofa · sitting area",
    body: "Extra living space with sofa, desk and second TV for longer stays.",
    image: suiteAsset.url,
    alt: "Suite sitting area with sofa, desk and TV",
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
