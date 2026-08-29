import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { assertSchemaIntegrity } from "./lib/schema-guard.server";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { optionalSupabaseAuth } from "@/integrations/supabase/optional-auth-middleware";

// Verifies once per server process that the live database matches the
// generated types (and that retired PIN columns are really gone).
const schemaGuardMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/lovable/")) {
    return next();
  }
  await assertSchemaIntegrity();
  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next, handlerType, request }) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/lovable/")) {
    return next();
  }
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    // Server-function callers must receive the original RPC error so local
    // component error handling can show a toast/state instead of trying to
    // deserialize an HTML error page and replacing the whole application.
    if (handlerType === "serverFn") throw error;
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, optionalSupabaseAuth],
  requestMiddleware: [errorMiddleware, schemaGuardMiddleware, csrfMiddleware],
}));
