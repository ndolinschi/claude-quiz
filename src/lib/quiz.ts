import type { Domain, Question } from "@/data/types";
import bank from "@/data/questions.json";

export type { Domain };

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

export const DOMAIN_LIST: Domain[] = [
  "Tools",
  "MCP",
  "Subagents",
  "Sessions",
  "Memory/CLAUDE.md",
  "Permissions",
  "Hooks",
  "Skills",
  "Prompting",
  "Architecture",
];

export const DOMAIN_COUNTS: Record<Domain, number> = DOMAIN_LIST.reduce(
  (acc, d) => {
    acc[d] = QUESTION_BANK.filter((q) => q.domains?.includes(d)).length;
    return acc;
  },
  {} as Record<Domain, number>
);

export const ALL_TAGS: string[] = (() => {
  const counts = new Map<string, number>();
  for (const q of QUESTION_BANK) {
    for (const t of q.tags || []) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
})();

export const TAG_COUNTS: Record<string, number> = ALL_TAGS.reduce(
  (acc, t) => {
    acc[t] = QUESTION_BANK.filter((q) => q.tags?.includes(t)).length;
    return acc;
  },
  {} as Record<string, number>
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
  domains: Domain[];
  tags: string[];
};

export const DEFAULT_SETUP: SetupConfig = {
  countPreset: 25,
  customCount: 25,
  timeMinutes: 0,
  shuffleQuestions: true,
  shuffleChoices: false,
  feedback: "instant",
  sets: [],
  domains: [],
  tags: [],
};

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function filterPool(config: Pick<SetupConfig, "sets" | "domains" | "tags">): Question[] {
  let pool = QUESTION_BANK;
  if (config.sets.length) {
    const selected = new Set(config.sets);
    pool = pool.filter((q) => selected.has(q.set));
  }
  if (config.domains.length) {
    const selected = new Set(config.domains);
    pool = pool.filter((q) => (q.domains || []).some((d) => selected.has(d)));
  }
  if (config.tags.length) {
    const selected = new Set(config.tags);
    pool = pool.filter((q) => (q.tags || []).some((t) => selected.has(t)));
  }
  return pool;
}

/** @deprecated use filterPool */
export function poolForSets(sets: number[]): Question[] {
  return filterPool({ sets, domains: [], tags: [] });
}

export function resolveCount(config: SetupConfig, poolSize: number): number {
  if (config.countPreset === "all") return poolSize;
  if (config.countPreset === "custom") {
    return Math.min(poolSize, Math.max(1, Math.floor(config.customCount) || 1));
  }
  return Math.min(poolSize, config.countPreset);
}

export function buildSession(config: SetupConfig): Question[] {
  let pool = filterPool(config);
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

export type DomainBreakdownRow = {
  domain: Domain;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  percent: number;
};

export function domainBreakdown(
  items: Question[],
  answers: Record<string, string>
): DomainBreakdownRow[] {
  const map = new Map<Domain, DomainBreakdownRow>();
  for (const q of items) {
    const domains = q.domains?.length ? q.domains : (["Architecture"] as Domain[]);
    const chosen = answers[q.id];
    const status =
      !chosen ? "blank" : chosen === q.answer ? "correct" : "wrong";
    for (const d of domains) {
      let row = map.get(d);
      if (!row) {
        row = { domain: d, total: 0, correct: 0, wrong: 0, blank: 0, percent: 0 };
        map.set(d, row);
      }
      row.total += 1;
      if (status === "correct") row.correct += 1;
      else if (status === "wrong") row.wrong += 1;
      else row.blank += 1;
    }
  }
  return [...map.values()]
    .map((r) => ({
      ...r,
      percent: r.total ? Math.round((r.correct / r.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total || a.domain.localeCompare(b.domain));
}

export type CoverageRow = {
  name: string;
  total: number;
  answered: number;
  percent: number;
  correct: number;
};

export function getDomainCoverage(
  answered: Record<string, { correct: boolean }>
): CoverageRow[] {
  return DOMAIN_LIST.map((domain) => {
    const questions = QUESTION_BANK.filter((q) => q.domains?.includes(domain));
    const total = questions.length;
    let answeredCount = 0;
    let correctCount = 0;
    for (const q of questions) {
      const rec = answered[q.id];
      if (rec) {
        answeredCount += 1;
        if (rec.correct) correctCount += 1;
      }
    }
    const percent = total ? Math.round((answeredCount / total) * 100) : 0;
    return {
      name: domain,
      total,
      answered: answeredCount,
      percent,
      correct: correctCount,
    };
  });
}

export function getTopTagCoverage(
  answered: Record<string, { correct: boolean }>,
  limit: number = 12
): CoverageRow[] {
  return ALL_TAGS.slice(0, limit).map((tag) => {
    const questions = QUESTION_BANK.filter((q) => q.tags?.includes(tag));
    const total = questions.length;
    let answeredCount = 0;
    let correctCount = 0;
    for (const q of questions) {
      const rec = answered[q.id];
      if (rec) {
        answeredCount += 1;
        if (rec.correct) correctCount += 1;
      }
    }
    const percent = total ? Math.round((answeredCount / total) * 100) : 0;
    return {
      name: tag,
      total,
      answered: answeredCount,
      percent,
      correct: correctCount,
    };
  });
}

export function getOverallCoverage(
  answered: Record<string, { correct: boolean }>
): {
  total: number;
  answered: number;
  percent: number;
  correct: number;
} {
  const total = TOTAL_QUESTIONS;
  let answeredCount = 0;
  let correctCount = 0;
  for (const q of QUESTION_BANK) {
    const rec = answered[q.id];
    if (rec) {
      answeredCount += 1;
      if (rec.correct) correctCount += 1;
    }
  }
  const percent = total ? Math.round((answeredCount / total) * 100) : 0;
  return {
    total,
    answered: answeredCount,
    percent,
    correct: correctCount,
  };
}

