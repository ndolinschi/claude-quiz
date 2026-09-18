"use client";

import { useCallback, useState } from "react";
import type { Question } from "@/data/types";
import {
  DEFAULT_SETUP,
  QUESTION_BANK,
  buildSession,
  scoreSession,
  type SetupConfig,
} from "@/lib/quiz";
import type { ActiveSession } from "@/lib/progress-store";
import { useProgress } from "@/hooks/use-progress";
import { GuideScreen } from "./guide-screen";
import { ResultsScreen } from "./results-screen";
import { SessionScreen } from "./session-screen";
import { SetupScreen } from "./setup-screen";

type Phase = "setup" | "quiz" | "results" | "guide";

export function QuizApp() {
  const progress = useProgress();

  const [phase, setPhase] = useState<Phase>("setup");
  const [config, setConfig] = useState<SetupConfig>(DEFAULT_SETUP);
  const [items, setItems] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startedAt, setStartedAt] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);

  const finish = useCallback(() => {
    const ended = Date.now();
    setEndedAt(ended);
    setPhase("results");

    const stats = scoreSession(items, answers);
    progress.finishSession({
      score: stats.correct,
      total: stats.total,
      domains: config.domains.length ? config.domains : ["All"],
      tags: config.tags,
    });
  }, [answers, config.domains, config.tags, items, progress]);

  const start = useCallback(() => {
    if (!progress.isPro && progress.remainingQuota <= 0) {
      return;
    }

    let sessionItems = buildSession(config);
    // Clamp to remaining daily quota if on free tier
    if (!progress.isPro && sessionItems.length > progress.remainingQuota) {
      sessionItems = sessionItems.slice(0, progress.remainingQuota);
    }

    if (sessionItems.length === 0) return;

    const startedAtMs = Date.now();
    const deadlineMs =
      config.timeMinutes > 0 ? startedAtMs + config.timeMinutes * 60_000 : null;

    const sessionId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const activeSession: ActiveSession = {
      id: sessionId,
      config,
      questionIds: sessionItems.map((q) => q.id),
      index: 0,
      answers: {},
      startedAt: new Date(startedAtMs).toISOString(),
    };

    progress.startSession(activeSession);

    setItems(sessionItems);
    setIndex(0);
    setAnswers({});
    setStartedAt(startedAtMs);
    setDeadline(deadlineMs);
    setEndedAt(null);
    setPhase("quiz");
  }, [config, progress]);

  const resume = useCallback(() => {
    const active = progress.store.activeSession;
    if (!active) return;

    const restoredItems = active.questionIds
      .map((id) => QUESTION_BANK.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q));

    if (restoredItems.length === 0) {
      progress.clearActiveSession();
      return;
    }

    const startedAtMs = Date.parse(active.startedAt) || Date.now();
    const deadlineMs =
      active.config.timeMinutes > 0
        ? startedAtMs + active.config.timeMinutes * 60_000
        : null;

    setItems(restoredItems);
    setConfig(active.config);
    setIndex(Math.min(active.index, restoredItems.length - 1));
    setAnswers(active.answers || {});
    setStartedAt(startedAtMs);
    setDeadline(deadlineMs);
    setEndedAt(null);
    setPhase("quiz");
  }, [progress]);

  const cancel = useCallback(() => {
    progress.cancelSession();
    setPhase("setup");
    setItems([]);
    setAnswers({});
  }, [progress]);

  const retry = useCallback(() => {
    if (!progress.isPro && progress.remainingQuota <= 0) {
      setPhase("setup");
      return;
    }

    let retryItems = [...items];
    if (!progress.isPro && retryItems.length > progress.remainingQuota) {
      retryItems = retryItems.slice(0, progress.remainingQuota);
    }

    if (retryItems.length === 0) {
      setPhase("setup");
      return;
    }

    const startedAtMs = Date.now();
    const deadlineMs =
      config.timeMinutes > 0 ? startedAtMs + config.timeMinutes * 60_000 : null;

    const sessionId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const activeSession: ActiveSession = {
      id: sessionId,
      config,
      questionIds: retryItems.map((q) => q.id),
      index: 0,
      answers: {},
      startedAt: new Date(startedAtMs).toISOString(),
    };

    progress.startSession(activeSession);

    setItems(retryItems);
    setIndex(0);
    setAnswers({});
    setStartedAt(startedAtMs);
    setDeadline(deadlineMs);
    setEndedAt(null);
    setPhase("quiz");
  }, [config, items, progress]);

  if (!progress.hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Warming the lab…
      </div>
    );
  }

  if (phase === "quiz" && items.length > 0) {
    return (
      <SessionScreen
        items={items}
        config={config}
        index={index}
        answers={answers}
        startedAt={startedAt}
        deadline={deadline}
        onSelect={(id, key) =>
          setAnswers((prev) => ({
            ...prev,
            [id]: key,
          }))
        }
        onSubmitAnswer={(question, selectedKey) => {
          setAnswers((prev) => ({
            ...prev,
            [question.id]: selectedKey,
          }));
          progress.recordAnswer(question, selectedKey);
        }}
        onNext={() => {
          if (index >= items.length - 1) {
            finish();
            return;
          }
          const nextIndex = index + 1;
          setIndex(nextIndex);
          progress.updateSessionIndex(nextIndex);
        }}
        onCancel={cancel}
        onExpire={finish}
      />
    );
  }

  if (phase === "results") {
    const ended = endedAt ?? startedAt;
    return (
      <ResultsScreen
        items={items}
        answers={answers}
        config={config}
        elapsedMs={Math.max(0, ended - startedAt)}
        isPro={progress.isPro}
        onUnlockPro={() => progress.setDebugPro(true)}
        onRetry={retry}
        onReshuffle={start}
        onSetup={() => {
          setPhase("setup");
          setItems([]);
          setAnswers({});
        }}
      />
    );
  }

  if (phase === "guide") {
    return <GuideScreen onBack={() => setPhase("setup")} />;
  }

  return (
    <SetupScreen
      config={config}
      onChange={setConfig}
      onStart={start}
      store={progress.store}
      isPro={progress.isPro}
      remainingQuota={progress.remainingQuota}
      onUnlockDebugPro={progress.setDebugPro}
      onResumeSession={resume}
      onDiscardResume={progress.clearActiveSession}
      onOpenGuide={() => setPhase("guide")}
    />
  );
}
