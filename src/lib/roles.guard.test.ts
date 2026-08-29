import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { PasswordResetRequiredError } from "./password-policy";
import { assertHousekeeperOrStaff, assertManager, assertStaff } from "./roles.guard";

type TableResult = { data: unknown; error: unknown };

const PENDING_RESET: TableResult = { data: { user_id: "u1" }, error: null };
const NO_RESET: TableResult = { data: null, error: null };

/**
 * Minimal PostgREST-shaped double: every filter returns the builder, and the
 * builder resolves either through `.maybeSingle()` or by being awaited directly.
 */
function fakeSupabase(results: Record<string, TableResult>) {
  const tablesQueried: string[] = [];

  const client = {
    from(table: string) {
      tablesQueried.push(table);
      const result = results[table] ?? { data: null, error: null };
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        is: () => builder,
        maybeSingle: async () => result,
        then: (resolve: (value: TableResult) => unknown) => resolve(result),
      };
      return builder;
    },
  };

  return { client: client as unknown as SupabaseClient, tablesQueried };
}

/**
 * Regression cover for the forced-reset bypass.
 *
 * Enforcement used to live only in `PasswordResetGate`, a React component, so a
 * flagged account could call server functions directly and keep working. The
 * guards now own it, which is why these assert on the *guards* rather than the UI.
 */
describe("role guards and pending password resets", () => {
  it("refuses a staff member who still owes a password reset", async () => {
    const { client, tablesQueried } = fakeSupabase({
      password_reset_requirements: PENDING_RESET,
      user_roles: { data: [{ role: "staff" }], error: null },
    });

    await expect(assertStaff(client, "u1")).rejects.toBeInstanceOf(PasswordResetRequiredError);

    // Short-circuits before the role lookup, so a valid role cannot mask it.
    expect(tablesQueried).toEqual(["password_reset_requirements"]);
  });

  it("refuses a manager who still owes a password reset", async () => {
    const { client } = fakeSupabase({
      password_reset_requirements: PENDING_RESET,
      user_roles: { data: { role: "manager" }, error: null },
    });

    await expect(assertManager(client, "u1")).rejects.toBeInstanceOf(PasswordResetRequiredError);
  });

  it("refuses a housekeeper who still owes a password reset", async () => {
    const { client } = fakeSupabase({
      password_reset_requirements: PENDING_RESET,
      user_roles: { data: [{ role: "housekeeper" }], error: null },
    });

    await expect(assertHousekeeperOrStaff(client, "u1")).rejects.toBeInstanceOf(
      PasswordResetRequiredError,
    );
  });

  it("lets a staff member through once the requirement is completed", async () => {
    const { client, tablesQueried } = fakeSupabase({
      password_reset_requirements: NO_RESET,
      user_roles: { data: [{ role: "staff" }], error: null },
    });

    await expect(assertStaff(client, "u1")).resolves.toBeUndefined();
    expect(tablesQueried).toEqual(["password_reset_requirements", "user_roles"]);
  });

  it("fails closed when the reset requirement cannot be read", async () => {
    const { client } = fakeSupabase({
      password_reset_requirements: { data: null, error: { message: "Database unavailable" } },
      user_roles: { data: [{ role: "staff" }], error: null },
    });

    await expect(assertStaff(client, "u1")).rejects.toThrow("Could not verify the password status");
  });

  it("still rejects an unauthenticated caller before touching the database", async () => {
    const { client, tablesQueried } = fakeSupabase({});

    await expect(assertStaff(client, null)).rejects.toThrow("Authentication required");
    expect(tablesQueried).toEqual([]);
  });
});
