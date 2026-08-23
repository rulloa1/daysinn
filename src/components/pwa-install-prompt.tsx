import { useEffect, useState } from "react";
import { Download, Share, X, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt({
  variant = "banner",
  className = "",
}: {
  variant?: "banner" | "button" | "floating";
  className?: string;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Check if previously dismissed in this session
    const isDismissed = sessionStorage.getItem("daysinn_pwa_dismissed") === "true";
    setDismissed(isDismissed);

    // Capture standard PWA install prompt for Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("daysinn_pwa_dismissed", "true");
  };

  // If already installed as app or dismissed, don't show banner
  if (isStandalone || (dismissed && variant === "banner")) {
    return null;
  }

  // If not iOS and no beforeinstallprompt event fired yet (unless explicit button requested)
  if (!deferredPrompt && !isIos && variant !== "button") {
    return null;
  }

  if (variant === "button") {
    return (
      <>
        <Button
          type="button"
          onClick={handleInstallClick}
          size="sm"
          className={`spring-hover inline-flex items-center gap-1.5 rounded-xl border border-amber/40 bg-amber/15 text-xs font-bold text-amber hover:bg-amber/25 ${className}`}
        >
          <Download className="h-3.5 w-3.5" />
          Install App
        </Button>

        {/* iOS Install Instructions Modal */}
        <Dialog open={showIosGuide} onOpenChange={setShowIosGuide}>
          <DialogContent className="max-w-sm rounded-3xl border border-border/90 bg-card p-6 shadow-2xl">
            <DialogHeader>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Smartphone className="h-6 w-6" />
              </div>
              <DialogTitle className="mt-3 text-center font-serif text-lg font-bold text-foreground">
                Install on iPhone or iPad
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-muted-foreground">
                Add Days Inn Hub to your home screen for one-tap access:
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3 text-xs text-foreground">
              <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  1
                </span>
                <p className="leading-relaxed">
                  Tap the <strong className="font-semibold text-primary">Share</strong> icon{" "}
                  <Share className="inline h-3.5 w-3.5 text-primary" /> at the bottom of Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  2
                </span>
                <p className="leading-relaxed">
                  Scroll down and tap{" "}
                  <strong className="font-semibold text-primary">
                    &quot;Add to Home Screen&quot;
                  </strong>
                  .
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  3
                </span>
                <p className="leading-relaxed">
                  Tap <strong className="font-semibold text-primary">&quot;Add&quot;</strong> in the
                  top-right corner.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowIosGuide(false)}
              className="spring-hover mt-4 w-full rounded-xl bg-primary font-bold text-primary-foreground"
            >
              Got it!
            </Button>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <aside
        aria-label="Install App"
        className={`relative overflow-hidden rounded-2xl border border-blue-900/40 bg-gradient-to-r from-[#1E3A8A] to-[#0f172a] p-4 text-white shadow-xl ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground shadow-md">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-white">Install Days Inn® Hub App</h4>
              <p className="text-[11px] text-slate-300/90 leading-tight">
                Fast one-tap access to your room board, front desk & instant alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleInstallClick}
              size="sm"
              className="spring-hover rounded-xl bg-accent font-bold text-accent-foreground shadow-md hover:brightness-105"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Add to Home Screen
            </Button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss app install banner"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Instructions Modal */}
      <Dialog open={showIosGuide} onOpenChange={setShowIosGuide}>
        <DialogContent className="max-w-sm rounded-3xl border border-border/90 bg-card p-6 shadow-2xl">
          <DialogHeader>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Smartphone className="h-6 w-6" />
            </div>
            <DialogTitle className="mt-3 text-center font-serif text-lg font-bold text-foreground">
              Install on iPhone or iPad
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Add Days Inn Hub to your home screen for quick offline access:
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3 text-xs text-foreground">
            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                1
              </span>
              <p className="leading-relaxed">
                Tap the <strong className="font-semibold text-primary">Share</strong> icon{" "}
                <Share className="inline h-3.5 w-3.5 text-primary" /> at the bottom of Safari.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                2
              </span>
              <p className="leading-relaxed">
                Scroll down and tap{" "}
                <strong className="font-semibold text-primary">
                  &quot;Add to Home Screen&quot;
                </strong>
                .
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                3
              </span>
              <p className="leading-relaxed">
                Tap <strong className="font-semibold text-primary">&quot;Add&quot;</strong> in the
                top-right corner.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowIosGuide(false)}
            className="spring-hover mt-4 w-full rounded-xl bg-primary font-bold text-primary-foreground"
          >
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
