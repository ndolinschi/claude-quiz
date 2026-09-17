"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Clock, Flag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCountdown } from "@/hooks/use-countdown";
import { formatClock, type SetupConfig } from "@/lib/quiz";
import type { Question } from "@/data/types";
import { cn } from "@/lib/utils";

export function SessionScreen({
  items,
  config,
  index,
  answers,
  startedAt,
  deadline,
  onSelect,
  onNext,
  onQuit,
  onExpire,
}: {
  items: Question[];
  config: SetupConfig;
  index: number;
  answers: Record<string, string>;
  startedAt: number;
  deadline: number | null;
  onSelect: (questionId: string, key: string) => void;
  onNext: () => void;
  onQuit: () => void;
  onExpire: () => void;
}) {
  const question = items[index];
  const selected = answers[question.id] ?? "";
  const instant = config.feedback === "instant";
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [question.id]);

  const remainingMs = useCountdown(deadline, deadline != null, onExpire);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const displayProgress = ((index + (revealed ? 1 : 0)) / items.length) * 100;

  const isCorrect = selected === question.answer;
  const last = index >= items.length - 1;

  const submitOrAdvance = useCallback(() => {
    if (instant) {
      if (!revealed) {
        if (!selected) return;
        setRevealed(true);
        return;
      }
      onNext();
      return;
    }
    onNext();
  }, [instant, onNext, revealed, selected]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toUpperCase();
      if (["A", "B", "C", "D"].includes(k) && !revealed) {
        const exists = question.choices.some((c) => c.key === k);
        if (exists) {
          e.preventDefault();
          onSelect(question.id, k);
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        submitOrAdvance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect, question, revealed, submitOrAdvance]);

  const timerLabel = useMemo(() => {
    if (remainingMs == null) return formatClock(elapsed);
    return formatClock(Math.ceil(remainingMs / 1000));
  }, [elapsed, remainingMs]);

  const timerUrgent =
    remainingMs != null && remainingMs < 60_000 && remainingMs > 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-4 sm:py-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-copper/30 font-mono">
            Set {question.set}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {index + 1} / {items.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-mono text-sm tabular-nums",
              timerUrgent ? "text-destructive" : "text-foreground"
            )}
          >
            <Clock className="size-3.5" />
            {timerLabel}
          </span>
          <Button variant="ghost" size="sm" onClick={onQuit}>
            <Flag className="size-3.5" />
            End
          </Button>
        </div>
      </div>

      <Progress value={displayProgress} className="mb-5" />

      <Card className="flex-1 bg-card/95 shadow-sm">
        <CardContent className="pt-1">
          <p className="font-heading text-lg leading-relaxed text-pretty text-ink sm:text-xl">
            {question.stem}
          </p>

          <div className="mt-6 grid gap-2">
            {question.choices.map((choice) => {
              const isSel = selected === choice.key;
              const showMark = revealed;
              const isAns = choice.key === question.answer;
              return (
                <button
                  key={choice.key}
                  type="button"
                  disabled={revealed}
                  onClick={() => onSelect(question.id, choice.key)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all sm:px-4",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    !showMark &&
                      (isSel
                        ? "border-primary bg-primary/8 shadow-[inset_0_0_0_1px_var(--primary)]"
                        : "border-border bg-background hover:border-primary/40 hover:bg-accent/60"),
                    showMark &&
                      isAns &&
                      "border-correct bg-correct/10 shadow-[inset_0_0_0_1px_var(--correct)]",
                    showMark &&
                      isSel &&
                      !isAns &&
                      "border-destructive bg-destructive/8"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-sm font-semibold",
                      !showMark &&
                        (isSel
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"),
                      showMark &&
                        isAns &&
                        "bg-correct text-white",
                      showMark &&
                        isSel &&
                        !isAns &&
                        "bg-destructive text-white"
                    )}
                  >
                    {choice.key}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] leading-snug">
                    {choice.text}
                  </span>
                  {showMark && isAns && (
                    <Check className="mt-1 size-4 shrink-0 text-correct" />
                  )}
                  {showMark && isSel && !isAns && (
                    <X className="mt-1 size-4 shrink-0 text-destructive" />
                  )}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div
              className={cn(
                "mt-5 rounded-xl border px-4 py-3",
                isCorrect
                  ? "border-correct/30 bg-correct/8"
                  : "border-destructive/25 bg-destructive/6"
              )}
            >
              <p className="mb-1 text-sm font-semibold">
                {isCorrect ? "Correct" : `Answer: ${question.answer}`}
              </p>
              {question.explanation ? (
                <p className="text-sm leading-relaxed text-pretty text-foreground/85">
                  {question.explanation}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No explanation in the source bank for this item.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-3 bg-background/80 py-3 backdrop-blur-md">
        <p className="hidden text-xs text-muted-foreground sm:block">
          Press A–D to choose · Enter to{" "}
          {instant ? (revealed ? "continue" : "submit") : "continue"}
        </p>
        <Button
          size="lg"
          className="ml-auto h-11 rounded-full px-6"
          onClick={submitOrAdvance}
          disabled={instant ? !selected && !revealed : false}
        >
          {instant
            ? revealed
              ? last
                ? "See results"
                : "Next"
              : "Submit"
            : last
              ? "See results"
              : "Next"}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
