import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StaffIdentity } from "@/lib/ops";

/**
 * Who is on the desk. Room status changes are attributed to this selection, so
 * the board nags when it is unset rather than logging changes anonymously.
 */
export function StaffPicker({
  members,
  staff,
  onSelect,
  onAdd,
}: {
  members: { id: string; name: string }[];
  staff: StaffIdentity;
  onSelect: (next: StaffIdentity) => void;
  onAdd: (name: string) => Promise<unknown>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-2">
      <span className="signage text-cream/45">On desk</span>
      <select
        aria-label="Staff member on desk"
        value={staff?.id ?? ""}
        onChange={(e) => {
          const match = members.find((m) => m.id === e.target.value);
          onSelect(match ? { id: match.id, name: match.name } : null);
        }}
        className="border border-cream/25 bg-cream/[0.04] px-2 py-1 text-sm text-cream"
      >
        <option value="">Not set</option>
        {members.map((m) => (
          <option key={m.id} value={m.id} className="text-ink">
            {m.name}
          </option>
        ))}
      </select>
      {adding ? (
        <span className="flex items-center gap-2">
          <Input
            value={name}
            autoFocus
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            className="h-8 w-32 border-cream/20 bg-cream/[0.04] text-cream placeholder:text-cream/35"
          />
          <Button
            size="sm"
            className="bg-amber text-ink hover:bg-amber/90"
            onClick={async () => {
              try {
                await onAdd(name);
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Could not add that name to the roster.",
                );
                return;
              }
              setName("");
              setAdding(false);
            }}
          >
            Save
          </Button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="signage text-cream/50 transition-colors duration-200 hover:text-amber"
        >
          + Add
        </button>
      )}
    </div>
  );
}
