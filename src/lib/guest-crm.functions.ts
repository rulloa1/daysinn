import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type GuestProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  preferences: Record<string, string | number | boolean | null>;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type GuestStay = {
  id: string;
  guest_profile_id: string;
  room_number: string;
  check_in: string;
  check_out: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type PreferencesMap = Record<string, string | number | boolean | null>;

function parsePreferences(value: unknown): PreferencesMap {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out: PreferencesMap = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        out[k] = v;
      } else {
        out[k] = String(v);
      }
    }
    return out;
  }
  return {};
}

function toJsonPreferences(
  value: PreferencesMap,
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = v;
  }
  return out;
}

function toProfile(row: Record<string, unknown>): GuestProfile {
  return {
    id: String(row["id"]),
    name: String(row["name"]),
    email: row["email"] ? String(row["email"]) : null,
    phone: row["phone"] ? String(row["phone"]) : null,
    preferences: parsePreferences(row["preferences"]),
    notes: row["notes"] ? String(row["notes"]) : null,
    created_at: String(row["created_at"]),
    updated_at: String(row["updated_at"]),
  };
}

function toStay(row: Record<string, unknown>): GuestStay {
  return {
    id: String(row["id"]),
    guest_profile_id: String(row["guest_profile_id"]),
    room_number: String(row["room_number"]),
    check_in: String(row["check_in"]),
    check_out: row["check_out"] ? String(row["check_out"]) : null,
    notes: row["notes"] ? String(row["notes"]) : null,
    created_at: String(row["created_at"]),
    updated_at: String(row["updated_at"]),
  };
}

export const searchGuestProfiles = createServerFn({ method: "GET" })
  .validator((input) =>
    z
      .object({
        query: z.string().trim().min(1).max(100),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const q = `%${data.query}%`;
    const { data: rows, error } = await context.supabase
      .from("guest_profiles")
      .select("*, guest_stays(*)")
      .or(`name.ilike.${q}, email.ilike.${q}, phone.ilike.${q}`)
      .order("updated_at", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(error.message);

    return (rows ?? []).map((row: Record<string, unknown>) => ({
      profile: toProfile(row),
      stays: ((row["guest_stays"] ?? []) as Record<string, unknown>[]).map(toStay),
    }));
  });

export const listGuestProfiles = createServerFn({ method: "GET" })
  .validator((input) =>
    z
      .object({
        limit: z.coerce.number().int().min(1).max(100).default(50),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("guest_profiles")
      .select("*, guest_stays(*)")
      .order("updated_at", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(error.message);

    return (rows ?? []).map((row: Record<string, unknown>) => ({
      profile: toProfile(row),
      stays: ((row["guest_stays"] ?? []) as Record<string, unknown>[]).map(toStay),
    }));
  });

export const getGuestProfile = createServerFn({ method: "GET" })
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("guest_profiles")
      .select("*, guest_stays(*)")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) return null;

    return {
      profile: toProfile(row),
      stays: ((row["guest_stays"] ?? []) as Record<string, unknown>[]).map(toStay),
    };
  });

export const createGuestProfile = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email().optional().or(z.literal("")),
        phone: z.string().trim().max(30).optional().or(z.literal("")),
        preferences: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
          .default({}),
        notes: z.string().trim().max(2000).optional().or(z.literal("")),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("guest_profiles")
      .insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        preferences: toJsonPreferences(data.preferences),
        notes: data.notes || null,
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Profile was not created.");
    return toProfile(row);
  });

export const updateGuestProfile = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email().optional().or(z.literal("")),
        phone: z.string().trim().max(30).optional().or(z.literal("")),
        preferences: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
          .default({}),
        notes: z.string().trim().max(2000).optional().or(z.literal("")),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("guest_profiles")
      .update({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        preferences: toJsonPreferences(data.preferences),
        notes: data.notes || null,
      })
      .eq("id", data.id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Profile not found or access denied.");
    return toProfile(row);
  });

export const addGuestStay = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        guest_profile_id: z.string().uuid(),
        room_number: z.string().trim().min(1).max(10),
        check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        check_out: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .or(z.literal("")),
        notes: z.string().trim().max(2000).optional().or(z.literal("")),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("guest_stays")
      .insert({
        guest_profile_id: data.guest_profile_id,
        room_number: data.room_number,
        check_in: data.check_in,
        check_out: data.check_out || null,
        notes: data.notes || null,
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Stay was not created.");
    return toStay(row);
  });

export const updateGuestStay = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        id: z.string().uuid(),
        room_number: z.string().trim().min(1).max(10),
        check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        check_out: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .or(z.literal("")),
        notes: z.string().trim().max(2000).optional().or(z.literal("")),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("guest_stays")
      .update({
        room_number: data.room_number,
        check_in: data.check_in,
        check_out: data.check_out || null,
        notes: data.notes || null,
      })
      .eq("id", data.id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) throw new Error("Stay not found or access denied.");
    return toStay(row);
  });
