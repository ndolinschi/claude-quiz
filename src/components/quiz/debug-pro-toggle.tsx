"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function DebugProToggle({
  debugPro,
  onToggle,
  className,
}: {
  debugPro: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border border-copper/25 bg-card/90 p-3.5 shadow-sm sm:p-4",
        debugPro && "border-copper/45 bg-copper/5",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground transition-colors",
            debugPro && "border-copper/40 bg-copper/15 text-copper shadow-sm"
          )}
        >
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Debug Pro
            </span>
            {debugPro ? (
              <Badge
                variant="outline"
                className="border-copper/40 bg-copper/15 font-mono text-[10px] font-semibold text-copper uppercase"
              >
                Pro (debug)
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-muted-foreground"
              >
                Free tier
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {debugPro
              ? "Unlimited questions & full session history enabled"
              : "Toggle to simulate Pro tier with unlimited questions & history"}
          </p>
        </div>
      </div>
      <Switch
        checked={debugPro}
        onCheckedChange={onToggle}
        aria-label="Toggle Debug Pro mode"
      />
    </div>
  );
}
