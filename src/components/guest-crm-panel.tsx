import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  searchGuestProfiles,
  listGuestProfiles,
  createGuestProfile,
  updateGuestProfile,
  addGuestStay,
  updateGuestStay,
  type GuestProfile,
  type GuestStay,
} from "@/lib/guest-crm.functions";
import { Search, Plus, Calendar, BedDouble, ChevronDown, ChevronUp, User } from "lucide-react";

type ProfileWithStays = { profile: GuestProfile; stays: GuestStay[] };

const DEMO_PROFILES: ProfileWithStays[] = [
  {
    profile: {
      id: "demo-guest-1",
      name: "M. Alvarez",
      email: "m.alvarez@example.com",
      phone: "352-555-0142",
      preferences: { floor: "2", late_checkout: true, newspaper: false },
      notes: "Returning guest, prefers quiet room away from elevator.",
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    stays: [
      { id: "demo-stay-1", guest_profile_id: "demo-guest-1", room_number: "214", check_in: "2026-08-20", check_out: "2026-08-22", notes: "Anniversary weekend", created_at: "", updated_at: "" },
      { id: "demo-stay-2", guest_profile_id: "demo-guest-1", room_number: "118", check_in: "2025-11-03", check_out: "2025-11-05", notes: "", created_at: "", updated_at: "" },
    ],
  },
  {
    profile: {
      id: "demo-guest-2",
      name: "J. Whitfield",
      email: null,
      phone: "407-555-0198",
      preferences: { pillows: "firm", smoking: false },
      notes: "Business traveler, early riser.",
      created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    },
    stays: [
      { id: "demo-stay-3", guest_profile_id: "demo-guest-2", room_number: "118", check_in: "2026-08-18", check_out: "2026-08-21", notes: "Maintenance call on AC", created_at: "", updated_at: "" },
    ],
  },
];

export function GuestCrmPanel({ canEdit, demo = false }: { canEdit: boolean; demo?: boolean }) {
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileWithStays[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const search = useServerFn(searchGuestProfiles);
  const list = useServerFn(listGuestProfiles);
  const createProfile = useServerFn(createGuestProfile);
  const updateProfile = useServerFn(updateGuestProfile);
  const createStay = useServerFn(addGuestStay);
  const updateStay = useServerFn(updateGuestStay);

  async function load() {
    setLoading(true);
    if (demo) {
      const q = query.trim().toLowerCase();
      const data = q
        ? DEMO_PROFILES.filter(
            (p) =>
              p.profile.name.toLowerCase().includes(q) ||
              (p.profile.email?.toLowerCase().includes(q) ?? false) ||
              (p.profile.phone?.toLowerCase().includes(q) ?? false),
          )
        : DEMO_PROFILES;
      setProfiles(data);
      setLoading(false);
      return;
    }
    try {
      const data = query.trim()
        ? await search({ data: { query: query.trim(), limit: 20 } })
        : await list({ data: { limit: 50 } });
      setProfiles(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't load guest profiles.");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function saveProfile(form: FormData, id?: string) {
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();
    const prefsText = String(form.get("preferences") ?? "").trim();
    const preferences: Record<string, string | number | boolean | null> = {};
    if (prefsText) {
      for (const line of prefsText.split(/\n|,/)) {
        const [k, ...rest] = line.split(/[:=]/);
        if (k?.trim()) {
          const v = rest.join("=").trim();
          preferences[k.trim()] = v === "true" ? true : v === "false" ? false : v || null;
        }
      }
    }
    if (!name) {
      toast.error("Name is required.");
      return;
    }
    if (demo) {
      toast.success("Demo mode — profile changes are not saved.");
      return;
    }
    try {
      if (id) {
        await updateProfile({ data: { id, name, email, phone, preferences, notes } });
        toast.success("Profile updated.");
      } else {
        await createProfile({ data: { name, email, phone, preferences, notes } });
        toast.success("Profile created.");
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save profile.");
    }
  }

  async function saveStay(form: FormData, guestProfileId: string, id?: string) {
    const room_number = String(form.get("room_number") ?? "").trim();
    const check_in = String(form.get("check_in") ?? "").trim();
    const check_out = String(form.get("check_out") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();
    if (!room_number || !check_in) {
      toast.error("Room number and check-in date are required.");
      return;
    }
    if (demo) {
      toast.success("Demo mode — stay changes are not saved.");
      return;
    }
    try {
      if (id) {
        await updateStay({ data: { id, room_number, check_in, check_out, notes } });
        toast.success("Stay updated.");
      } else {
        await createStay({ data: { guest_profile_id: guestProfileId, room_number, check_in, check_out, notes } });
        toast.success("Stay added.");
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save stay.");
    }
  }

  return (
    <section className="mt-10 border border-cream/15 bg-cream/[0.04] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">Guest CRM</h2>
          <p className="mt-1 text-sm text-cream/60">Stay history, preferences, and contact notes.</p>
        </div>
        {canEdit ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-amber text-ink hover:bg-amber/90">
                <Plus className="mr-2 h-4 w-4" />
                Add guest
              </Button>
            </DialogTrigger>
            <DialogContent className="border-cream/15 bg-ink text-cream">
              <DialogHeader>
                <DialogTitle className="text-cream">Add guest profile</DialogTitle>
              </DialogHeader>
              <ProfileForm onSubmit={(form) => saveProfile(form)} />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or phone"
          className="border-cream/15 bg-cream/[0.04] pl-10 text-cream placeholder:text-cream/40"
        />
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-cream/50">Loading…</p>
      ) : profiles.length === 0 ? (
        <div className="mt-6 border border-dashed border-cream/20 p-8 text-center">
          <p className="font-display text-xl">No guests found</p>
          <p className="mt-1 text-sm text-cream/50">
            {query ? "Try a different search." : "Add a guest profile to start tracking stays."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {profiles.map(({ profile, stays }) => (
            <li key={profile.id} className="border border-cream/15 bg-ink p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <User className="h-4 w-4 text-amber" />
                    <span className="font-display text-xl">{profile.name}</span>
                    {stays.length > 0 ? (
                      <Badge className="bg-cream/15 text-cream">{stays.length} stay{stays.length === 1 ? "" : "s"}</Badge>
                    ) : (
                      <Badge variant="outline" className="border-cream/25 text-cream/60">No stays</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-cream/60">
                    {profile.email ? <span>{profile.email}</span> : null}
                    {profile.phone ? <span>{profile.phone}</span> : null}
                    {profile.notes ? <span className="max-w-md truncate">{profile.notes}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-cream/15 bg-ink text-cream">
                        <DialogHeader>
                          <DialogTitle className="text-cream">Edit guest profile</DialogTitle>
                        </DialogHeader>
                        <ProfileForm
                          profile={profile}
                          onSubmit={(form) => saveProfile(form, profile.id)}
                        />
                      </DialogContent>
                    </Dialog>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-cream/60 hover:text-cream"
                    onClick={() => toggle(profile.id)}
                  >
                    {expanded[profile.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span className="sr-only">Toggle stays</span>
                  </Button>
                </div>
              </div>

              {expanded[profile.id] ? (
                <div className="mt-4 border-t border-cream/10 pt-4">
                  {Object.keys(profile.preferences).length > 0 ? (
                    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(profile.preferences).map(([k, v]) => (
                        <div key={k} className="rounded border border-cream/10 bg-cream/[0.03] px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-cream/40">{k}</p>
                          <p className="text-sm text-cream">{String(v)}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <h3 className="signage flex items-center gap-2 text-cream/70">
                      <Calendar className="h-4 w-4" />
                      Stay history
                    </h3>
                    {canEdit ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream">
                            <Plus className="mr-1 h-3 w-3" />
                            Add stay
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-cream/15 bg-ink text-cream">
                          <DialogHeader>
                            <DialogTitle className="text-cream">Add stay</DialogTitle>
                          </DialogHeader>
                          <StayForm onSubmit={(form) => saveStay(form, profile.id)} />
                        </DialogContent>
                      </Dialog>
                    ) : null}
                  </div>

                  {stays.length === 0 ? (
                    <p className="mt-3 text-sm text-cream/50">No stays recorded yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {stays
                        .slice()
                        .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime())
                        .map((stay) => (
                          <li key={stay.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-cream/10 bg-cream/[0.03] px-3 py-2">
                            <div className="flex items-center gap-3 text-sm">
                              <BedDouble className="h-4 w-4 text-cream/40" />
                              <span className="font-display text-lg tabular-nums">{stay.room_number}</span>
                              <span className="text-cream/60">{stay.check_in}</span>
                              {stay.check_out ? <span className="text-cream/40">→ {stay.check_out}</span> : <span className="text-cream/40">→ present</span>}
                              {stay.notes ? <span className="text-cream/70">· {stay.notes}</span> : null}
                            </div>
                            {canEdit ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-cream/60 hover:text-cream">
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="border-cream/15 bg-ink text-cream">
                                  <DialogHeader>
                                    <DialogTitle className="text-cream">Edit stay</DialogTitle>
                                  </DialogHeader>
                                  <StayForm stay={stay} onSubmit={(form) => saveStay(form, profile.id, stay.id)} />
                                </DialogContent>
                              </Dialog>
                            ) : null}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProfileForm({
  profile,
  onSubmit,
}: {
  profile?: GuestProfile;
  onSubmit: (form: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
        setOpen(false);
      }}
      className="mt-2 space-y-4"
    >
      <input type="hidden" name="open" value={String(open)} readOnly />
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={profile?.name} required className="border-cream/15 bg-cream/[0.04] text-cream" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={profile?.email ?? ""} className="border-cream/15 bg-cream/[0.04] text-cream" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} className="border-cream/15 bg-cream/[0.04] text-cream" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferences">Preferences (one per line, key: value)</Label>
        <textarea
          id="preferences"
          name="preferences"
          defaultValue={profile ? Object.entries(profile.preferences).map(([k, v]) => `${k}: ${v}`).join("\n") : ""}
          rows={3}
          className="w-full rounded-md border border-cream/15 bg-cream/[0.04] p-3 text-sm text-cream placeholder:text-cream/40"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={profile?.notes ?? ""}
          rows={2}
          className="w-full rounded-md border border-cream/15 bg-cream/[0.04] p-3 text-sm text-cream placeholder:text-cream/40"
        />
      </div>
      <Button type="submit" className="w-full bg-amber text-ink hover:bg-amber/90">
        {profile ? "Save changes" : "Create profile"}
      </Button>
    </form>
  );
}

function StayForm({
  stay,
  onSubmit,
}: {
  stay?: GuestStay;
  onSubmit: (form: FormData) => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="mt-2 space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="room_number">Room number</Label>
        <Input id="room_number" name="room_number" defaultValue={stay?.room_number} required className="border-cream/15 bg-cream/[0.04] text-cream" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="check_in">Check-in</Label>
          <Input id="check_in" name="check_in" type="date" defaultValue={stay?.check_in} required className="border-cream/15 bg-cream/[0.04] text-cream" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="check_out">Check-out</Label>
          <Input id="check_out" name="check_out" type="date" defaultValue={stay?.check_out ?? ""} className="border-cream/15 bg-cream/[0.04] text-cream" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={stay?.notes ?? ""}
          rows={2}
          className="w-full rounded-md border border-cream/15 bg-cream/[0.04] p-3 text-sm text-cream placeholder:text-cream/40"
        />
      </div>
      <Button type="submit" className="w-full bg-amber text-ink hover:bg-amber/90">
        {stay ? "Save changes" : "Add stay"}
      </Button>
    </form>
  );
}
