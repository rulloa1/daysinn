const LAT = 28.872883;
const LNG = -82.093933;
const ADDRESS = "551 East SR 44, Wildwood, FL 34785";

const DIRECTIONS = [
  {
    label: "Google Maps",
    href: `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`,
  },
  {
    label: "Apple Maps",
    href: `https://maps.apple.com/?daddr=${LAT},${LNG}&dirflg=d`,
  },
  {
    label: "Waze",
    href: `https://waze.com/ul?ll=${LAT},${LNG}&navigate=yes`,
  },
];

export function PropertyMap() {
  const browserKey = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'] as
    | string
    | undefined;
  const embedUrl = browserKey
    ? `https://www.google.com/maps/embed/v1/place?key=${browserKey}&q=${LAT},${LNG}&zoom=15`
    : null;

  return (
    <section className="mt-9 overflow-hidden rounded-3xl bg-card shadow-sm">
      <div className="grid gap-0 md:grid-cols-[1.4fr_1fr]">
        <div className="min-h-[16rem]">
          {embedUrl ? (
            <iframe
              title="Map to Days Inn Wildwood"
              src={embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-64 w-full border-0 md:h-full"
              allowFullScreen
            />
          ) : (
            <div className="flex h-64 items-center justify-center bg-ink/5 px-6 text-center text-sm text-muted-foreground md:h-full">
              Map unavailable right now — use the directions links to navigate.
            </div>
          )}
        </div>

        <div className="p-6">
          <p className="signage text-ocean">Getting here</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Days Inn Wildwood</h2>
          <address className="mt-1 not-italic text-sm text-muted-foreground">
            551 East SR 44
            <br />
            Wildwood, FL 34785
          </address>
          <p className="mt-3 text-xs text-muted-foreground">
            Just off I-75 exit 329 and Florida&apos;s Turnpike — free parking on site.
          </p>

          <p className="signage mt-5 text-ink-soft">Driving directions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIRECTIONS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-ocean px-4 py-2.5 text-xs font-bold text-cream transition-colors duration-200 hover:bg-ink"
              >
                {item.label}
              </a>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">{ADDRESS}</p>
        </div>
      </div>
    </section>
  );
}
