import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Execute the actual migration against PostgreSQL, with a minimal auth/schema fixture.
// This complements (does not replace) a staging migration/RLS check on Supabase.
const user = "00000000-0000-4000-8000-000000000001";
const actor = "00000000-0000-4000-8000-000000000002";
const room = "00000000-0000-4000-8000-000000000003";
const operation = "00000000-0000-4000-8000-000000000004";
const other = "00000000-0000-4000-8000-000000000005";
let db: PGlite;

async function apply(version = "2026-01-01T00:00:00Z", op = operation, actorId = actor) {
  return db.query<{ outcome: string; current_status: string }>(
    "select * from apply_room_status_change($1, $2, $3, 'vacant_clean', $4, 'Forged name', now())",
    [op, room, version, actorId],
  );
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${user}'::uuid $$;
    CREATE TYPE app_role AS ENUM ('staff', 'manager', 'housekeeper', 'viewer');
    CREATE TYPE room_status AS ENUM ('vacant_dirty', 'vacant_clean', 'occupied', 'occupied_dnd', 'reserved', 'out_of_order');
    CREATE TABLE user_roles (user_id uuid, role app_role);
    CREATE TABLE staff_members (id uuid PRIMARY KEY, user_id uuid, name text, active boolean, is_supervisor boolean DEFAULT false);
    CREATE FUNCTION public.is_supervisor() RETURNS boolean LANGUAGE sql AS $$
      SELECT EXISTS(SELECT 1 FROM staff_members WHERE user_id = auth.uid() AND active AND is_supervisor)
    $$;
    CREATE TABLE rooms (id uuid PRIMARY KEY, number text, status room_status, hk_stage text, updated_at timestamptz, assigned_staff_id uuid);
    CREATE FUNCTION touch_room() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = clock_timestamp(); RETURN NEW; END $$;
    CREATE TRIGGER touch BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION touch_room();
    CREATE TABLE room_status_events (
      operation_id uuid UNIQUE, room_id uuid, room_number text, old_status room_status, new_status room_status,
      staff_member_id uuid, staff_name text, changed_by uuid, previous_changed_at timestamptz,
      duration_seconds integer, is_turnover boolean, changed_at timestamptz
    );
  `);
  await db.exec(
    readFileSync("supabase/migrations/20261018080000_housekeeping_atomic_completion.sql", "utf8"),
  );
}, 30_000);

afterAll(async () => {
  await db?.close();
});

beforeEach(async () => {
  await db.exec(`
    TRUNCATE room_status_events, rooms, staff_members, user_roles;
    INSERT INTO user_roles VALUES ('${user}', 'housekeeper');
    INSERT INTO staff_members VALUES ('${actor}', '${user}', 'Alex', true, false), ('${other}', NULL, 'Sam', true, false);
    INSERT INTO rooms VALUES ('${room}', '108', 'vacant_dirty', 'in_progress', '2026-01-01T00:00:00Z', '${actor}');
  `);
});

describe("atomic housekeeping completion migration", () => {
  it("commits clean status, cleared stage, and canonical audit identity together", async () => {
    expect((await apply()).rows[0]?.outcome).toBe("synced");
    expect((await db.query("select status, hk_stage from rooms")).rows).toEqual([
      { status: "vacant_clean", hk_stage: null },
    ]);
    expect((await db.query("select staff_name, changed_by from room_status_events")).rows).toEqual([
      { staff_name: "Alex", changed_by: user },
    ]);
  });

  it("replays the same operation once, even after its reviewed version is stale", async () => {
    await apply();
    expect((await apply()).rows[0]?.outcome).toBe("synced");
    expect(
      (await db.query("select count(*)::int as count from room_status_events")).rows[0],
    ).toEqual({ count: 1 });
  });

  it("returns the current status when an old successful operation is retried", async () => {
    await apply();
    await db.exec("update rooms set status = 'occupied'");
    expect((await apply()).rows[0]?.current_status).toBe("occupied");
  });

  it("preserves both status and stage when another device changed the version", async () => {
    await db.exec("update rooms set status = 'out_of_order'");
    expect((await apply()).rows[0]?.outcome).toBe("conflict");
    expect((await db.query("select status, hk_stage from rooms")).rows[0]).toEqual({
      status: "out_of_order",
      hk_stage: "in_progress",
    });
    expect((await db.query("select * from room_status_events")).rows).toHaveLength(0);
  });

  it("denies another housekeeper's room and a forged selected identity", async () => {
    await db.exec(`update rooms set assigned_staff_id = '${other}'`);
    await expect(apply()).rejects.toThrow("assigned to another housekeeper");
    await expect(apply(undefined, operation, other)).rejects.toThrow("authorized for this account");
  });

  it("allows managers to attribute work to an active selected staff member", async () => {
    await db.exec("update user_roles set role = 'manager'");
    expect((await apply(undefined, operation, other)).rows[0]?.outcome).toBe("synced");
    expect((await db.query("select staff_name from room_status_events")).rows[0]).toEqual({
      staff_name: "Sam",
    });
  });

  it("denies viewers and inactive actors", async () => {
    await db.exec("update user_roles set role = 'viewer'");
    await expect(apply()).rejects.toThrow("Only operational staff");
    await db.exec(
      "update user_roles set role = 'housekeeper'; update staff_members set active = false",
    );
    await expect(apply()).rejects.toThrow("authorized for this account");
  });

  it("rolls back the room update if the audit insert fails", async () => {
    await db.exec(
      "alter table room_status_events add constraint reject_audit check (duration_seconds < 0)",
    );
    try {
      await expect(apply()).rejects.toThrow();
      expect((await db.query("select status, hk_stage from rooms")).rows[0]).toEqual({
        status: "vacant_dirty",
        hk_stage: "in_progress",
      });
    } finally {
      await db.exec("alter table room_status_events drop constraint reject_audit");
    }
  });
});
