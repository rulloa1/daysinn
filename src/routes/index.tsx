import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { PropertyMap } from "@/components/property-map";
import { FranchiseLegal } from "@/components/franchise-footer";
import { AMENITIES, FAQS, type ServiceRequest } from "@/components/home/content";
import { BookingHero } from "@/components/home/booking-hero";
import { RequestDialog } from "@/components/home/request-dialog";
import { RewardsSection } from "@/components/home/rewards-section";
import { SiteHeader } from "@/components/home/site-header";
import {
  AmenitiesSection,
  FaqSection,
  GallerySection,
  GuestToolsSection,
  NearbyStopsSection,
  PoliciesSection,
  RoomTypesSection,
} from "@/components/home/stay-sections";
import { useAvailability } from "@/components/home/use-availability";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Days Inn® by Wyndham Wildwood I-75 — Rooms, Rates & Direct Booking" },
      {
        name: "description",
        content:
          "Book a room at Days Inn Wildwood off I-75 Exit 329. Free hot breakfast, outdoor pool, free Wi-Fi and parking, pet-friendly rooms, and 3 PM check-in.",
      },
      {
        property: "og:title",
        content: "Days Inn® by Wyndham Wildwood I-75 — Rooms, Rates & Direct Booking",
      },
      {
        property: "og:description",
        content:
          "Book a room at Days Inn Wildwood off I-75 Exit 329. Free hot breakfast, outdoor pool, free Wi-Fi and parking, pet-friendly rooms, and 3 PM check-in.",
      },
      { property: "og:url", content: "https://daysinn.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://daysinn.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Hotel",
          name: "Days Inn by Wyndham Wildwood I-75",
          url: "https://daysinn.lovable.app/",
          telephone: "+1-352-748-7766",
          priceRange: "$$",
          checkinTime: "15:00",
          checkoutTime: "11:00",
          petsAllowed: true,
          amenityFeature: AMENITIES.map((name) => ({
            "@type": "LocationFeatureSpecification",
            name,
            value: true,
          })),
          address: {
            "@type": "PostalAddress",
            streetAddress: "551 East SR 44",
            addressLocality: "Wildwood",
            addressRegion: "FL",
            postalCode: "34785",
            addressCountry: "US",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 28.872883,
            longitude: -82.093933,
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
    ],
  }),

  component: GuestView,
});

function GuestView() {
  const [openRequest, setOpenRequest] = useState<ServiceRequest | null>(null);
  const availability = useAvailability();

  return (
    <div className="guest-home min-h-screen selection:bg-[var(--gh-gold)]/30 selection:text-[var(--gh-ink)]">
      <SiteHeader />

      <main>
        <BookingHero availability={availability} />
        <RoomTypesSection bookingLink={availability.bookingLink} />
        <AmenitiesSection />
        <PoliciesSection />
        <GuestToolsSection onRequest={setOpenRequest} />
        <NearbyStopsSection />
        <GallerySection />
        <FaqSection />
        <RewardsSection />
        <PropertyMap />
      </main>

      <footer className="mt-[clamp(2.5rem,6vw,4.5rem)] bg-[var(--gh-blue)] py-11">
        <div className="gh-shell">
          <div className="flex flex-wrap items-start justify-between gap-7">
            <BrandLockup tone="cream" plate />
            <div className="flex flex-wrap items-center gap-5">
              <Link
                to="/staff-login"
                className="signage font-bold text-white/70 transition-colors hover:text-white"
              >
                Staff portal
              </Link>
              <p className="gh-eyebrow">Warm hospitality · Effortless service</p>
            </div>
          </div>
          <FranchiseLegal className="mt-7 text-[0.76rem] leading-[1.65] text-white/45" />
        </div>
      </footer>

      <RequestDialog request={openRequest} onClose={() => setOpenRequest(null)} />
    </div>
  );
}
