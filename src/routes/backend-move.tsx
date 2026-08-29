// TEMPORARY one-time data move screen. Delete once the copy is confirmed.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { LEGACY_SUPABASE_PROJECT } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const MIGRATION_TOKEN = "dz9-move-2026-08-29-c41f";
const TABLES = [
  "staff_members",
  "rooms",
  "room_rates",
  "staff_schedules",
  "shift_room_assignments",
  "staff_shifts",
] as const;

export const Route = createFileRoute("/backend-move")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Backend Data Move — Days Inn Hub" },
      { name: "description", content: "One-time copy of property data to the managed backend." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BackendMovePage,
});

function BackendMovePage() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setLog(["Starting…"]);
    const legacy = createClient(LEGACY_SUPABASE_PROJECT.url, LEGACY_SUPABASE_PROJECT.publishableKey, {
      auth: {
        storageKey: `sb-${LEGACY_SUPABASE_PROJECT.ref}-auth-token`,
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    const { data: sessionData } = await legacy.auth.getSession();
    if (!sessionData.session) {
      setLog((l) => [...l, "No signed-in session found for the previous backend. Cannot copy."]);
      setRunning(false);
      return;
    }
    setLog((l) => [...l, `Reading as ${sessionData.session?.user.email ?? "signed-in user"}`]);

    for (const table of TABLES) {
      const { data, error } = await legacy.from(table).select("*");
      if (error) {
        setLog((l) => [...l, `${table}: read failed — ${error.message}`]);
        continue;
      }
      const rows = (data ?? []).map((row: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...row };
        // Columns removed from the current schema.
        delete next["pin"];
        if (table === "staff_members") next["user_id"] = null;
        return next;
      });
      const res = await fetch("/api/public/migration-import", {
        method: "POST",
        headers: { "content-type": "application/json", "x-migration-token": MIGRATION_TOKEN },
        body: JSON.stringify({ table, rows }),
      });
      const text = await res.text();
      setLog((l) => [...l, `${table}: ${rows.length} row(s) → ${res.status} ${text.slice(0, 120)}`]);
    }
    setLog((l) => [...l, "Done."]);
    setRunning(false);
  }

  return (
    <div className="ops-portal min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-[#004986]">Backend data move</h1>
        <p className="mt-2 text-sm text-slate-600">
          Copies rooms, staff, rates, schedules and shifts from the previous backend into the
          managed backend. Safe to run more than once.
        </p>
        <Button className="mt-5" onClick={() => void run()} disabled={running}>
          {running ? "Copying…" : "Copy data now"}
        </Button>
        <pre className="mt-6 whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
          {log.join("\n") || "No run yet."}
        </pre>
      </div>
    </div>
  );
}
