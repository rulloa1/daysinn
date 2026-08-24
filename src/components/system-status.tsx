import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { readPresentationMode } from "@/lib/presentation";
import type { Session } from "@supabase/supabase-js";
import { Database, Shield, MonitorPlay } from "lucide-react";

type SystemStatusProps = {
  session: Session | null;
  demo?: boolean;
};

export function SystemStatus({ session, demo = false }: SystemStatusProps) {
  const dbConfigured = isSupabaseConfigured;
  const isDemo = demo || readPresentationMode() || !dbConfigured;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-full border border-cream/10 bg-cream/[0.02] px-4 py-2 text-xs font-mono text-cream/70 backdrop-blur-sm">
      {/* Database Connection Status */}
      <div className="flex items-center gap-2">
        <Database className="h-3.5 w-3.5 text-cream/50" />
        <span>Database:</span>
        <span className="flex items-center gap-1.5 font-bold">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              dbConfigured ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className={dbConfigured ? "text-emerald-400" : "text-rose-400"}>
            {dbConfigured ? "Configured" : "Not Configured"}
          </span>
        </span>
      </div>

      <div className="hidden h-3 w-px bg-cream/15 sm:block" />

      {/* Auth Session Status */}
      <div className="flex items-center gap-2">
        <Shield className="h-3.5 w-3.5 text-cream/50" />
        <span>Auth:</span>
        <span className="flex items-center gap-1.5 font-bold">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              session ? "bg-emerald-500" : "bg-cream/30"
            }`}
          />
          <span className={session ? "text-emerald-400" : "text-cream/50"}>
            {session ? "Active Session" : "No Session"}
          </span>
        </span>
      </div>

      <div className="hidden h-3 w-px bg-cream/15 sm:block" />

      {/* Demo / Live Mode Status */}
      <div className="flex items-center gap-2">
        <MonitorPlay className="h-3.5 w-3.5 text-cream/50" />
        <span>Mode:</span>
        <span className="flex items-center gap-1.5 font-bold">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isDemo ? "bg-amber-500" : "bg-sky-500"
            }`}
          />
          <span className={isDemo ? "text-amber-400" : "text-sky-400"}>
            {isDemo ? "Demo Sandbox" : "Live Production"}
          </span>
        </span>
      </div>
    </div>
  );
}
