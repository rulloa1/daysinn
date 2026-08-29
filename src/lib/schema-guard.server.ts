/**
 * Startup schema guard.
 *
 * Two invariants are checked once per server process, on the first request:
 *
 *  1. The retired `staff_members.pin` column is really gone from the live
 *     database (a stale environment could still hold staff PINs).
 *  2. The generated Supabase types still describe the live table — every
 *     column the app expects must exist.
 *
 * A mismatch fails fast with an explicit error instead of surfacing later as
 * confusing "column does not exist" runtime failures deep inside a feature.
 */

/** Columns the generated types declare for `public.staff_members`. */
const EXPECTED_STAFF_COLUMNS = [
  "id",
  "name",
  "active",
  "department",
  "sms_phone",
  "sms_alerts",
  "is_supervisor",
  "user_id",
  "created_at",
  "updated_at",
] as const;

/** Columns that must NOT exist anywhere in the schema anymore. */
const FORBIDDEN_COLUMNS: Array<{ table: "staff_members"; column: string }> = [
  { table: "staff_members", column: "pin" },
];

/** Postgres error code PostgREST returns for an unknown column. */
const UNDEFINED_COLUMN = "42703";

let checked: Promise<void> | null = null;

async function runCheck(): Promise<void> {
  const { supabaseAdmin, isSupabaseAdminConfigured } =
    await import("@/integrations/supabase/client.server");

  if (!isSupabaseAdminConfigured) {
    console.warn("Schema guard: admin credentials unavailable, skipping schema verification.");
    return;
  }

  for (const { table, column } of FORBIDDEN_COLUMNS) {
    const { error } = await supabaseAdmin.from(table).select(column).limit(1);
    if (!error) {
      throw new Error(
        `Schema guard: public.${table}.${column} still exists in the database. ` +
          `Staff PINs were retired — apply the migration that drops this column before serving traffic.`,
      );
    }
    if (error.code !== UNDEFINED_COLUMN) {
      // Any other failure (network, permissions) is not proof of drift.
      console.warn(`Schema guard: could not verify ${table}.${column}:`, error.message);
    }
  }

  const { error } = await supabaseAdmin
    .from("staff_members")
    .select(EXPECTED_STAFF_COLUMNS.join(","))
    .limit(1);

  if (error?.code === UNDEFINED_COLUMN) {
    throw new Error(
      `Schema guard: generated Supabase types are out of sync with the live database ` +
        `(public.staff_members). ${error.message}. Regenerate src/integrations/supabase/types.ts.`,
    );
  }
  if (error) {
    console.warn("Schema guard: staff_members verification skipped:", error.message);
  }
}

/** Runs the schema guard once per process. Subsequent calls reuse the result. */
export function assertSchemaIntegrity(): Promise<void> {
  if (!checked) {
    checked = runCheck().catch((error) => {
      // Re-arm so a later request retries after the schema is fixed.
      checked = null;
      throw error;
    });
  }
  return checked;
}
