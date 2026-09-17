import type { Question } from "@/data/types";
import bank from "@/data/questions.json";

export const QUESTION_BANK = bank as Question[];
export const TOTAL_QUESTIONS = QUESTION_BANK.length;
export const PRACTICE_SETS = Array.from(
  new Set(QUESTION_BANK.map((q) => q.set))
).sort((a, b) => a - b);

export const SET_COUNTS: Record<number, number> = PRACTICE_SETS.reduce(
  (acc, set) => {
    acc[set] = QUESTION_BANK.filter((q) => q.set === set).length;
    return acc;
  },
  {} as Record<number, number>
);

export type CountPreset = 10 | 25 | 50 | 100 | "all" | "custom";
export type TimePreset = 0 | 15 | 30 | 45 | 60 | 90;
export type FeedbackMode = "instant" | "exam";

export type SetupConfig = {
  countPreset: CountPreset;
  customCount: number;
  timeMinutes: TimePreset;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  feedback: FeedbackMode;
  sets: number[];
};

export const DEFAULT_SETUP: SetupConfig = {
  countPreset: 25,
  customCount: 25,
  timeMinutes: 0,
  shuffleQuestions: true,
  shuffleChoices: false,
  feedback: "instant",
  sets: [],
};

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function poolForSets(sets: number[]): Question[] {
  if (!sets.length) return QUESTION_BANK;
  const selected = new Set(sets);
  return QUESTION_BANK.filter((q) => selected.has(q.set));
}

export function resolveCount(config: SetupConfig, poolSize: number): number {
  if (config.countPreset === "all") return poolSize;
  if (config.countPreset === "custom") {
    return Math.min(poolSize, Math.max(1, Math.floor(config.customCount) || 1));
  }
  return Math.min(poolSize, config.countPreset);
}

export function buildSession(config: SetupConfig): Question[] {
  let pool = poolForSets(config.sets);
  pool = config.shuffleQuestions ? shuffle(pool) : [...pool];
  const n = resolveCount(config, pool.length);
  const picked = pool.slice(0, n);
  if (!config.shuffleChoices) return picked;
  return picked.map((q) => ({ ...q, choices: shuffle(q.choices) }));
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function scoreSession(
  items: Question[],
  answers: Record<string, string>
) {
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  for (const q of items) {
    const chosen = answers[q.id];
    if (!chosen) blank += 1;
    else if (chosen === q.answer) correct += 1;
    else wrong += 1;
  }
  const percent = items.length
    ? Math.round((correct / items.length) * 100)
    : 0;
  return { correct, wrong, blank, percent, total: items.length };
}
