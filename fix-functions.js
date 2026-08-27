const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "src", "lib");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".functions.ts"));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, "utf8");

  // Skip if it doesn't use createServerFn
  if (!content.includes("createServerFn")) continue;

  // Add the import if not present
  if (!content.includes("optionalSupabaseAuth")) {
    content = content.replace(
      'import { createServerFn } from "@tanstack/react-start";',
      'import { createServerFn } from "@tanstack/react-start";\nimport { optionalSupabaseAuth } from "@/integrations/supabase/optional-auth-middleware";',
    );
  }

  // Replace createServerFn({ method: ... }) without middleware
  // We use regex to find createServerFn({ method: "..." }) that is NOT followed by .middleware
  const regex = /createServerFn\(\{ method: "(.*?)" \}\)(?!\.middleware)/g;
  content = content.replace(
    regex,
    'createServerFn({ method: "$1" }).middleware([optionalSupabaseAuth])',
  );

  // We should also replace the places where context.user / context.staff might be assumed to be defined if we removed the auth.
  // Actually, since optionalSupabaseAuth sets userId (or null) and supabase, we should just let it be. But wait, we might have errors about 'context' itself being possibly undefined if the middleware wasn't there. Adding the middleware fixes 'context'.
  // However, `context.user` is no longer provided by `optionalSupabaseAuth`. It provides `userId`.
  // Wait, did `requireSupabaseAuth` provide `context.user`? Let's check `auth-middleware.ts`.
  // No, `auth-middleware.ts` returns: `userId`, `claims`, `supabase`.
  // If the old code used `context.user`, then the type checker would complain about `Property 'user' does not exist on type ...`. But the error was `'context' is possibly 'undefined'`.
  // Wait, look at the error log from tsc:
  // src/lib/analytics.functions.ts(24,45): error TS18048: 'context' is possibly 'undefined'.

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Updated ${file}`);
}
