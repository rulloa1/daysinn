import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";
import { FranchiseLegal } from "@/components/franchise-footer";

type Place = {
  name: string;
  blurb: string;
  drive: string;
  query: string;
};

const DINING: Place[] = [
  {
    name: "Cracker Barrel Old Country Store",
    blurb: "Southern comfort plates and all-day breakfast right off the I-75 interchange.",
    drive: "2 min",
    query: "Cracker Barrel Wildwood FL",
  },
  {
    name: "Sonny's BBQ",
    blurb: "Slow-smoked brisket, ribs and sweet tea — the local road-trip standby.",
    drive: "5 min",
    query: "Sonny's BBQ Wildwood FL",
  },
  {
    name: "Beef 'O' Brady's",
    blurb: "Family sports pub with wings, burgers and the game on every screen.",
    drive: "8 min",
    query: "Beef O Bradys Wildwood FL",
  },
  {
    name: "Brownwood Paddock Square",
    blurb: "Walkable square in The Villages with a dozen restaurants and live music most nights.",
    drive: "12 min",
    query: "Brownwood Paddock Square The Villages FL",
  },
];

const ATTRACTIONS: Place[] = [
  {
    name: "Lake Okahumpka Park",
    blurb: "Boardwalk, fishing pier and shaded picnic pavilions on the lake.",
    drive: "7 min",
    query: "Lake Okahumpka Park Wildwood FL",
  },
  {
    name: "Withlacoochee State Trail",
    blurb: "Paved rail-trail for cycling and long walks through old Florida pine.",
    drive: "20 min",
    query: "Withlacoochee State Trail",
  },
  {
    name: "Rainbow Springs State Park",
    blurb: "Crystal headsprings, waterfalls and tubing on a spring-fed river.",
    drive: "45 min",
    query: "Rainbow Springs State Park",
  },
  {
    name: "Orlando theme parks",
    blurb: "Straight down I-75 to the Turnpike — an easy morning run to the parks.",
    drive: "60 min",
    query: "Walt Disney World Resort",
  },
];

const ESSENTIALS: Place[] = [
  {
    name: "Walmart Supercenter",
    blurb: "Groceries, pharmacy and anything you left at home.",
    drive: "5 min",
    query: "Walmart Supercenter Wildwood FL",
  },
  {
    name: "Wildwood urgent care",
    blurb: "Walk-in clinic for minor issues; call 911 for emergencies.",
    drive: "8 min",
    query: "urgent care Wildwood FL",
  },
  {
    name: "Fuel & truck stop",
    blurb: "24-hour fuel, showers and coffee at the interchange.",
    drive: "3 min",
    query: "truck stop Wildwood FL I-75",
  },
];

function mapLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Local Guide — Days Inn® by Wyndham Wildwood" },
      {
        name: "description",
        content:
          "Where to eat, what to see and where to stock up near the Days Inn Wildwood — dining, parks, springs and essentials with drive times.",
      },
      { property: "og:title", content: "Local Guide — Days Inn® by Wyndham Wildwood" },
      {
        property: "og:description",
        content:
          "Dining, attractions and essentials near the Days Inn Wildwood, with approximate drive times and one-tap directions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidePage,
});

function Section({ title, note, places }: { title: string; note: string; places: Place[] }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{note}</p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {places.map((place) => (
          <li key={place.name} className="border border-border bg-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl leading-tight">{place.name}</h3>
              <span className="signage shrink-0 text-amber">{place.drive}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{place.blurb}</p>
            <a
              href={mapLink(place.query)}
              target="_blank"
              rel="noreferrer"
              className="signage mt-3 inline-block underline decoration-amber decoration-2 underline-offset-4"
            >
              Directions →
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GuidePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 md:px-12">
        <BrandLockup />
        <nav className="flex items-center gap-4">
          <Link to="/" className="signage text-muted-foreground hover:text-foreground">
            Guest hub
          </Link>
          <Link to="/track" className="signage text-muted-foreground hover:text-foreground">
            Track a request
          </Link>
        </nav>
      </header>

      <main className="px-6 py-10 md:px-12">
        <p className="signage flex items-center gap-2 text-muted-foreground">
          <span aria-hidden className="h-3 w-[3px] bg-amber" />
          Wildwood, Florida
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl leading-[1.05] md:text-5xl">
          Your <em className="text-amber">local guide</em> — food, springs and the fast way out of
          town.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Everything below is a short hop from 551 FL-44. Drive times are approximate; the front
          desk is happy to call ahead for you.
        </p>

        <Section
          title="Where to eat"
          note="Breakfast through late dinner, all within a few minutes of the property."
          places={DINING}
        />
        <Section
          title="What to see"
          note="Lakes, trails and springs — plus the theme-park run if you're headed south."
          places={ATTRACTIONS}
        />
        <Section
          title="Essentials"
          note="Groceries, care and fuel while you're on the road."
          places={ESSENTIALS}
        />

        <p className="mt-12 text-sm text-muted-foreground">
          Need a recommendation we haven't listed?{" "}
          <Link
            to="/checkin"
            className="underline decoration-amber decoration-2 underline-offset-4"
          >
            Message the front desk from your room
          </Link>
          .
        </p>
      </main>

      <FranchiseLegal />
    </div>
  );
}
