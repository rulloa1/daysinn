import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandLockup({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "cream";
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <img
        src={logoAsset.url}
        alt="Days Inn"
        width={112}
        height={56}
        className="h-8 w-auto"
      />
      <span
        className={cn(
          "hidden border-l pl-3 leading-tight sm:block",
          tone === "cream"
            ? "border-cream/25 text-cream"
            : "border-border text-ink",
        )}
      >
        <span className="signage block">Guest Hub</span>
        <span
          className={cn(
            "signage mt-1 block",
            tone === "cream" ? "text-cream/55" : "text-muted-foreground",
          )}
        >
          Demo Property
        </span>
      </span>
    </span>
  );
}
