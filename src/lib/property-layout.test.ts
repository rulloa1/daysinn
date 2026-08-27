import { describe, expect, it } from "vitest";
import { frontBlock, northBuilding, westWing } from "./property-layout";
import { sideForRoom, wingForRoom } from "./room-model";

function roomRows(floor: 1 | 2) {
  return westWing(floor).filter((row) => row.kind === "rooms");
}

describe("authoritative property wing drawing", () => {
  it("orders the ground-floor sides from rooms 134/109 and places the breezeway before 116/127", () => {
    const rows = roomRows(1);

    expect(rows.map((row) => row.outer)).toEqual([
      "134",
      "132",
      "130",
      "128",
      "126",
      "124",
      "122",
      "120",
      "118",
      "116",
      "114",
      "112",
      "110",
      "108",
    ]);
    expect(rows.map((row) => row.inner)).toEqual([
      "109",
      "111",
      "113",
      "115",
      "117",
      "119",
      "121",
      "123",
      "125",
      "127",
      "129",
      "131",
      "133",
      "135",
    ]);
    expect(westWing(1).filter((row) => row.kind === "divider")).toEqual([
      { kind: "divider", label: "Breezeway" },
    ]);
  });

  it("orders the upper-floor row from 209 through 235 and omits rooms 237 and 239", () => {
    const rows = roomRows(2);

    expect(rows.map((row) => row.inner)).toEqual([
      "209",
      "211",
      "213",
      "215",
      "217",
      "219",
      "221",
      "223",
      "225",
      "227",
      "229",
      "231",
      "233",
      "235",
    ]);
    expect(rows.flatMap((row) => [row.outer, row.inner])).not.toContain("237");
    expect(rows.flatMap((row) => [row.outer, row.inner])).not.toContain("239");
  });

  it("orders the ground-floor end row from room 163 to room 137 and omits only 237 and 239", () => {
    expect(northBuilding(1).bottom).toEqual([
      "163",
      "161",
      "159",
      "157",
      "155",
      "153",
      "151",
      "149",
      "147",
      "145",
      "143",
      "141",
      "139",
      "137",
    ]);
    expect(northBuilding(2).bottom).not.toContain("237");
    expect(northBuilding(2).bottom).not.toContain("239");
  });

  it("places the authorized-personnel area before the lobby, breakfast, and dining area", () => {
    expect(frontBlock(1).services).toEqual([
      { kind: "space", label: "Authorized Personnel" },
      { kind: "space", label: "Lobby / Breakfast / Dining", wide: true },
    ]);
  });

  it("derives operational wing and side labels from the corrected physical positions", () => {
    expect(wingForRoom("108")).toBe("West Wing");
    expect(sideForRoom("134")).toBe("Courtyard side");
    expect(wingForRoom("136")).toBe("North Wing");
    expect(sideForRoom("136")).toBe("Pool side");
  });
});
