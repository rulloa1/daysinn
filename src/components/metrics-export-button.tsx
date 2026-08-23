import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportMetricsCsvs, type ExportRange } from "@/lib/metrics-export";

const RANGES: { days: ExportRange; label: string }[] = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
];

export function MetricsExportButton() {
  const [busy, setBusy] = useState(false);

  async function run(days: ExportRange) {
    setBusy(true);
    try {
      const result = await exportMetricsCsvs(days);
      toast.success(
        `Exported ${result.events} status events and ${result.resolved} resolved requests.`,
      );
    } catch (error) {
      console.error(error);
      toast.error("Couldn't build the export. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          disabled={busy}
          className="rounded-xl bg-amber font-bold text-ink hover:bg-amber/90"
        >
          {busy ? "Preparing…" : "Export CSV"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Turnover & response metrics</DropdownMenuLabel>
        {RANGES.map((range) => (
          <DropdownMenuItem key={range.days} onSelect={() => void run(range.days)}>
            {range.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
