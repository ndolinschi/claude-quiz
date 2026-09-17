"use client";

import { Check, Lock, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PaywallCard({
  onUnlockDebugPro,
  className,
  reason = "exhausted",
}: {
  onUnlockDebugPro: () => void;
  className?: string;
  reason?: "exhausted" | "clamp";
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-copper/40 bg-gradient-to-b from-card to-card/90 shadow-md",
        className
      )}
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-copper via-primary to-copper" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-copper/15 text-copper">
              <Lock className="size-4" />
            </div>
            <Badge
              variant="outline"
              className="border-copper/40 bg-copper/10 font-mono text-[11px] font-semibold text-copper uppercase"
            >
              Daily limit reached
            </Badge>
          </div>
          <span className="font-mono text-xs font-medium text-copper">
            50 / 50 used
          </span>
        </div>
        <CardTitle className="mt-2 text-lg sm:text-xl">
          {reason === "clamp"
            ? "Expand your session with Pro"
            : "You’ve reached today’s 50 question limit"}
        </CardTitle>
        <CardDescription className="text-sm">
          Free tier allows 50 questions each day (resets at midnight). Upgrade to
          Pro for unlimited drills and full session history.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3.5 pb-4">
        <div className="grid gap-2.5 rounded-xl border border-border/80 bg-muted/40 p-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="font-mono text-xs font-semibold text-muted-foreground uppercase">
              Free Tier
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Check className="size-3.5 shrink-0 text-muted-foreground" />
                <span>50 questions / day</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3.5 shrink-0 text-muted-foreground" />
                <span>Basic theme coverage map</span>
              </li>
            </ul>
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-xs font-semibold text-copper uppercase">
              Pro Tier
            </p>
            <ul className="space-y-1 text-xs text-foreground">
              <li className="flex items-center gap-1.5 font-medium">
                <Zap className="size-3.5 shrink-0 text-copper" />
                <span>Unlimited questions</span>
              </li>
              <li className="flex items-center gap-1.5 font-medium">
                <Zap className="size-3.5 shrink-0 text-copper" />
                <span>Full session history & tracking</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Commercial Stripe billing is coming soon. Use{" "}
          <strong className="text-foreground">Debug Pro</strong> to unlock all
          features right now in preview.
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0 sm:flex-row">
        <Button
          size="lg"
          onClick={onUnlockDebugPro}
          className="h-11 w-full rounded-full bg-copper text-white hover:bg-copper/90 shadow-sm"
        >
          <Sparkles className="size-4" />
          Unlock Pro with Debug Mode
        </Button>
      </CardFooter>
    </Card>
  );
}
