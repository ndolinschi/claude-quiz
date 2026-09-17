"use client";

import { useCallback, useEffect, useState } from "react";
import type { Question } from "@/data/types";
import {
  DEFAULT_SETUP,
  buildSession,
  type SetupConfig,
} from "@/lib/quiz";
import { ResultsScreen } from "./results-screen";
import { SessionScreen } from "./session-screen";
import { SetupScreen } from "./setup-screen";

type Phase = "setup" | "quiz" | "results";

type Store = {
  phase: Phase;
  config: SetupConfig;
  items: Question[];
  index: number;
  answers: Record<string, string>;
  startedAt: number;
  deadline: number | null;
  endedAt: number | null;
};

const STORAGE_KEY = "claude-quiz-lab-v1";

const EMPTY: Store = {
  phase: "setup",
  config: DEFAULT_SETUP,
  items: [],
  index: 0,
  answers: {},
  startedAt: 0,
  deadline: null,
  endedAt: null,
};

function loadStore(): Store {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Store;
    if (!parsed?.phase) return EMPTY;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

function persist(store: Store) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

function begin(config: SetupConfig): Store {
  const items = buildSession(config);
  const startedAt = Date.now();
  const deadline =
    config.timeMinutes > 0 ? startedAt + config.timeMinutes * 60_000 : null;
  return {
    phase: "quiz",
    config,
    items,
    index: 0,
    answers: {},
    startedAt,
    deadline,
    endedAt: null,
  };
}

export function QuizApp() {
  const [store, setStore] = useState<Store>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(loadStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persist(store);
  }, [hydrated, store]);

  const finish = useCallback(() => {
    setStore((s) => ({
      ...s,
      phase: "results",
      endedAt: Date.now(),
    }));
  }, []);

  const start = useCallback(() => {
    setStore((s) => begin(s.config));
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Warming the lab…
      </div>
    );
  }

  if (store.phase === "quiz" && store.items.length > 0) {
    return (
      <SessionScreen
        items={store.items}
        config={store.config}
        index={store.index}
        answers={store.answers}
        startedAt={store.startedAt}
        deadline={store.deadline}
        onSelect={(id, key) =>
          setStore((s) => ({
            ...s,
            answers: { ...s.answers, [id]: key },
          }))
        }
        onNext={() =>
          setStore((s) => {
            if (s.index >= s.items.length - 1) {
              return { ...s, phase: "results", endedAt: Date.now() };
            }
            return { ...s, index: s.index + 1 };
          })
        }
        onQuit={finish}
        onExpire={finish}
      />
    );
  }

  if (store.phase === "results") {
    const ended = store.endedAt ?? Date.now();
    return (
      <ResultsScreen
        items={store.items}
        answers={store.answers}
        config={store.config}
        elapsedMs={Math.max(0, ended - store.startedAt)}
        onRetry={() =>
          setStore((s) => ({
            ...s,
            phase: "quiz",
            index: 0,
            answers: {},
            startedAt: Date.now(),
            deadline:
              s.config.timeMinutes > 0
                ? Date.now() + s.config.timeMinutes * 60_000
                : null,
            endedAt: null,
          }))
        }
        onReshuffle={() => setStore((s) => begin(s.config))}
        onSetup={() =>
          setStore((s) => ({
            ...EMPTY,
            config: s.config,
          }))
        }
      />
    );
  }

  return (
    <SetupScreen
      config={store.config}
      onChange={(config) => setStore((s) => ({ ...s, config }))}
      onStart={start}
    />
  );
}
