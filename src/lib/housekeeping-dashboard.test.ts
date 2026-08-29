import { describe, expect, it } from "vitest";
import { buildingForRoom, isDndActive, isExtendedStay, toRoomStatus } from "./room-model";
import { assertHousekeeperOrStaff, assertStaff } from "./roles.guard";

describe("Housekeeping property layout & building grouping", () => {
  it("correctly maps room numbers to Main Building, Building 2, and Building 3", () => {
    // Main Building: 108-117, 208-217, upstairs 200-209
    expect(buildingForRoom("108")).toBe("Main Building");
    expect(buildingForRoom("117")).toBe("Main Building");
    expect(buildingForRoom("200")).toBe("Main Building");
    expect(buildingForRoom("201")).toBe("Main Building");
    expect(buildingForRoom("208")).toBe("Main Building");
    expect(buildingForRoom("217")).toBe("Main Building");

    // Building 2: 118-135, 218-235 (laundry / facilities)
    expect(buildingForRoom("118")).toBe("Building 2");
    expect(buildingForRoom("135")).toBe("Building 2");
    expect(buildingForRoom("218")).toBe("Building 2");
    expect(buildingForRoom("235")).toBe("Building 2");

    // Building 3: 136-163, 236-265 (pool / courtyard / rear wing)
    expect(buildingForRoom("136")).toBe("Building 3");
    expect(buildingForRoom("163")).toBe("Building 3");
    expect(buildingForRoom("236")).toBe("Building 3");
    expect(buildingForRoom("265")).toBe("Building 3");
  });
});

describe("DND and Extended Stay logic", () => {
  it("evaluates DND independent of status string", () => {
    expect(isDndActive({ dnd: true, status: "occupied" })).toBe(true);
    expect(isDndActive({ dnd: false, status: "occupied_dnd" })).toBe(true);
    expect(isDndActive({ dnd: false, status: "DND" })).toBe(true);
    expect(isDndActive({ dnd: false, status: "vacant_clean" })).toBe(false);
    expect(isDndActive({ dnd: null, status: "occupied" })).toBe(false);
  });

  it("evaluates Extended Stay via boolean flag or date comparison", () => {
    // Explicit flag
    expect(isExtendedStay({ extended_stay: true })).toBe(true);

    // Date pushed later than original checkout
    expect(
      isExtendedStay({
        extended_stay: false,
        original_check_out: "2026-08-27",
        check_out: "2026-08-30",
      }),
    ).toBe(true);

    // Same date / not extended
    expect(
      isExtendedStay({
        extended_stay: false,
        original_check_out: "2026-08-27",
        check_out: "2026-08-27",
      }),
    ).toBe(false);

    // Missing original checkout date
    expect(
      isExtendedStay({
        extended_stay: false,
        check_out: "2026-08-30",
      }),
    ).toBe(false);
  });

  it("derives domain RoomStatus with DND and Stayover priority", () => {
    expect(
      toRoomStatus({
        id: "1",
        number: "110",
        floor: 1,
        status: "occupied",
        dnd: true,
      }),
    ).toBe("DND");

    expect(
      toRoomStatus({
        id: "2",
        number: "112",
        floor: 1,
        status: "occupied",
        extended_stay: true,
      }),
    ).toBe("Stayover");
  });
});

describe("Role-based access restrictions", () => {
  // The guards check `password_reset_requirements` before any role lookup, so
  // the double has to answer for both tables. `pendingReset` defaults to false;
  // the dedicated cover for a pending requirement lives in roles.guard.test.ts.
  function createMockSupabase(roles: string[], pendingReset = false) {
    const resetChain = {
      eq: () => resetChain,
      is: () => resetChain,
      maybeSingle: async () => ({
        data: pendingReset ? { user_id: "user-123" } : null,
        error: null,
      }),
    };

    const roleChain = {
      eq: (_col: string, _val: string) => ({
        eq: (_c: string, roleVal: string) => ({
          maybeSingle: async () => ({
            data: roles.includes(roleVal) ? { role: roleVal } : null,
          }),
        }),
        in: (_c: string, allowed: string[]) => {
          const matched = roles.filter((r) => allowed.includes(r));
          return Promise.resolve({
            data: matched.map((r) => ({ role: r })),
          });
        },
      }),
    };

    return {
      from: (table: string) => ({
        select: (_columns: string) =>
          table === "password_reset_requirements" ? resetChain : roleChain,
      }),
    } as unknown as Parameters<typeof assertStaff>[0];
  }

  it("assertStaff blocks users with only housekeeper role", async () => {
    const mockHousekeeperClient = createMockSupabase(["housekeeper"]);
    await expect(assertStaff(mockHousekeeperClient, "user-123")).rejects.toThrow("Forbidden");
  });

  it("assertStaff allows staff and manager roles", async () => {
    const mockStaffClient = createMockSupabase(["staff"]);
    await expect(assertStaff(mockStaffClient, "user-456")).resolves.toBeUndefined();

    const mockManagerClient = createMockSupabase(["manager"]);
    await expect(assertStaff(mockManagerClient, "user-789")).resolves.toBeUndefined();
  });

  it("assertHousekeeperOrStaff allows housekeeper, staff, and manager", async () => {
    const mockHkClient = createMockSupabase(["housekeeper"]);
    await expect(assertHousekeeperOrStaff(mockHkClient, "user-123")).resolves.toBeUndefined();

    const mockStaffClient = createMockSupabase(["staff"]);
    await expect(assertHousekeeperOrStaff(mockStaffClient, "user-456")).resolves.toBeUndefined();

    const mockManagerClient = createMockSupabase(["manager"]);
    await expect(assertHousekeeperOrStaff(mockManagerClient, "user-789")).resolves.toBeUndefined();
  });

  it("assertHousekeeperOrStaff rejects viewer or unassigned users", async () => {
    const mockViewerClient = createMockSupabase(["viewer"]);
    await expect(assertHousekeeperOrStaff(mockViewerClient, "user-000")).rejects.toThrow(
      "Forbidden",
    );
  });
});
