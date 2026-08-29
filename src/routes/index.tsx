import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { PropertyMap } from "@/components/property-map";
import { FranchiseLegal } from "@/components/franchise-footer";
import { AMENITIES, FAQS, type ServiceRequest } from "@/components/home/content";
import { BookingHero } from "@/components/home/booking-hero";
import { RequestDialog } from "@/components/home/request-dialog";
import { ContactSection, RewardsSection } from "@/components/home/rewards-section";
import { SiteHeader } from "@/components/home/site-header";
import {
  AmenitiesAndPolicies,
  FaqSection,
  GallerySection,
  GuestToolsSection,
  LateCheckoutSection,
  NearbyStopsSection,
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
    <div className="min-h-screen bg-[#DCE4ED] text-slate-800 selection:bg-[#D4AF37]/30 selection:text-[#004986]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-6 md:px-8">
        <BookingHero availability={availability} />
        <RoomTypesSection bookingLink={availability.bookingLink} />
        <AmenitiesAndPolicies />
        <GuestToolsSection onRequest={setOpenRequest} />
        <LateCheckoutSection onRequest={setOpenRequest} />
        <NearbyStopsSection />
        <GallerySection />
        <FaqSection />
        <RewardsSection />
        <PropertyMap />
        <ContactSection />
      </main>

      <footer className="border-t border-[#D2DBE6] bg-[#004986] px-5 py-12 text-white md:px-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BrandLockup tone="cream" />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <p className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
                Warm hospitality · Effortless service
              </p>
              <Link
                to="/staff"
                className="text-xs font-semibold text-white/55 underline underline-offset-4 transition hover:text-white"
              >
                Staff portal
              </Link>
            </div>
          </div>
          <FranchiseLegal className="text-xs text-white/50" />
        </div>
      </footer>

      <RequestDialog request={openRequest} onClose={() => setOpenRequest(null)} />
    </div>
  );
}
