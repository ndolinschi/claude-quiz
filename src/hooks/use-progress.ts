"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Question } from "@/data/types";
import {
  type ActiveSession,
  type SessionHistoryItem,
  applyAnswerSubmission,
  appendHistory,
  clearActiveSession as clearSessionInStore,
  getProgressStoreSnapshot,
  getRemainingQuota,
  getServerSnapshot,
  hasProAccess,
  setActiveSession as setSessionInStore,
  setDebugPro as setDebugProInStore,
  subscribeProgressStore,
  updateActiveSessionIndex as updateSessionIndexInStore,
} from "@/lib/progress-store";

const emptySubscribe = () => () => {};

export function useProgress() {
  const store = useSyncExternalStore(
    subscribeProgressStore,
    getProgressStoreSnapshot,
    getServerSnapshot
  );

  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isPro = hasProAccess(store);
  const remainingQuota = getRemainingQuota(store);

  const recordAnswer = useCallback(
    (question: Question, selectedKey: string) => {
      const isAlreadyAnsweredInSession = Boolean(
        store.activeSession?.answers[question.id]
      );
      const isCorrect = selectedKey === question.answer;
      applyAnswerSubmission(store, {
        questionId: question.id,
        selectedKey,
        isCorrect,
        domain: question.domains?.[0],
        tags: question.tags,
        isNewSubmissionInSession: !isAlreadyAnsweredInSession,
      });
    },
    [store]
  );

  const startSession = useCallback(
    (session: ActiveSession) => {
      setSessionInStore(store, session);
    },
    [store]
  );

  const updateSessionIndex = useCallback(
    (index: number) => {
      updateSessionIndexInStore(store, index);
    },
    [store]
  );

  const cancelSession = useCallback(() => {
    clearSessionInStore(store);
  }, [store]);

  const finishSession = useCallback(
    (params: {
      score: number;
      total: number;
      domains: string[];
      tags: string[];
    }) => {
      if (hasProAccess(store) && store.activeSession) {
        const item: SessionHistoryItem = {
          id: store.activeSession.id,
          startedAt: store.activeSession.startedAt,
          endedAt: new Date().toISOString(),
          score: params.score,
          total: params.total,
          domains: params.domains,
          tags: params.tags,
        };
        appendHistory(store, item);
      }
      clearSessionInStore(store);
    },
    [store]
  );

  const setDebugPro = useCallback(
    (enabled: boolean) => {
      setDebugProInStore(store, enabled);
    },
    [store]
  );

  const clearActive = useCallback(() => {
    clearSessionInStore(store);
  }, [store]);

  return {
    store,
    hydrated,
    isPro,
    remainingQuota,
    recordAnswer,
    startSession,
    updateSessionIndex,
    cancelSession,
    finishSession,
    setDebugPro,
    clearActiveSession: clearActive,
  };
}
