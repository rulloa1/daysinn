import { describe, expect, it } from "vitest";
import { frontBlock, northBuilding, STAIR_LOCATIONS, westWing } from "./property-layout";
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

  it("orders the pool-facing ground-floor row from room 136 through room 162", () => {
    expect(northBuilding(1).top).toEqual([
      "136",
      "138",
      "140",
      "142",
      "144",
      "146",
      "148",
      "150",
      "152",
      "154",
      "156",
      "158",
      "160",
      "162",
    ]);
  });

  it("orders the confirmed upper-floor pool-facing segment and places its breezeway after room 214", () => {
    expect(northBuilding(2).top).toEqual(["200", "202", "204", "206", "208", "210", "212", "214"]);
    expect(northBuilding(2).topBreezewayAfter).toBe("214");
  });

  it("records both confirmed exterior stair locations", () => {
    expect(STAIR_LOCATIONS).toEqual([
      { label: "Stairs outside 158 / 258", outsideRooms: ["158", "258"] },
      {
        label: "Stairs between 157 / 159 and 257 / 259",
        outsideRooms: ["157", "159", "257", "259"],
      },
      { label: "Front-entrance stairwell after 201", outsideRooms: ["201"] },
    ]);
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

  it("orders the upper-floor front-entrance side from the breezeway to the stairwell", () => {
    expect(frontBlock(2).upstairsLeft).toEqual([
      "217",
      "215",
      "213",
      "211",
      "210",
      "209",
      "207",
      "205",
      "203",
      "201",
    ]);
    expect(frontBlock(2).upstairsLeftBreezewayBefore).toBe("217");
    expect(frontBlock(2).upstairsLeftStairwellAfter).toBe("201");
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
