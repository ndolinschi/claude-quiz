"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Shuffle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatClock, scoreSession, type SetupConfig } from "@/lib/quiz";
import type { Question } from "@/data/types";
import { cn } from "@/lib/utils";

export function ResultsScreen({
  items,
  answers,
  config,
  elapsedMs,
  onRetry,
  onReshuffle,
  onSetup,
}: {
  items: Question[];
  answers: Record<string, string>;
  config: SetupConfig;
  elapsedMs: number;
  onRetry: () => void;
  onReshuffle: () => void;
  onSetup: () => void;
}) {
  const stats = scoreSession(items, answers);
  const misses = useMemo(
    () =>
      items.filter((q) => {
        const a = answers[q.id];
        return a && a !== q.answer;
      }),
    [answers, items]
  );
  const blanks = useMemo(
    () => items.filter((q) => !answers[q.id]),
    [answers, items]
  );
  const [openId, setOpenId] = useState<string | null>(misses[0]?.id ?? null);

  const tone =
    stats.percent >= 80 ? "correct" : stats.percent >= 60 ? "copper" : "destructive";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <p className="mb-2 font-mono text-[11px] tracking-[0.28em] text-copper uppercase">
          Session complete
        </p>
        <div className="relative mx-auto mb-4 size-36">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              className="text-muted"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              className={cn(
                tone === "correct" && "text-correct",
                tone === "copper" && "text-copper",
                tone === "destructive" && "text-destructive"
              )}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(stats.percent / 100) * 327} 327`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-4xl leading-none">{stats.percent}%</span>
            <span className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              score
            </span>
          </div>
        </div>
        <h1 className="font-heading text-3xl">
          {stats.correct} / {stats.total} correct
        </h1>
        <p className="mt-2 text-muted-foreground">
          {formatClock(Math.floor(elapsedMs / 1000))} used
          {config.timeMinutes
            ? ` · ${config.timeMinutes} min limit`
            : " · untimed"}
          {config.feedback === "exam" ? " · exam mode" : " · instant feedback"}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge variant="outline" className="border-correct/40 text-correct">
            {stats.correct} right
          </Badge>
          <Badge variant="outline" className="border-destructive/30 text-destructive">
            {stats.wrong} wrong
          </Badge>
          <Badge variant="outline">{stats.blank} skipped</Badge>
        </div>
      </header>

      <div className="mb-8 flex flex-col gap-2 sm:flex-row">
        <Button className="h-11 flex-1 rounded-full" onClick={onRetry}>
          <RotateCcw className="size-4" />
          Retry same set
        </Button>
        <Button
          variant="outline"
          className="h-11 flex-1 rounded-full"
          onClick={onReshuffle}
        >
          <Shuffle className="size-4" />
          New shuffle
        </Button>
        <Button variant="ghost" className="h-11 rounded-full" onClick={onSetup}>
          New setup
        </Button>
      </div>

      {misses.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-heading text-xl">Review misses</h2>
          <div className="grid gap-2">
            {misses.map((q, i) => {
              const open = openId === q.id;
              const chosen = answers[q.id];
              return (
                <Card key={q.id} className="bg-card/95">
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left"
                    onClick={() => setOpenId(open ? null : q.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-snug">
                        <span className="mr-2 font-mono text-xs text-muted-foreground">
                          {i + 1}.
                        </span>
                        {q.stem}
                      </p>
                      <Badge variant="outline" className="shrink-0 font-mono">
                        Set {q.set}
                      </Badge>
                    </div>
                  </button>
                  {open && (
                    <CardContent className="border-t pt-3">
                      <ul className="space-y-1.5">
                        {q.choices.map((c) => {
                          const good = c.key === q.answer;
                          const bad = c.key === chosen && !good;
                          return (
                            <li
                              key={c.key}
                              className={cn(
                                "flex gap-2 rounded-lg px-2 py-1.5 text-sm",
                                good && "bg-correct/10",
                                bad && "bg-destructive/8"
                              )}
                            >
                              <span className="font-mono font-semibold">{c.key}</span>
                              <span className="flex-1">{c.text}</span>
                              {good && <Check className="size-4 text-correct" />}
                              {bad && <X className="size-4 text-destructive" />}
                            </li>
                          );
                        })}
                      </ul>
                      {q.explanation && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {q.explanation}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {blanks.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-xl">Skipped</h2>
          <div className="grid gap-2">
            {blanks.map((q) => (
              <Card key={q.id} className="bg-card/95">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal leading-snug">
                    {q.stem}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Correct: <span className="font-mono font-semibold">{q.answer}</span>
                  {q.explanation ? ` — ${q.explanation}` : ""}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {misses.length === 0 && blanks.length === 0 && (
        <p className="text-center text-muted-foreground">
          Clean sheet. Every answer matched the key.
        </p>
      )}
    </div>
  );
}
