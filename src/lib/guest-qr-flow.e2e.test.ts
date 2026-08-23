import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  APP_URL,
  callServerFn,
  cleanupRoomTokens,
  db,
  e2eReady,
  issueToken,
  warmApp,
  randomToken,
  resetGuestAttempts,
  tokenRow,
} from "./e2e-harness";

const FILE = "/src/lib/guest.functions.ts";
const SIGN_IN = "guestSignIn_createServerFn_handler";
const ROTATE = "rotateRoomQr_createServerFn_handler";

type SignInResult =
  | { ok: true; guest: { room: string; guestName: string }; expiresAt: string }
  | { ok: false; error: string };

let serverUp = false;
let room = "";
let lastName = "";

async function signIn(data: {
  room: string;
  lastName: string;
  token?: string;
}) {
  const { body } = await callServerFn<{ result?: SignInResult }>(
    FILE,
    SIGN_IN,
    data,
  );
  return (body?.result ?? body) as SignInResult;
}

beforeAll(async () => {
  serverUp = await warmApp();
  if (!serverUp || !e2eReady) return;

  const { body } = await db(
    "rooms?guest_name=not.is.null&select=number,guest_name&limit=1",
  );
  const occupied = (body as Array<{ number: string; guest_name: string }>)[0];
  if (occupied) {
    room = occupied.number;
    lastName = occupied.guest_name.trim().split(/\s+/).pop() ?? "";
    await resetGuestAttempts(room);
  }
});

afterAll(async () => {
  if (room) {
    await cleanupRoomTokens(room);
    await resetGuestAttempts(room);
  }
});

describe.runIf(e2eReady)("guest QR sign-in (end-to-end over HTTP)", () => {
  it("has a running app and an occupied room fixture", () => {
    expect(serverUp, `dev server not reachable at ${APP_URL}`).toBe(true);
    expect(room, "no occupied room to test with").not.toBe("");
  });

  it("signs in with a freshly rotated code and burns it", async () => {
    const token = await issueToken(room);

    const first = await signIn({ room, lastName, token });
    expect(first.ok).toBe(true);

    expect((await tokenRow(token))?.['used_at']).not.toBeNull();
  });

  it("rejects re-using the same code (single-use)", async () => {
    const token = await issueToken(room);
    expect((await signIn({ room, lastName, token })).ok).toBe(true);

    const replay = await signIn({ room, lastName, token });
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.error).toMatch(/expired or was already used/i);
  });

  it("rejects an expired code", async () => {
    const token = await issueToken(room, { minutes: -1 });
    expect((await signIn({ room, lastName, token })).ok).toBe(false);
  });

  it("rejects a code revoked by rotation", async () => {
    const stale = await issueToken(room);
    const fresh = await issueToken(room); // rotation revokes the previous code

    expect((await signIn({ room, lastName, token: stale })).ok).toBe(false);
    expect((await signIn({ room, lastName, token: fresh })).ok).toBe(true);
  });

  it("rejects a code minted for a different room", async () => {
    const token = await issueToken("__e2e-other");
    expect((await signIn({ room, lastName, token })).ok).toBe(false);
    await cleanupRoomTokens("__e2e-other");
  });

  it("rejects an unknown code", async () => {
    expect((await signIn({ room, lastName, token: randomToken() })).ok).toBe(
      false,
    );
  });

  it("rejects a valid code with the wrong last name", async () => {
    const token = await issueToken(room);
    const result = await signIn({ room, lastName: "Notarealguest", token });
    expect(result.ok).toBe(false);
  });

  it("refuses to rotate a room code without a staff session", async () => {
    const { body } = await callServerFn(FILE, ROTATE, { room });
    expect(JSON.stringify(body)).toMatch(/unauthor/i);
  });
});
