// This file is generated from the application’s Supabase integration and is intentionally
// fail-closed when live configuration is unavailable.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

// Browser-safe project settings for the active Days Inn operations database.
// Publishable Supabase keys are designed for browser use; database policies still
// control what the client can access. Keep server/service-role credentials server-only.
const DAYS_INN_PROJECT_REF = "dwnyuxkztrhwrathngls";
const DAYS_INN_SUPABASE_URL = `https://${DAYS_INN_PROJECT_REF}.supabase.co`;
const DAYS_INN_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_noasUf4o6B24X--d98MgmQ_tnRID04u";

function configuredValue(clientValue: string | undefined, serverValue: string | undefined): string {
  return clientValue || serverValue || "";
}

function resolveDaysInnConfiguration(): { url: string; publishableKey: string } {
  const configuredUrl = configuredValue(
    import.meta.env["VITE_SUPABASE_URL"],
    process.env["SUPABASE_URL"],
  );
  const configuredKey = configuredValue(
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
    process.env["SUPABASE_PUBLISHABLE_KEY"],
  );

  // Previous preview environments may still inject a different Supabase project.
  // Use only an explicit Days Inn project configuration; otherwise use the
  // approved browser-safe default for this standalone deployment.
  if (configuredUrl.includes(DAYS_INN_PROJECT_REF) && configuredKey) {
    return { url: configuredUrl, publishableKey: configuredKey };
  }

  return {
    url: DAYS_INN_SUPABASE_URL,
    publishableKey: DAYS_INN_SUPABASE_PUBLISHABLE_KEY,
  };
}

const DAYS_INN_SUPABASE_CONFIG = resolveDaysInnConfiguration();

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

export const isSupabaseConfigured = Boolean(
  DAYS_INN_SUPABASE_CONFIG.url && DAYS_INN_SUPABASE_CONFIG.publishableKey,
);

type AppSupabaseClient = SupabaseClient<Database>;
type AuthStateChangeCallback = Parameters<AppSupabaseClient["auth"]["onAuthStateChange"]>[0];

type UnavailableError = { message: string };
type UnavailableQueryResult = { data: null; error: UnavailableError };
type UnavailableQueryBuilder = {
  [key: string]: unknown;
  single: () => Promise<UnavailableQueryResult>;
  maybeSingle: () => Promise<UnavailableQueryResult>;
  then: (resolve: (result: UnavailableQueryResult) => unknown) => unknown;
};
type UnavailableChannelBuilder = {
  [key: string]: unknown;
  subscribe: () => object;
};

const unavailable: UnavailableError = {
  message: "Live data is not configured. Operational room data is unavailable.",
};

function createUnavailableQueryBuilder(): UnavailableQueryBuilder {
  const queryBuilder: UnavailableQueryBuilder = {
    single: () => Promise.resolve({ data: null, error: unavailable }),
    maybeSingle: () => Promise.resolve({ data: null, error: unavailable }),
    then: (resolve) => resolve({ data: null, error: unavailable }),
  };

  const queryProxy = new Proxy(queryBuilder, {
    get(target, property) {
      if (typeof property === "string" && property in target) return target[property];
      return () => queryProxy;
    },
  });

  return queryProxy;
}

function createUnavailableChannelBuilder(): UnavailableChannelBuilder {
  const channelBuilder: UnavailableChannelBuilder = {
    subscribe: () => ({ status: "CHANNEL_ERROR", error: unavailable }),
  };

  const channelProxy = new Proxy(channelBuilder, {
    get(target, property) {
      if (property === "subscribe") return target.subscribe;
      return () => channelProxy;
    },
  });

  return channelProxy;
}

function createUnavailableSupabaseClient(): AppSupabaseClient {
  const handler: ProxyHandler<AppSupabaseClient> = {
    get(target, prop, receiver) {
      if (prop === "auth") {
        return {
          onAuthStateChange: (callback: AuthStateChangeCallback) => {
            queueMicrotask(() => callback("SIGNED_OUT", null));
            return { data: { subscription: { unsubscribe: () => {} } } };
          },
          getSession: () => Promise.resolve({ data: { session: null }, error: unavailable }),
          getUser: () => Promise.resolve({ data: { user: null }, error: unavailable }),
          getClaims: () => Promise.resolve({ data: { claims: null }, error: unavailable }),
          updateUser: () => Promise.resolve({ data: { user: null }, error: unavailable }),
          signInWithPassword: () => Promise.resolve({ data: {}, error: unavailable }),
          signUp: () => Promise.resolve({ data: {}, error: unavailable }),
          signOut: () => Promise.resolve({ error: unavailable }),
        };
      }
      if (prop === "from" || prop === "rpc") return () => createUnavailableQueryBuilder();
      if (prop === "channel") return () => createUnavailableChannelBuilder();
      if (prop === "removeChannel") return () => undefined;

      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") return () => value;
      return new Proxy({} as AppSupabaseClient, handler);
    },
  };

  return new Proxy({} as AppSupabaseClient, handler) as AppSupabaseClient;
}

function createSupabaseClient(): AppSupabaseClient {
  const SUPABASE_URL = DAYS_INN_SUPABASE_CONFIG.url;
  const SUPABASE_PUBLISHABLE_KEY = DAYS_INN_SUPABASE_CONFIG.publishableKey;

  if (!isSupabaseConfigured || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.warn(
      "[Supabase] Missing active Days Inn project configuration. All operational data requests fail closed.",
    );
    return createUnavailableSupabaseClient();
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let client: AppSupabaseClient | undefined;

export const supabase = new Proxy({} as AppSupabaseClient, {
  get(_, prop, receiver) {
    if (!client) client = createSupabaseClient();
    return Reflect.get(client, prop, receiver);
  },
}) as AppSupabaseClient;
