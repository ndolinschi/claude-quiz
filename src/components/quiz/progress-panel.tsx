"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Layers,
  Lock,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getDomainCoverage,
  getOverallCoverage,
  getTopTagCoverage,
} from "@/lib/quiz";
import type { ProgressStore } from "@/lib/progress-store";
import { PRO_FOR_EVERYONE } from "@/lib/progress-store";
import { cn } from "@/lib/utils";

export function ProgressPanel({
  store,
  isPro,
  onUnlockPro,
}: {
  store: ProgressStore;
  isPro: boolean;
  onUnlockPro?: () => void;
}) {
  const [tab, setTab] = useState<"domains" | "tags" | "history">("domains");
  const [expanded, setExpanded] = useState(true);

  const overall = useMemo(
    () => getOverallCoverage(store.answered),
    [store.answered]
  );
  const domainCoverage = useMemo(
    () => getDomainCoverage(store.answered),
    [store.answered]
  );
  const tagCoverage = useMemo(
    () => getTopTagCoverage(store.answered, 12),
    [store.answered]
  );

  return (
    <Card className="overflow-hidden border-copper/25 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-copper/15 text-copper">
              <BarChart3 className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">
                Theme Coverage & Progress
              </CardTitle>
              <CardDescription className="text-xs">
                {overall.answered} of {overall.total} unique bank questions
                attempted ({overall.percent}%)
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0 text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Collapse progress" : "Expand progress"}
          >
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>

        {/* Global progress bar */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>Overall Bank Coverage</span>
            <span>{overall.percent}%</span>
          </div>
          <Progress value={overall.percent} className="h-2" />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Sub-tabs */}
          <div className="flex gap-1.5 rounded-xl border border-border/70 bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setTab("domains")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all",
                tab === "domains"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="size-3.5" />
              Domains ({domainCoverage.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("tags")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all",
                tab === "tags"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Tag className="size-3.5" />
              Top Tags (12)
            </button>
            <button
              type="button"
              onClick={() => setTab("history")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all",
                tab === "history"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="size-3.5" />
              History {isPro ? `(${store.history.length})` : "🔒"}
            </button>
          </div>

          {/* Tab 1: Domains */}
          {tab === "domains" && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {domainCoverage.map((d) => (
                <div
                  key={d.name}
                  className="space-y-1 rounded-xl border border-border/60 bg-background/60 p-2.5"
                >
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-medium text-foreground truncate">
                      {d.name}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {d.answered}/{d.total} ({d.percent}%)
                    </span>
                  </div>
                  <Progress value={d.percent} className="h-1.5" />
                  {d.answered > 0 && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {d.correct} correct
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Top Tags */}
          {tab === "tags" && (
            <div className="grid gap-2 sm:grid-cols-2">
              {tagCoverage.map((t) => (
                <div
                  key={t.name}
                  className="space-y-1 rounded-xl border border-border/60 bg-background/60 p-2.5"
                >
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-mono font-medium text-foreground truncate">
                      #{t.name}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {t.answered}/{t.total} ({t.percent}%)
                    </span>
                  </div>
                  <Progress value={t.percent} className="h-1.5" />
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: History */}
          {tab === "history" && (
            <div className="space-y-3">
              {!isPro ? (
                <div className="rounded-xl border border-copper/30 bg-copper/5 p-4 text-center">
                  <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-copper/15 text-copper">
                    <Lock className="size-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Full Session History is a Pro Feature
                  </h4>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    Track your exam scores and domain breakdowns across all past
                    drills with Pro.
                  </p>
                  {!PRO_FOR_EVERYONE && onUnlockPro && (
                    <Button
                      size="sm"
                      onClick={onUnlockPro}
                      className="mt-3 rounded-full bg-copper text-white hover:bg-copper/90"
                    >
                      Enable Debug Pro
                    </Button>
                  )}
                </div>
              ) : store.history.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-background/50 p-6 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-1.5 size-5 text-muted-foreground/60" />
                  No completed sessions recorded yet. Finish a quiz to see your
                  saved runs!
                </div>
              ) : (
                <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                  {store.history.map((h, i) => {
                    const dateStr = new Date(h.endedAt).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );
                    const pct = Math.round((h.score / (h.total || 1)) * 100);
                    return (
                      <div
                        key={h.id || i}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 p-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {h.score}/{h.total} correct
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono text-[10px]",
                                pct >= 80
                                  ? "border-correct/40 text-correct"
                                  : pct >= 60
                                    ? "border-copper/40 text-copper"
                                    : "border-destructive/40 text-destructive"
                              )}
                            >
                              {pct}%
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {dateStr} · {h.domains?.join(", ") || "All"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
