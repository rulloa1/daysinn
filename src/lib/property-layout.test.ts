import { describe, expect, it } from "vitest";
import { northBuilding, westWing } from "./property-layout";
import { sideForRoom, wingForRoom } from "./room-model";

function roomsFromWing() {
  return westWing(1).flatMap((row) => (row.kind === "rooms" ? [row.outer, row.inner] : []));
}

describe("approved first-floor wing swap", () => {
  it("places every room from 136 through 163 in the vertical wing", () => {
    expect(roomsFromWing()).toEqual(Array.from({ length: 28 }, (_, index) => String(136 + index)));
  });

  it("places every room from 110 through 135 in the horizontal wing", () => {
    expect(northBuilding(1)).toEqual({
      top: [
        "110",
        "112",
        "114",
        "116",
        "118",
        "120",
        "122",
        "124",
        "126",
        "128",
        "130",
        "132",
        "134",
      ],
      bottom: [
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
      ],
    });
  });

  it("derives operational wing and side labels from the corrected physical positions", () => {
    expect(wingForRoom("136")).toBe("West Wing");
    expect(sideForRoom("136")).toBe("Courtyard side");
    expect(wingForRoom("110")).toBe("North Wing");
    expect(sideForRoom("110")).toBe("Pool side");
  });

  it("keeps the second-floor room orientation stable until it receives its own approved remap", () => {
    expect(wingForRoom("210")).toBe("West Wing");
    expect(wingForRoom("236")).toBe("North Wing");
    expect(northBuilding(2).bottom).toContain("265");
  });
});
