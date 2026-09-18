"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BookOpen, ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ALL_TAGS,
  DOMAIN_LIST,
  PRACTICE_SETS,
  SET_COUNTS,
  TAG_COUNTS,
  DOMAIN_COUNTS,
  filterPool,
  getOverallCoverage,
  resolveCount,
  type CountPreset,
  type Domain,
  type SetupConfig,
  type TimePreset,
} from "@/lib/quiz";
import type { ProgressStore } from "@/lib/progress-store";
import { FREE_DAILY_LIMIT, PRO_FOR_EVERYONE } from "@/lib/progress-store";
import { ProgressPanel } from "./progress-panel";
import { PaywallCard } from "./paywall-card";
import { DebugProToggle } from "./debug-pro-toggle";
import { cn } from "@/lib/utils";
import {
  useTelegram,
  useTelegramMainButton,
} from "@/hooks/use-telegram";

const COUNT_PRESETS: { value: CountPreset; label: string }[] = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: "all", label: "All" },
  { value: "custom", label: "#" },
];

const TIME_PRESETS: { value: TimePreset; label: string }[] = [
  { value: 0, label: "Off" },
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 45, label: "45" },
  { value: 60, label: "60" },
  { value: 90, label: "90" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-12 min-w-12 rounded-2xl border px-3 text-sm font-semibold",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function SetupScreen({
  config,
  onChange,
  onStart,
  store,
  isPro,
  remainingQuota,
  onUnlockDebugPro,
  onResumeSession,
  onDiscardResume,
  onOpenGuide,
}: {
  config: SetupConfig;
  onChange: (next: SetupConfig) => void;
  onStart: () => void;
  store: ProgressStore;
  isPro: boolean;
  remainingQuota: number;
  onUnlockDebugPro: (enabled: boolean) => void;
  onResumeSession?: () => void;
  onDiscardResume?: () => void;
  onOpenGuide?: () => void;
}) {
  const tg = useTelegram();
  const [tagQuery, setTagQuery] = useState("");
  const pool = useMemo(() => filterPool(config), [config]);
  const count = resolveCount(config, pool.length);
  const exhausted = !isPro && remainingQuota <= 0;
  const clamped = !isPro && remainingQuota > 0 && remainingQuota < count;
  const effective = clamped ? remainingQuota : count;
  const canStart = pool.length > 0 && !exhausted && effective > 0;
  const coverage = useMemo(
    () => getOverallCoverage(store.answered),
    [store.answered]
  );

  const filteredTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    const list = q
      ? ALL_TAGS.filter((tag) => tag.toLowerCase().includes(q))
      : ALL_TAGS;
    const selected = config.tags.filter((tag) => !list.includes(tag));
    return [...selected, ...list].slice(0, 24);
  }, [tagQuery, config.tags]);

  const start = () => {
    if (!canStart) return;
    tg.haptic("impact");
    onStart();
  };

  useTelegramMainButton(
    {
      text:
        !PRO_FOR_EVERYONE && exhausted
          ? "Daily limit"
          : `Start · ${effective || 0}`,
      enabled: canStart,
      onClick: start,
    },
    tg.booted
  );

  const toggleDomain = (domain: Domain) => {
    const on = config.domains.includes(domain);
    onChange({
      ...config,
      domains: on
        ? config.domains.filter((item) => item !== domain)
        : [...config.domains, domain],
    });
  };

  const toggleTag = (tag: string) => {
    const on = config.tags.includes(tag);
    onChange({
      ...config,
      tags: on ? config.tags.filter((item) => item !== tag) : [...config.tags, tag],
    });
  };

  const toggleSet = (set: number) => {
    const on = config.sets.includes(set);
    onChange({
      ...config,
      sets: on
        ? config.sets.filter((item) => item !== set)
        : [...config.sets, set].sort((a, b) => a - b),
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="font-mono text-[11px] tracking-[0.22em] text-copper uppercase">
          Claude Quiz
        </p>
        <h1 className="font-heading text-[1.65rem] leading-tight text-ink">
          Practice on the go
        </h1>
        {tg.inTelegram ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {tg.firstName ? tg.firstName : "Opened in Telegram"}
          </p>
        ) : tg.booted ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Open @FableCryptoBot and tap Practice so progress stays on that
            Telegram user.
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">
          {coverage.answered} of {coverage.total} seen · {coverage.percent}% of
          the bank
          {PRO_FOR_EVERYONE || isPro
            ? " · Pro"
            : ` · ${Math.min(store.questionsToday, FREE_DAILY_LIMIT)}/${FREE_DAILY_LIMIT} today`}
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-28">
        {store.activeSession && (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-copper/30 bg-card px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Resume drill</p>
              <p className="text-xs text-muted-foreground">
                Question {store.activeSession.index + 1} of{" "}
                {store.activeSession.questionIds.length}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {onDiscardResume && (
                <Button
                  variant="outline"
                  className="h-11 rounded-xl px-3"
                  onClick={onDiscardResume}
                >
                  Discard
                </Button>
              )}
              {onResumeSession && (
                <Button className="h-11 rounded-xl px-3" onClick={onResumeSession}>
                  <Play className="size-4" />
                  Resume
                </Button>
              )}
            </div>
          </div>
        )}

        {!PRO_FOR_EVERYONE && exhausted && (
          <PaywallCard onUnlockDebugPro={() => onUnlockDebugPro(true)} />
        )}

        <section>
          <p className="mb-2 text-sm font-semibold">Questions</p>
          <div className="grid grid-cols-3 gap-2">
            {COUNT_PRESETS.map((opt) => (
              <Chip
                key={String(opt.value)}
                active={config.countPreset === opt.value}
                onClick={() => onChange({ ...config, countPreset: opt.value })}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
          {config.countPreset === "custom" && (
            <Input
              className="mt-2 h-12 text-base"
              inputMode="numeric"
              value={config.customCount}
              onChange={(event) =>
                onChange({
                  ...config,
                  customCount: Number(event.target.value) || 1,
                })
              }
              aria-label="Custom question count"
            />
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {pool.length} in the pool
            {clamped ? ` · free tier caps this run at ${remainingQuota}` : ""}
          </p>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold">Time limit, minutes</p>
          <div className="grid grid-cols-3 gap-2">
            {TIME_PRESETS.map((opt) => (
              <Chip
                key={opt.value}
                active={config.timeMinutes === opt.value}
                onClick={() => onChange({ ...config, timeMinutes: opt.value })}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </section>

        <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4">
          <span className="text-sm font-semibold">Shuffle questions</span>
          <Switch
            checked={config.shuffleQuestions}
            onCheckedChange={(on) =>
              onChange({ ...config, shuffleQuestions: on })
            }
            aria-label="Shuffle questions"
          />
        </label>

        <details className="rounded-2xl border border-border bg-card">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            Advanced
            <ChevronDown className="size-4 text-muted-foreground" />
          </summary>
          <div className="space-y-4 border-t border-border px-4 py-4">
            <div>
              <p className="mb-2 text-sm font-semibold">Feedback</p>
              <div className="grid grid-cols-2 gap-2">
                <Chip
                  active={config.feedback === "instant"}
                  onClick={() => onChange({ ...config, feedback: "instant" })}
                >
                  Instant
                </Chip>
                <Chip
                  active={config.feedback === "exam"}
                  onClick={() => onChange({ ...config, feedback: "exam" })}
                >
                  Exam
                </Chip>
              </div>
            </div>

            <label className="flex min-h-12 items-center justify-between gap-3">
              <span className="text-sm font-medium">Shuffle choices</span>
              <Switch
                checked={config.shuffleChoices}
                onCheckedChange={(on) =>
                  onChange({ ...config, shuffleChoices: on })
                }
                aria-label="Shuffle choices"
              />
            </label>

            <div>
              <p className="mb-2 text-sm font-semibold">
                Domains
                {config.domains.length === 0 && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    all
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {DOMAIN_LIST.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => toggleDomain(domain)}
                    className={cn(
                      "min-h-11 rounded-full border px-3 text-xs font-medium",
                      config.domains.includes(domain)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    )}
                  >
                    {domain}
                    <span className="ml-1 opacity-70">{DOMAIN_COUNTS[domain]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Sets</p>
              <div className="flex flex-wrap gap-2">
                {PRACTICE_SETS.map((set) => (
                  <button
                    key={set}
                    type="button"
                    onClick={() => toggleSet(set)}
                    className={cn(
                      "min-h-11 min-w-11 rounded-xl border px-2 text-xs font-semibold",
                      config.sets.includes(set)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    )}
                  >
                    {set}
                    <span className="block text-[10px] font-normal opacity-70">
                      {SET_COUNTS[set]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Tags</p>
              <Input
                value={tagQuery}
                onChange={(event) => setTagQuery(event.target.value)}
                placeholder="Search tags"
                className="mb-2 h-12"
                aria-label="Search tags"
              />
              <div className="flex flex-wrap gap-2">
                {filteredTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "min-h-10 rounded-full border px-3 text-xs",
                      config.tags.includes(tag)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    )}
                  >
                    {tag}
                    <span className="ml-1 opacity-70">{TAG_COUNTS[tag]}</span>
                  </button>
                ))}
              </div>
            </div>

            {!PRO_FOR_EVERYONE && (
              <DebugProToggle
                debugPro={store.debugPro}
                onToggle={onUnlockDebugPro}
              />
            )}

            <ProgressPanel store={store} isPro={isPro} />

            {onOpenGuide && (
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-2xl"
                onClick={onOpenGuide}
              >
                <BookOpen className="size-4" />
                Docs guide
              </Button>
            )}
          </div>
        </details>
      </main>

      <div
        className={cn(
          "sticky bottom-0 z-10 mt-auto border-t border-border/70 bg-background/95 px-4 pt-3 backdrop-blur",
          tg.inTelegram
            ? "pb-[max(5.5rem,env(safe-area-inset-bottom))]"
            : "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        )}
      >
        <Button
          className="h-14 w-full rounded-2xl text-base font-semibold"
          onClick={start}
          disabled={!canStart}
        >
          {!PRO_FOR_EVERYONE && exhausted
            ? "Daily limit reached"
            : `Start · ${effective} questions`}
        </Button>
        {!PRO_FOR_EVERYONE && !isPro && !exhausted && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {remainingQuota} free left today
          </p>
        )}
      </div>
    </div>
  );
}

