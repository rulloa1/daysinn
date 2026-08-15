import { describe, expect, it } from "vitest";
import { requestSchema } from "./request-schema";

const base = { guest_name: "", details: "" };

describe("client-side room validation", () => {
  it("rejects an empty room number", () => {
    const result = requestSchema.safeParse({ ...base, room: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Room number is required.");
  });

  it("rejects a whitespace-only room number", () => {
    const result = requestSchema.safeParse({ ...base, room: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe("room");
  });

  it("rejects a room number longer than 10 characters", () => {
    const result = requestSchema.safeParse({ ...base, room: "12345678901" });
    expect(result.success).toBe(false);
  });

  it("accepts and trims a valid room number", () => {
    const result = requestSchema.safeParse({ ...base, room: " 214 " });
    expect(result.success).toBe(true);
    expect(result.data?.room).toBe("214");
  });
});
