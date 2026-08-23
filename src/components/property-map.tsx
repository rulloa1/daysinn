import { useState } from "react";
import {
  MapPin,
  Maximize2,
  Navigation,
  Compass,
  Sparkles,
  Waves,
  Coffee,
  Truck,
  Car,
  Search,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const LAT = 28.872883;
const LNG = -82.093933;
const ADDRESS = "551 East SR 44, Wildwood, FL 34785";
const MAP_IMAGE = "/assets/days-inn-property-map.jpg";

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

const AMENITIES = [
  {
    icon: Waves,
    title: "Outdoor Heated Pool",
    desc: "Located in the central courtyard with sun deck lounge chairs.",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: Coffee,
    title: "Lobby & Daybreak® Breakfast",
    desc: "Main front entrance, morning breakfast, 24/7 coffee & registration.",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: Truck,
    title: "Truck & RV Parking",
    desc: "Oversized vehicle and trailer parking along North, East & South perimeters.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: Car,
    title: "Guest Room Parking",
    desc: "Direct parking bays in front of all ground & second floor walkways.",
    color: "text-indigo-500 bg-indigo-500/10",
  },
];

function getRoomLocation(roomNum: string) {
  const num = parseInt(roomNum.trim(), 10);
  if (isNaN(num)) return null;

  const isSecondFloor = num >= 200 && num < 300;
  const isFirstFloor = num >= 100 && num < 200;

  if (!isFirstFloor && !isSecondFloor) return null;

  // Check specific wings
  if ((num >= 201 && num <= 209 && num % 2 !== 0) || (num >= 200 && num <= 208 && num % 2 === 0)) {
    return {
      wing: "Main Lobby & Registration Wing",
      floor: isSecondFloor ? "Floor 2 (Upper)" : "Floor 1 (Ground)",
      view: "Front Entrance & Walkway",
      stairs: "Lobby central stairs / breezeway",
      parking: "Front Lobby & North Parking",
    };
  }

  if ((num >= 110 && num <= 135) || (num >= 210 && num <= 235)) {
    const isCourtyard = num % 2 !== 0; // Odd numbers face pool/courtyard
    return {
      wing: "West Building Wing",
      floor: isSecondFloor ? "Floor 2 (Upper)" : "Floor 1 (Ground)",
      view: isCourtyard ? "Courtyard & Heated Pool View" : "West Outer Parking View",
      stairs: num <= 117 || num <= 217 ? "North Breezeway Stairs" : "Center Breezeway Stairs",
      parking: "West Parking Lot",
    };
  }

  if ((num >= 136 && num <= 163) || (num >= 236 && num <= 265)) {
    const isCourtyard = num % 2 === 0; // Even numbers face pool/courtyard
    return {
      wing: "South Building Wing",
      floor: isSecondFloor ? "Floor 2 (Upper)" : "Floor 1 (Ground)",
      view: isCourtyard ? "Courtyard & Heated Pool View" : "South Perimeter / Truck Parking View",
      stairs: "South East Stairs & Center Breezeway",
      parking: "Center Courtyard & South Parking Lots",
    };
  }

  return {
    wing: "Guest Rooms Wing",
    floor: isSecondFloor ? "Floor 2 (Upper)" : "Floor 1 (Ground)",
    view: "Property Walkway",
    stairs: "Nearest marked breezeway stairs",
    parking: "Surrounding Guest Parking",
  };
}

export function PropertyMap() {
  const [searchRoom, setSearchRoom] = useState("");
  const [foundLocation, setFoundLocation] = useState<ReturnType<typeof getRoomLocation> | null>(
    null,
  );
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRoom.trim()) {
      setFoundLocation(null);
      setHasSearched(false);
      return;
    }
    const loc = getRoomLocation(searchRoom);
    setFoundLocation(loc);
    setHasSearched(true);
  };

  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg">
      {/* Header Bar */}
      <div className="border-b border-border/70 bg-muted/40 px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <Compass className="h-4 w-4" />
              </span>
              <span className="signage text-accent font-bold">Property Layout & Directory</span>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold text-foreground md:text-3xl">
              Days Inn® Wildwood Site Map
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              551 East SR 44, Wildwood, FL 34785 · Just off I-75 Exit 329
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="spring-hover rounded-xl border-border/80 bg-background text-xs font-semibold shadow-sm"
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  Full Screen Map
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl border-border bg-card p-4">
                <DialogHeader className="mb-2">
                  <DialogTitle className="font-serif text-xl font-bold">
                    Days Inn® by Wyndham Wildwood — Architectural Site Map
                  </DialogTitle>
                </DialogHeader>
                <div className="overflow-hidden rounded-2xl border border-border bg-muted/20">
                  <img
                    src={MAP_IMAGE}
                    alt="Days Inn Wildwood Architectural Site Map"
                    className="h-auto w-full object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
        {/* Visual Map Display */}
        <div className="relative min-h-[22rem] bg-slate-950/5 p-4 md:p-6">
          <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-md">
            <img
              src={MAP_IMAGE}
              alt="Days Inn Wildwood Property Site Map"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />

            {/* Quick Map Overlay Pill */}
            <div className="absolute top-3 left-3 rounded-full bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              📍 You Are Here: Lobby & Registration
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Click to enlarge site map"
                  className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-xl bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-900"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Enlarge Map
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl border-border bg-card p-4">
                <DialogHeader className="mb-2">
                  <DialogTitle className="font-serif text-xl font-bold">
                    Days Inn® by Wyndham Wildwood — Architectural Site Map
                  </DialogTitle>
                </DialogHeader>
                <div className="overflow-hidden rounded-2xl border border-border bg-muted/20">
                  <img
                    src={MAP_IMAGE}
                    alt="Days Inn Wildwood Architectural Site Map"
                    className="h-auto w-full object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Interactive Room Locator */}
          <div className="mt-4 rounded-2xl border border-border/80 bg-background/90 p-4 shadow-sm backdrop-blur-md">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Find your room (e.g. 214, 142, 201)..."
                  value={searchRoom}
                  onChange={(e) => setSearchRoom(e.target.value)}
                  className="rounded-xl border-border pl-9 text-xs"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="spring-hover rounded-xl bg-accent font-bold text-accent-foreground shadow-sm"
              >
                Locate Room
              </Button>
            </form>

            {hasSearched && (
              <div className="mt-3 rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
                {foundLocation ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Room {searchRoom.trim()} — {foundLocation.wing}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Level:</span>{" "}
                        {foundLocation.floor}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">View:</span>{" "}
                        {foundLocation.view}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Nearest Stairs:</span>{" "}
                        {foundLocation.stairs}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Parking Area:</span>{" "}
                        {foundLocation.parking}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <HelpCircle className="h-4 w-4 text-amber-500" />
                    Room number not recognized. Rooms range from 108–163 (Floor 1) and 200–265
                    (Floor 2).
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Directory & Driving Directions */}
        <div className="flex flex-col justify-between border-t border-border/80 p-6 lg:border-t-0 lg:border-l md:p-8">
          <div>
            <span className="signage text-accent font-bold">Property Directory</span>
            <h3 className="mt-1 font-serif text-lg font-bold text-foreground">Key Amenities</h3>

            <div className="mt-4 space-y-3">
              {AMENITIES.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="font-serif text-xs font-bold text-foreground">{item.title}</h4>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-border/70 pt-5">
            <span className="signage text-primary font-bold">Turn-by-Turn GPS</span>
            <h4 className="mt-1 font-serif text-sm font-bold text-foreground">
              Open Navigation in App
            </h4>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {DIRECTIONS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="spring-hover inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs font-bold text-foreground shadow-sm hover:border-primary/40 hover:bg-primary/5"
                >
                  <Navigation className="h-3 w-3 text-primary" />
                  {item.label}
                </a>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              📍 {ADDRESS} · Free on-site parking for all guests
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
