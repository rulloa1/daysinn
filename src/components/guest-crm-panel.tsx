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

export function GuestCrmPanel({ canEdit }: { canEdit: boolean }) {
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
    try {
      if (id) {
        await updateStay({ data: { id, room_number, check_in, check_out, notes } });
        toast.success("Stay updated.");
      } else {
        await createStay({
          data: { guest_profile_id: guestProfileId, room_number, check_in, check_out, notes },
        });
        toast.success("Stay added.");
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save stay.");
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-blue">Guest CRM</h2>
          <p className="mt-1 text-sm text-slate-500">
            Stay history, preferences, and contact notes.
          </p>
        </div>
        {canEdit ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add guest
              </Button>
            </DialogTrigger>
            <DialogContent className="border-slate-200 bg-white text-slate-800">
              <DialogHeader>
                <DialogTitle className="font-serif font-bold text-brand-blue">
                  Add guest profile
                </DialogTitle>
              </DialogHeader>
              <ProfileForm onSubmit={(form) => saveProfile(form)} />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or phone"
          className="border-slate-200 bg-white pl-10 text-slate-800 placeholder:text-slate-400"
        />
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : profiles.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="font-serif text-xl font-bold text-brand-blue">No guests found</p>
          <p className="mt-1 text-sm text-slate-500">
            {query ? "Try a different search." : "Add a guest profile to start tracking stays."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {profiles.map(({ profile, stays }) => (
            <li
              key={profile.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <User className="h-4 w-4 text-brand-gold" />
                    <span className="font-serif text-xl font-bold text-brand-blue">
                      {profile.name}
                    </span>
                    {stays.length > 0 ? (
                      <Badge className="bg-slate-100 text-slate-800">
                        {stays.length} stay{stays.length === 1 ? "" : "s"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-300 text-slate-500">
                        No stays
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    {profile.email ? <span>{profile.email}</span> : null}
                    {profile.phone ? <span>{profile.phone}</span> : null}
                    {profile.notes ? (
                      <span className="max-w-md truncate">{profile.notes}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-300 bg-transparent text-slate-800 hover:bg-slate-50 hover:text-slate-900"
                        >
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-slate-200 bg-white text-slate-800">
                        <DialogHeader>
                          <DialogTitle className="font-serif font-bold text-brand-blue">
                            Edit guest profile
                          </DialogTitle>
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
                    className="text-slate-500 hover:text-slate-900"
                    onClick={() => toggle(profile.id)}
                  >
                    {expanded[profile.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle stays</span>
                  </Button>
                </div>
              </div>

              {expanded[profile.id] ? (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  {Object.keys(profile.preferences).length > 0 ? (
                    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(profile.preferences).map(([k, v]) => (
                        <div
                          key={k}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <p className="text-xs uppercase tracking-wide text-slate-400">{k}</p>
                          <p className="text-sm text-slate-800">{String(v)}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <h3 className="signage flex items-center gap-2 text-brand-gold">
                      <Calendar className="h-4 w-4" />
                      Stay history
                    </h3>
                    {canEdit ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-300 bg-transparent text-slate-800 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add stay
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-slate-200 bg-white text-slate-800">
                          <DialogHeader>
                            <DialogTitle className="font-serif font-bold text-brand-blue">
                              Add stay
                            </DialogTitle>
                          </DialogHeader>
                          <StayForm onSubmit={(form) => saveStay(form, profile.id)} />
                        </DialogContent>
                      </Dialog>
                    ) : null}
                  </div>

                  {stays.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">No stays recorded yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {stays
                        .slice()
                        .sort(
                          (a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime(),
                        )
                        .map((stay) => (
                          <li
                            key={stay.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <div className="flex items-center gap-3 text-sm">
                              <BedDouble className="h-4 w-4 text-slate-400" />
                              <span className="font-mono text-lg font-bold text-brand-blue tabular-nums">
                                {stay.room_number}
                              </span>
                              <span className="text-slate-500">{stay.check_in}</span>
                              {stay.check_out ? (
                                <span className="text-slate-400">→ {stay.check_out}</span>
                              ) : (
                                <span className="text-slate-400">→ present</span>
                              )}
                              {stay.notes ? (
                                <span className="text-slate-600">· {stay.notes}</span>
                              ) : null}
                            </div>
                            {canEdit ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-slate-500 hover:text-slate-900"
                                  >
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="border-slate-200 bg-white text-slate-800">
                                  <DialogHeader>
                                    <DialogTitle className="font-serif font-bold text-brand-blue">
                                      Edit stay
                                    </DialogTitle>
                                  </DialogHeader>
                                  <StayForm
                                    stay={stay}
                                    onSubmit={(form) => saveStay(form, profile.id, stay.id)}
                                  />
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
        <Input
          id="name"
          name="name"
          defaultValue={profile?.name}
          required
          className="border-slate-200 bg-white text-slate-800"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={profile?.email ?? ""}
            className="border-slate-200 bg-white text-slate-800"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={profile?.phone ?? ""}
            className="border-slate-200 bg-white text-slate-800"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferences">Preferences (one per line, key: value)</Label>
        <textarea
          id="preferences"
          name="preferences"
          defaultValue={
            profile
              ? Object.entries(profile.preferences)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join("\n")
              : ""
          }
          rows={3}
          className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={profile?.notes ?? ""}
          rows={2}
          className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400"
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold/90"
      >
        {profile ? "Save changes" : "Create profile"}
      </Button>
    </form>
  );
}

function StayForm({ stay, onSubmit }: { stay?: GuestStay; onSubmit: (form: FormData) => void }) {
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
        <Input
          id="room_number"
          name="room_number"
          defaultValue={stay?.room_number}
          required
          className="border-slate-200 bg-white text-slate-800"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="check_in">Check-in</Label>
          <Input
            id="check_in"
            name="check_in"
            type="date"
            defaultValue={stay?.check_in}
            required
            className="border-slate-200 bg-white text-slate-800"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="check_out">Check-out</Label>
          <Input
            id="check_out"
            name="check_out"
            type="date"
            defaultValue={stay?.check_out ?? ""}
            className="border-slate-200 bg-white text-slate-800"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={stay?.notes ?? ""}
          rows={2}
          className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400"
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold/90"
      >
        {stay ? "Save changes" : "Add stay"}
      </Button>
    </form>
  );
}
