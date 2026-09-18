"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useCountdown } from "@/hooks/use-countdown";
import { formatClock, type SetupConfig } from "@/lib/quiz";
import type { Question } from "@/data/types";
import { cn } from "@/lib/utils";
import {
  useTelegram,
  useTelegramBackButton,
  useTelegramMainButton,
} from "@/hooks/use-telegram";

export function SessionScreen({
  items,
  config,
  index,
  answers,
  startedAt,
  deadline,
  onSelect,
  onSubmitAnswer,
  onNext,
  onCancel,
  onExpire,
}: {
  items: Question[];
  config: SetupConfig;
  index: number;
  answers: Record<string, string>;
  startedAt: number;
  deadline: number | null;
  onSelect: (questionId: string, key: string) => void;
  onSubmitAnswer: (question: Question, selectedKey: string) => void;
  onNext: () => void;
  onCancel: () => void;
  onExpire: () => void;
}) {
  const question = items[index];
  const selected = answers[question.id] ?? "";
  const instant = config.feedback === "instant";
  const [prevQuestionId, setPrevQuestionId] = useState(question.id);
  const [revealed, setRevealed] = useState(() =>
    Boolean(instant && answers[question.id])
  );
  const [cancelOpen, setCancelOpen] = useState(false);

  if (question.id !== prevQuestionId) {
    setPrevQuestionId(question.id);
    setRevealed(Boolean(instant && answers[question.id]));
  }

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
        onSubmitAnswer(question, selected);
        setRevealed(true);
        return;
      }
      onNext();
      return;
    }
    // Exam mode: advance records answer if selected
    if (selected) {
      onSubmitAnswer(question, selected);
    }
    onNext();
  }, [instant, onNext, onSubmitAnswer, question, revealed, selected]);

  const tg = useTelegram();
  const mainLabel = instant
    ? revealed
      ? last
        ? "Results"
        : "Next"
      : "Submit"
    : last
      ? "Results"
      : "Next";
  useTelegramMainButton(
    {
      text: mainLabel,
      enabled: instant ? Boolean(selected) || revealed : true,
      onClick: () => {
        tg.haptic("impact");
        submitOrAdvance();
      },
    },
    tg.booted
  );
  useTelegramBackButton(() => {
    tg.haptic("warning");
    setCancelOpen(true);
  }, tg.booted);

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

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {index + 1}
            <span className="mx-0.5 opacity-50">/</span>
            {items.length}
          </span>
          {question.domains?.[0] && (
            <Badge
              variant="outline"
              className="max-w-[9.5rem] truncate border-copper/25 bg-card/80 text-[10px] sm:max-w-none sm:text-xs"
            >
              {question.domains[0]}
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 font-mono text-sm tabular-nums",
              timerUrgent ? "font-semibold text-destructive" : "text-foreground"
            )}
          >
            <Clock className="size-3.5 opacity-70" />
            {timerLabel}
          </span>
          <Button
            variant="outline"
            className="h-11 rounded-xl px-3"
            onClick={() => setCancelOpen(true)}
          >
            Cancel
          </Button>
        </div>
      </div>

      <Progress value={displayProgress} className="mb-4 h-1.5" />

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel quiz?</DialogTitle>
            <DialogDescription>
              Your {answeredCount} answer{answeredCount === 1 ? "" : "s"} submitted
              so far will be kept in your theme coverage and daily quota, but
              this active session will end.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep practicing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setCancelOpen(false);
                onCancel();
              }}
            >
              Cancel session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mb-3 flex-1 overflow-hidden border-0 bg-transparent shadow-none">
        <CardContent className="px-3.5 pt-1 pb-4 sm:px-5">
          <p className="font-heading text-[1.05rem] leading-relaxed text-pretty break-words text-ink sm:text-xl">
            {question.stem}
          </p>

          {(question.tags?.length ?? 0) > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {question.tags.slice(0, 4).map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="h-5 font-mono text-[10px] font-normal"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-5 grid gap-2.5">
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
                    "flex w-full min-h-16 items-start gap-3 rounded-2xl border px-3.5 py-3.5 text-left text-base transition-all",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    "active:scale-[0.99]",
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
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-semibold",
                      !showMark &&
                        (isSel
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"),
                      showMark && isAns && "bg-correct text-white",
                      showMark &&
                        isSel &&
                        !isAns &&
                        "bg-destructive text-white"
                    )}
                  >
                    {choice.key}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] leading-snug break-words">
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
                "mt-5 rounded-2xl border px-4 py-3.5",
                isCorrect
                  ? "border-correct/30 bg-correct/8"
                  : "border-destructive/25 bg-destructive/6"
              )}
            >
              <p className="mb-1 text-sm font-semibold">
                {isCorrect ? "Correct" : `Answer: ${question.answer}`}
              </p>
              {question.explanation ? (
                <p className="text-sm leading-relaxed text-pretty break-words text-foreground/85">
                  {question.explanation.replace(/\s*Domain\(s\):.*$/i, "")}
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

      <div className={cn(
        "sticky bottom-0 z-10 -mx-3 mt-auto border-t border-border/50 bg-background/95 px-3 pt-3 backdrop-blur-md",
        tg.inTelegram
          ? "pb-[max(5.5rem,env(safe-area-inset-bottom))]"
          : "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      )}>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-14 rounded-2xl px-4"
            onClick={() => setCancelOpen(true)}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            className="h-14 flex-1 rounded-2xl px-6 text-base font-semibold"
            onClick={() => {
              tg.haptic("impact");
              submitOrAdvance();
            }}
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
    </div>
  );
}
