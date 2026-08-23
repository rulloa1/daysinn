import { describe, expect, it } from "vitest";

const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

async function insertRequest(room: string) {
  return fetch(`${url}/rest/v1/requests`, {
    method: "POST",
    headers: {
      apikey: key!,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ room, type: "Automated test" }),
  });
}

describe.runIf(url && key)("server-side room validation", () => {
  it("rejects an empty room number", async () => {
    const response = await insertRequest("");
    expect(response.ok).toBe(false);
    const body = await response.text();
    expect(
      body.includes("requests_room_not_empty") ||
        body.includes("violates row-level security") ||
        body.includes("42501"),
    ).toBe(true);
  });

  it("rejects a whitespace-only room number", async () => {
    const response = await insertRequest("   ");
    expect(response.ok).toBe(false);
  });

  it("rejects a room number longer than 10 characters", async () => {
    const response = await insertRequest("12345678901");
    expect(response.ok).toBe(false);
  });
});
