import { describe, expect, it } from "vitest";
import { northBuilding, westWing } from "./property-layout";
import { sideForRoom, wingForRoom } from "./room-model";

function roomsFromVerticalWing() {
  return westWing(1).flatMap((row) => (row.kind === "rooms" ? [row.outer, row.inner] : []));
}

describe("authoritative property wing drawing", () => {
  it("places every room from 110 through 135 in the vertical wing", () => {
    expect(roomsFromVerticalWing()).toEqual(
      Array.from({ length: 26 }, (_, index) => String(110 + index)),
    );
  });

  it("places every room from 136 through 163 in the horizontal wing", () => {
    expect(northBuilding(1)).toEqual({
      top: [
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
      ],
      bottom: [
        "137",
        "139",
        "141",
        "143",
        "145",
        "147",
        "149",
        "151",
        "153",
        "155",
        "157",
        "159",
        "161",
        "163",
      ],
    });
  });

  it("derives operational wing and side labels from the documented physical positions", () => {
    expect(wingForRoom("110")).toBe("West Wing");
    expect(sideForRoom("110")).toBe("Courtyard side");
    expect(wingForRoom("136")).toBe("North Wing");
    expect(sideForRoom("136")).toBe("Pool side");
  });

  it("keeps the documented second-floor sequence and terminal room 265", () => {
    expect(wingForRoom("210")).toBe("West Wing");
    expect(wingForRoom("236")).toBe("North Wing");
    expect(northBuilding(2).top).toContain("262");
    expect(northBuilding(2).bottom).toEqual([
      "237",
      "239",
      "241",
      "243",
      "245",
      "247",
      "249",
      "251",
      "253",
      "255",
      "257",
      "259",
      "261",
      "263",
      "265",
    ]);
  });
});
