import { StaffOnly } from "@/components/staff-only";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Printer, Wifi, Sparkles, Phone, ChevronLeft, Check, Layers, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavRail } from "@/components/front-desk/nav-rail";
import { useStaffIdentity } from "@/hooks/use-staff-identity";
import { supabase } from "@/integrations/supabase/client";
import { OMITTED_ROOM_NUMBERS } from "@/lib/property-layout";
import { guestCheckinUrl } from "@/lib/site";
import logoAsset from "@/assets/days-inn-logo.png.asset.json";

export const Route = createFileRoute("/collateral")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "In-Room Collateral & QR Cards — Days Inn Hub" },
      {
        name: "description",
        content:
          "Printable in-room table tent cards, keycard sleeve inserts, and QR placards for Days Inn Wildwood I-75.",
      },
      { property: "og:title", content: "In-Room Collateral — Days Inn Hub" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CollateralPage,
});

function CollateralPageContent() {
  const { staff } = useStaffIdentity();
  const [selectedFloor, setSelectedFloor] = useState<"all" | "1" | "2" | "single">("all");
  const [singleRoom, setSingleRoom] = useState("214");
  const [format, setFormat] = useState<"tent" | "keycard" | "placard">("tent");
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [allRooms, setAllRooms] = useState<string[]>([]);
  const [roomsLoaded, setRoomsLoaded] = useState(false);

  // The room list is the property's own inventory, not a hardcoded range — a
  // printed card for a room that does not exist is wasted, and a room with no
  // card is a guest who cannot reach the request flow.
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase.from("rooms").select("number").order("number");
      if (!active) return;
      if (error) toast.error("Couldn't load the room list.");
      setAllRooms(
        (data ?? [])
          .map((r) => String(r.number))
          .filter((number) => !OMITTED_ROOM_NUMBERS.has(number)),
      );
      setRoomsLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const floorOne = useMemo(() => allRooms.filter((r) => Number(r) < 200), [allRooms]);
  const floorTwo = useMemo(() => allRooms.filter((r) => Number(r) >= 200), [allRooms]);

  const displayedRooms = useMemo(
    () =>
      selectedFloor === "single"
        ? [singleRoom]
        : selectedFloor === "1"
          ? floorOne
          : selectedFloor === "2"
            ? floorTwo
            : allRooms,
    [selectedFloor, singleRoom, allRooms, floorOne, floorTwo],
  );

  // Generate QR codes for displayed rooms
  useEffect(() => {
    let active = true;
    async function generateQrs() {
      const entries: Record<string, string> = {};
      for (const roomNum of displayedRooms) {
        if (!active) return;
        const url = guestCheckinUrl(roomNum);
        try {
          const dataUrl = await QRCode.toDataURL(url, {
            margin: 1,
            width: 280,
            color: {
              dark: "#00243F",
              light: "#FFFFFF",
            },
          });
          entries[roomNum] = dataUrl;
        } catch {
          // ignore
        }
      }
      if (active) {
        setQrMap(entries);
      }
    }
    void generateQrs();
    return () => {
      active = false;
    };
  }, [displayedRooms]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex min-h-screen bg-[#EEF2F7] text-slate-800 print:bg-white print:p-0">
      {/* Desktop Navigation Rail (hidden during print) */}
      <div className="print:hidden">
        <NavRail current="collateral" staff={staff} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0">
        <div className="mx-auto max-w-6xl">
          {/* Top Controls Header (hidden during print) */}
          <div className="print:hidden flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white p-6 rounded-2xl shadow-xs mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                  In-Room Print Collateral Generator
                </p>
              </div>
              <h1 className="mt-1 font-serif text-2xl font-bold text-[#004986]">
                Guest Hub QR Placards &amp; Cards
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                High-resolution, 300 DPI print-ready table tents and keycard inserts linking to live
                room services.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-xl bg-[#004986] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#004986]/90 active:scale-95"
              >
                <Printer className="h-4 w-4" />
                Print {displayedRooms.length}{" "}
                {format === "tent" ? "Tent Cards" : format === "keycard" ? "Inserts" : "Placards"}
              </Button>
            </div>
          </div>

          {/* Configuration Toolbar (hidden during print) */}
          <div className="print:hidden mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Format Picker */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                1. Collateral Format
              </label>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "tent", label: "Table Tent", sub: "Nightstand" },
                    { id: "keycard", label: "Key Sleeve", sub: "Wallet size" },
                    { id: "placard", label: "Placard", sub: "Wall / Desk" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id)}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      format === item.id
                        ? "border-[#004986] bg-[#E7EDF5] text-[#004986]"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope / Floor Selector */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                2. Select Rooms
              </label>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "all", label: `All rooms (${allRooms.length})` },
                    { id: "1", label: `Ground floor (${floorOne.length})` },
                    { id: "2", label: `Upper floor (${floorTwo.length})` },
                    { id: "single", label: "Single Room" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedFloor(item.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      selectedFloor === item.id
                        ? "bg-[#004986] text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Single Room Input */}
            {selectedFloor === "single" ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  3. Room Number
                </label>
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={singleRoom}
                    onChange={(e) => setSingleRoom(e.target.value)}
                    placeholder="e.g. 214"
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm font-bold text-[#004986]"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* ============================================================ */}
          {/* PRINTABLE CARDS CONTAINER */}
          {/* ============================================================ */}
          <div
            className={`grid gap-8 ${
              format === "keycard"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3 print:gap-4"
                : format === "placard"
                  ? "grid-cols-1 md:grid-cols-2 print:grid-cols-2 print:gap-6"
                  : "grid-cols-1 md:grid-cols-2 print:grid-cols-1 print:gap-12"
            }`}
          >
            {!roomsLoaded ? (
              <p className="text-sm text-slate-500 print:hidden">Loading the room list…</p>
            ) : null}
            {displayedRooms.map((roomNum) => {
              const qrDataUrl = qrMap[roomNum];

              if (format === "keycard") {
                // Keycard Sleeve Insert (3.375" x 2.125" aspect ratio)
                return (
                  <article
                    key={roomNum}
                    className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-[#004986] bg-white p-4 shadow-md print:shadow-none print:border-slate-800 print:break-inside-avoid"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <img
                        src={logoAsset.url}
                        alt="Days Inn"
                        className="h-5 w-auto object-contain"
                      />
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Room</span>
                        <span className="ml-1 font-mono text-base font-bold text-[#004986]">
                          {roomNum}
                        </span>
                      </div>
                    </div>

                    <div className="my-3 flex items-center gap-3">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt={`QR for room ${roomNum}`}
                          className="h-16 w-16 shrink-0 rounded-lg border border-slate-200"
                        />
                      ) : (
                        <div className="h-16 w-16 animate-pulse rounded-lg bg-slate-100" />
                      )}
                      <div>
                        <p className="font-serif text-xs font-bold text-[#004986]">Guest Hub</p>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          Scan to request fresh towels, refresh, or late check-out.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[9px] text-slate-600">
                      <span>
                        Wi-Fi: <strong>Days Inn</strong> · <strong>Sunshine</strong>
                      </span>
                      <span>
                        Front Desk: <strong>(352) 748-7766</strong>
                      </span>
                    </div>
                  </article>
                );
              }

              if (format === "placard") {
                // In-Room Desk / Mirror Placard (5" x 7")
                return (
                  <article
                    key={roomNum}
                    className="relative flex flex-col justify-between rounded-3xl border-2 border-[#004986] bg-[#F5F8FB] p-6 shadow-md print:shadow-none print:bg-white print:border-slate-800 print:break-inside-avoid"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="flex w-20 items-center justify-center rounded-lg bg-white p-1 shadow-2xs border border-slate-200">
                          <img
                            src={logoAsset.url}
                            alt="Days Inn"
                            className="h-6 w-auto object-contain"
                          />
                        </span>
                        <p className="mt-3 text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
                          Days Inn® Wildwood I-75
                        </p>
                        <h2 className="font-serif text-xl font-bold text-[#004986]">
                          Welcome to Your Stay
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Room</span>
                        <p className="font-mono text-4xl font-bold text-[#004986]">{roomNum}</p>
                      </div>
                    </div>

                    <div className="my-6 flex items-center gap-6 rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt={`QR for room ${roomNum}`}
                          className="h-28 w-28 shrink-0 rounded-xl border border-slate-200"
                        />
                      ) : (
                        <div className="h-28 w-28 animate-pulse rounded-xl bg-slate-100" />
                      )}
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0F7B4F]">
                          <Sparkles className="h-3 w-3" /> 10-Min Response Time
                        </span>
                        <h3 className="font-serif text-base font-bold text-[#004986] mt-0.5">
                          Instant In-Room Requests
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Scan with your phone camera to order fresh towels, schedule housekeeping,
                          or message the front desk.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Wifi className="h-4 w-4 text-[#004986]" />
                        <span>
                          Wi-Fi: <strong className="text-slate-900">Days Inn</strong> · password{" "}
                          <strong className="text-slate-900">Sunshine</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 justify-end">
                        <Phone className="h-4 w-4 text-[#004986]" />
                        <span>
                          Dial 0 or <strong>(352) 748-7766</strong>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              }

              // Default: Table Tent Card (Foldable Dual-Sided 4" x 6")
              return (
                <article
                  key={roomNum}
                  className="relative overflow-hidden rounded-3xl border-2 border-[#004986] bg-white p-8 shadow-lg print:shadow-none print:border-slate-800 print:break-inside-avoid print:page-break-after-always"
                >
                  {/* Fold Line Guide for printing */}
                  <div className="hidden print:block absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-300 text-center">
                    <span className="bg-white px-2 text-[9px] font-mono uppercase text-slate-400">
                      --- Fold Here (Table Tent) ---
                    </span>
                  </div>

                  {/* Front Face */}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex w-24 items-center justify-center rounded-xl bg-white p-1.5 shadow-2xs border border-slate-200">
                      <img
                        src={logoAsset.url}
                        alt="Days Inn"
                        className="h-7 w-auto object-contain"
                      />
                    </div>

                    <div className="mt-3">
                      <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase">
                        Days Inn® by Wyndham Wildwood I-75
                      </p>
                      <h2 className="mt-1 font-serif text-2xl font-bold text-[#004986]">
                        Room {roomNum} Guest Hub
                      </h2>
                    </div>

                    <div className="mt-5 rounded-2xl bg-[#F5F8FB] p-4 border border-slate-200 flex flex-col items-center">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt={`QR for room ${roomNum}`}
                          className="h-36 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-xs"
                        />
                      ) : (
                        <div className="h-36 w-36 animate-pulse rounded-xl bg-slate-100" />
                      )}
                      <p className="mt-2.5 text-xs font-bold text-[#004986]">
                        Scan to Access In-Room Services
                      </p>
                    </div>

                    <div className="mt-5 grid w-full grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600">
                      <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Complimentary Wi-Fi
                        </p>
                        <p className="font-bold text-slate-900 mt-0.5">Days Inn</p>
                        <p className="text-[10px] text-slate-500">Password: Sunshine</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Front Desk</p>
                        <p className="font-bold text-slate-900 mt-0.5">(352) 748-7766</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function CollateralPage() {
  return (
    <StaffOnly title="Guest room collateral">
      <CollateralPageContent />
    </StaffOnly>
  );
}
