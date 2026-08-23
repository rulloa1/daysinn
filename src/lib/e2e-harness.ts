/**
 * Lightweight end-to-end harness (no browser, no Playwright).
 *
 * It talks to the running dev/preview server over plain HTTP the same way the
 * browser does — TanStack Start exposes every server function at
 * `/_serverFn/<id>`, where the id is a deterministic base64 of the source file
 * plus the generated handler export name. That means we can drive real server
 * functions (`guestSignIn`, …) from a Node test without launching Chromium.
 *
 * Database setup/teardown uses the service-role REST API directly.
 */

import { toJSON } from "seroval";

type SerovalNode = {
  t: number;
  s?: unknown;
  p?: { k: string[]; v: SerovalNode[] };
  a?: SerovalNode[];
};

/**
 * Decodes the plain-data subset of seroval that server functions return
 * (objects, arrays, strings, numbers, booleans, null/undefined). Avoids
 * `fromJSON`, which needs Start's plugin context that only exists on the server.
 */
function decode(node: SerovalNode | undefined): unknown {
  if (!node) return undefined;
  switch (node.t) {
    case 1: // string / primitive literal
    case 0:
      return node.s;
    case 2: // constants: 1 = undefined, 2 = true, 3 = false, 4 = null
      return { 1: undefined, 2: true, 3: false, 4: null }[node.s as number];
    case 9: // array
      return (node.a ?? []).map(decode);
    default: {
      if (node.a) return node.a.map(decode);
      if (!node.p) return node.s;
      const out: Record<string, unknown> = {};
      node.p.k.forEach((key, index) => {
        out[key] = decode(node.p!.v[index]);
      });
      return out;
    }
  }
}

export const APP_URL = process.env["E2E_BASE_URL"] ?? "http://localhost:8080";

const SUPABASE_URL = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? "";
const SERVICE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

/** True when the harness has everything it needs to run. */
export const e2eReady = Boolean(SUPABASE_URL && SERVICE_KEY);

export function serverFnUrl(file: string, exportName: string): string {
  const id = Buffer.from(JSON.stringify({ file: `${file}?tss-serverfn-split`, export: exportName }))
    .toString("base64")
    .replace(/=+$/, "");
  return `${APP_URL}/_serverFn/${id}`;
}

export async function callServerFn<T = unknown>(
  file: string,
  exportName: string,
  data: unknown,
  init: { headers?: Record<string, string> } = {},
): Promise<{ status: number; body: T }> {
  const response = await fetch(serverFnUrl(file, exportName), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: APP_URL,
      "x-tsr-serverFn": "true",
      ...init.headers,
    },
    body: JSON.stringify(toJSON({ data })),
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = decode(JSON.parse(text) as SerovalNode);
  } catch {
    /* keep raw text */
  }
  return { status: response.status, body: body as T };
}

/**
 * The dev server compiles server functions lazily; hit a page that imports
 * them once so the RPC ids resolve.
 */
export async function warmApp(path = "/checkin"): Promise<boolean> {
  try {
    const response = await fetch(`${APP_URL}${path}`);
    return response.ok;
  } catch {
    return false;
  }
}

/** Minimal service-role REST client for fixtures. */
export async function db(
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<{ status: number; body: unknown }> {
  const { prefer, ...rest } = init;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: prefer ?? "return=representation",
      ...(rest.headers as Record<string, string> | undefined),
    },
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep raw text */
  }
  return { status: response.status, body };
}

export function randomToken(): string {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
}

/** Mirrors rotateRoomQr's revoke-then-mint, without needing a staff session. */
export async function issueToken(
  room: string,
  { minutes = 30, revoked = false, used = false } = {},
): Promise<string> {
  const nowIso = new Date().toISOString();
  await db(
    `room_qr_tokens?room=eq.${encodeURIComponent(room)}&used_at=is.null&revoked_at=is.null`,
    {
      method: "PATCH",
      body: JSON.stringify({ revoked_at: nowIso }),
      prefer: "return=minimal",
    },
  );

  const token = randomToken();
  await db("room_qr_tokens", {
    method: "POST",
    body: JSON.stringify({
      room,
      token,
      expires_at: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
      ...(revoked ? { revoked_at: nowIso } : {}),
      ...(used ? { used_at: nowIso } : {}),
    }),
    prefer: "return=minimal",
  });
  return token;
}

export async function tokenRow(token: string) {
  const { body } = await db(
    `room_qr_tokens?token=eq.${token}&select=used_at,revoked_at,expires_at`,
  );
  return (body as Array<Record<string, string | null>>)[0];
}

export async function cleanupRoomTokens(room: string) {
  await db(`room_qr_tokens?room=eq.${encodeURIComponent(room)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

/** Clears throttle history so a test run starts with a full attempt budget. */
export async function resetGuestAttempts(room: string): Promise<void> {
  await db(`guest_auth_attempts?identifier=eq.${encodeURIComponent(room.toLowerCase())}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}
