import logoAsset from "@/assets/days-inn-logo.png.asset.json";
import emblemAsset from "@/assets/days-inn-emblem.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandLockup({
  className,
  tone = "ink",
  plate = false,
}: {
  className?: string;
  tone?: "ink" | "cream";
  /** Uses the sunburst emblem only, for use on the Congress Blue bars. */
  plate?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {plate ? (
        <img
          src={emblemAsset.url}
          alt="Days Inn"
          width={605}
          height={309}
          className="block h-6 w-auto shrink-0 sm:h-7"
        />
      ) : (
        <img
          src={logoAsset.url}
          alt="Days Inn"
          width={112}
          height={56}
          className="h-8 w-auto shrink-0"
        />
      )}

      {plate ? (
        <span className={cn("leading-none", tone === "cream" ? "text-cream" : "text-ink")}>
          <span className="block font-serif text-[1.05rem] font-bold tracking-tight sm:text-xl">
            Days Inn
          </span>
          <span
            className={cn(
              "signage mt-0.5 block text-[0.6rem]",
              tone === "cream" ? "text-cream/60" : "text-muted-foreground",
            )}
          >
            Wildwood I-75
          </span>
        </span>
      ) : (
        <span
          className={cn(
            "hidden border-l pl-3 leading-tight sm:block",
            tone === "cream" ? "border-cream/25 text-cream" : "border-border text-ink",
          )}
        >
          <span className="signage block">Guest Hub</span>
          <span
            className={cn(
              "signage mt-1 block",
              tone === "cream" ? "text-cream/55" : "text-muted-foreground",
            )}
          >
            Days Inn® by Wyndham
          </span>
        </span>
      )}
    </span>
  );

}
