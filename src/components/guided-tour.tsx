import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export type TourStep = {
  /** data-tour value of the element to highlight; omit for a centered card */
  target?: string;
  title: string;
  body: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 10;

export function GuidedTour({
  steps,
  open,
  onClose,
}: {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(
      `[data-tour="${step.target}"]`,
    );
    if (!el) {
      setRect(null);
      return;
    }
    const box = el.getBoundingClientRect();
    setRect({
      top: box.top - PAD,
      left: box.left - PAD,
      width: box.width + PAD * 2,
      height: box.height + PAD * 2,
    });
  }, [step]);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open || !step) return;
    const el = step.target
      ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      : null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const raf = window.setTimeout(measure, 320);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, measure]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight")
        setIndex((i) => Math.min(i + 1, steps.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, steps.length]);

  if (!open || !step) return null;

  const last = index === steps.length - 1;

  // Card placement: below the highlight when there's room, otherwise above.
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const below = rect ? rect.top + rect.height + 16 : 0;
  const placeBelow = rect ? below < viewportH - 220 : true;

  const cardStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: placeBelow ? below : undefined,
        bottom: placeBelow ? undefined : viewportH - rect.top + 16,
        left: Math.max(16, Math.min(rect.left, (typeof window !== "undefined" ? window.innerWidth : 1200) - 396)),
        width: 360,
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 360,
      };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Dimmer with a punched-out spotlight */}
      {rect ? (
        <div
          className="pointer-events-none fixed inset-0 transition-all duration-300"
          style={{
            boxShadow: "0 0 0 9999px rgba(8, 18, 30, 0.82)",
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            outline: "2px solid var(--amber, #f0a63c)",
            borderRadius: 2,
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-ink/85" />
      )}

      <button
        type="button"
        aria-label="Close walkthrough"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <div
        style={cardStyle}
        className="max-w-[calc(100vw-2rem)] border border-amber/50 bg-ink p-5 text-cream shadow-2xl"
      >
        <p className="signage flex items-center gap-2 text-amber">
          <span aria-hidden className="h-3 w-[3px] bg-amber" />
          Step {index + 1} of {steps.length}
        </p>
        <h2 className="mt-3 font-display text-2xl leading-tight">
          {step.title}
        </h2>
        <p className="mt-2 text-sm text-cream/70">{step.body}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-cream/50 underline-offset-4 hover:text-amber hover:underline"
          >
            Skip walkthrough
          </button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={index === 0}
              className="border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            >
              Back
            </Button>
            <Button
              size="sm"
              className="bg-amber text-ink hover:bg-amber/90"
              onClick={() => (last ? onClose() : setIndex((i) => i + 1))}
            >
              {last ? "Done" : "Next"}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s.title}
              aria-hidden
              className={`h-[3px] flex-1 transition-colors duration-200 ${i <= index ? "bg-amber" : "bg-cream/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
