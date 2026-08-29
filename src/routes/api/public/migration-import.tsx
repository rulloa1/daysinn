// TEMPORARY one-time backend migration endpoint. Delete after the data move.
import { createFileRoute } from "@tanstack/react-router";

const MIGRATION_TOKEN = "dz9-move-2026-08-29-c41f";

const ALLOWED_TABLES = new Set([
  "rooms",
  "staff_members",
  "room_rates",
  "staff_schedules",
  "shift_room_assignments",
  "staff_shifts",
  "requests",
  "maintenance_tickets",
]);

export const Route = createFileRoute("/api/public/migration-import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-migration-token") !== MIGRATION_TOKEN) {
          return new Response("Unauthorized", { status: 401 });
        }
        const payload = (await request.json()) as {
          table?: string;
          rows?: Record<string, unknown>[];
        };
        const table = payload.table ?? "";
        if (!ALLOWED_TABLES.has(table)) {
          return Response.json({ ok: false, error: "table not allowed" }, { status: 400 });
        }
        const rows = payload.rows ?? [];
        if (rows.length === 0) return Response.json({ ok: true, inserted: 0 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const conflictTarget =
          table === "rooms"
            ? "number"
            : table === "room_rates"
              ? "room_type"
              : table === "staff_members"
                ? "id"
                : "id";
        const { error, count } = await supabaseAdmin
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(table as any)
          .upsert(rows as never, { onConflict: conflictTarget, count: "exact" });
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, inserted: count ?? rows.length });
      },
    },
  },
});
