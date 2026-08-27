import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

type SupabaseServerContext = {
  supabase: SupabaseClient<Database>;
  userId: string | null;
  claims: Record<string, unknown> | null;
};

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export const optionalSupabaseAuth = createMiddleware({
  type: "function",
}).server<SupabaseServerContext>(async ({ next }) => {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");

  let token: string | undefined = undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const parsed = authHeader.replace("Bearer ", "");
    if (parsed && parsed.split(".").length === 3) {
      token = parsed;
    }
  }

  const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY!),
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  if (!token) {
    return next<SupabaseServerContext>({
      context: {
        supabase,
        userId: null,
        claims: null,
      },
    });
  }

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims || !data.claims.sub) {
    return next<SupabaseServerContext>({
      context: {
        supabase,
        userId: null,
        claims: null,
      },
    });
  }

  return next<SupabaseServerContext>({
    context: {
      supabase,
      userId: data.claims.sub,
      claims: data.claims as Record<string, unknown>,
    },
  });
});
