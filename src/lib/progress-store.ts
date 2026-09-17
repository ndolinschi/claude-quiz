import type { SetupConfig } from "@/lib/quiz";

export type AnsweredRecord = {
  correct: boolean;
  at: string;
  domain?: string;
  tags?: string[];
};

export type SessionHistoryItem = {
  id: string;
  startedAt: string;
  endedAt: string;
  score: number;
  total: number;
  domains: string[];
  tags: string[];
};

export type ActiveSession = {
  id: string;
  config: SetupConfig;
  questionIds: string[];
  index: number;
  answers: Record<string, string>;
  startedAt: string;
};

export type ProgressStore = {
  v: 1;
  pro: boolean;
  debugPro: boolean;
  dayKey: string;
  questionsToday: number;
  answered: Record<string, AnsweredRecord>;
  history: Array<SessionHistoryItem>;
  activeSession: null | ActiveSession;
};

export const STORAGE_KEY = "claude-quiz-lab-v1";
export const FREE_DAILY_LIMIT = 50;

/**
 * Returns local YYYY-MM-DD string for daily rollover
 */
export function getLocalDayKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createInitialStore(): ProgressStore {
  return {
    v: 1,
    pro: false,
    debugPro: false,
    dayKey: getLocalDayKey(),
    questionsToday: 0,
    answered: {},
    history: [],
    activeSession: null,
  };
}

let cachedStore: ProgressStore | null = null;
const listeners = new Set<() => void>();

export function getProgressStoreSnapshot(): ProgressStore {
  if (!cachedStore) {
    cachedStore = loadProgressStore();
  }
  return cachedStore;
}

const SERVER_STORE = createInitialStore();
export function getServerSnapshot(): ProgressStore {
  return SERVER_STORE;
}

export function subscribeProgressStore(listener: () => void): () => void {
  listeners.add(listener);

  function handleStorage(e: StorageEvent) {
    if (e.key === STORAGE_KEY) {
      cachedStore = loadProgressStore();
      listener();
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

/**
 * Loads the ProgressStore safely from localStorage.
 * Handles schema migration, invalid JSON, and daily rollover.
 * Never throws.
 */
export function loadProgressStore(): ProgressStore {
  if (typeof window === "undefined") {
    return createInitialStore();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialStore();
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || parsed.v !== 1) {
      // Incompatible version or corrupted format; reset safely
      const fresh = createInitialStore();
      saveProgressStore(fresh);
      return fresh;
    }

    const today = getLocalDayKey();
    const isNewDay = parsed.dayKey !== today;
    const isDebugPro = Boolean(parsed.debugPro);
    const isPro = Boolean(parsed.pro || isDebugPro);

    const store: ProgressStore = {
      v: 1,
      pro: isPro,
      debugPro: isDebugPro,
      dayKey: today,
      questionsToday: isNewDay
        ? 0
        : typeof parsed.questionsToday === "number"
          ? Math.max(0, parsed.questionsToday)
          : 0,
      answered:
        parsed.answered && typeof parsed.answered === "object"
          ? parsed.answered
          : {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
      activeSession:
        parsed.activeSession && typeof parsed.activeSession === "object"
          ? parsed.activeSession
          : null,
    };

    if (isNewDay) {
      saveProgressStore(store);
    }
    return store;
  } catch {
    return createInitialStore();
  }
}

/**
 * Saves store to localStorage with try/catch to soft-degrade if quota/private mode.
 */
export function saveProgressStore(store: ProgressStore): void {
  cachedStore = store;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Soft degrade - silently retain in-memory state
    }
  }
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Computes remaining questions allowed today for free tier.
 */
export function getRemainingQuota(store: ProgressStore): number {
  if (store.pro || store.debugPro) {
    return Infinity;
  }
  const today = getLocalDayKey();
  const count = store.dayKey === today ? store.questionsToday : 0;
  return Math.max(0, FREE_DAILY_LIMIT - count);
}

/**
 * Applies an answer submission:
 * - Records question in answered map with status, timestamp, domain, tags
 * - Increments daily question count (if not already answered in this session)
 * - Updates activeSession.answers
 */
export function applyAnswerSubmission(
  store: ProgressStore,
  params: {
    questionId: string;
    selectedKey: string;
    isCorrect: boolean;
    domain?: string;
    tags?: string[];
    isNewSubmissionInSession?: boolean;
  }
): ProgressStore {
  const today = getLocalDayKey();
  const isNewDay = store.dayKey !== today;
  const currentCount = isNewDay ? 0 : store.questionsToday;
  const increment = params.isNewSubmissionInSession !== false ? 1 : 0;

  const nextStore: ProgressStore = {
    ...store,
    dayKey: today,
    questionsToday: currentCount + increment,
    answered: {
      ...store.answered,
      [params.questionId]: {
        correct: params.isCorrect,
        at: new Date().toISOString(),
        domain: params.domain,
        tags: params.tags,
      },
    },
    activeSession: store.activeSession
      ? {
          ...store.activeSession,
          answers: {
            ...store.activeSession.answers,
            [params.questionId]: params.selectedKey,
          },
        }
      : null,
  };

  saveProgressStore(nextStore);
  return nextStore;
}

/**
 * Updates or sets the active session.
 */
export function setActiveSession(
  store: ProgressStore,
  activeSession: ActiveSession | null
): ProgressStore {
  const nextStore: ProgressStore = {
    ...store,
    activeSession,
  };
  saveProgressStore(nextStore);
  return nextStore;
}

/**
 * Updates current index of active session.
 */
export function updateActiveSessionIndex(
  store: ProgressStore,
  index: number
): ProgressStore {
  if (!store.activeSession) return store;
  const nextStore: ProgressStore = {
    ...store,
    activeSession: {
      ...store.activeSession,
      index,
    },
  };
  saveProgressStore(nextStore);
  return nextStore;
}

/**
 * Clears active session (e.g. on cancel or finish).
 */
export function clearActiveSession(store: ProgressStore): ProgressStore {
  const nextStore: ProgressStore = {
    ...store,
    activeSession: null,
  };
  saveProgressStore(nextStore);
  return nextStore;
}

/**
 * Toggles or sets Debug Pro mode.
 * When on: debugPro = true, pro = true
 * When off: debugPro = false, pro = false
 */
export function setDebugPro(
  store: ProgressStore,
  enabled: boolean
): ProgressStore {
  const nextStore: ProgressStore = {
    ...store,
    debugPro: enabled,
    pro: enabled,
  };
  saveProgressStore(nextStore);
  return nextStore;
}

/**
 * Appends a finished session to history.
 * Per spec, history is saved only for Pro users.
 */
export function appendHistory(
  store: ProgressStore,
  item: SessionHistoryItem
): ProgressStore {
  if (!store.pro && !store.debugPro) {
    return store;
  }
  const nextStore: ProgressStore = {
    ...store,
    history: [item, ...store.history],
  };
  saveProgressStore(nextStore);
  return nextStore;
}
