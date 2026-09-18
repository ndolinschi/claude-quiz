"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Filter,
  FlaskConical,
  Keyboard,
  Play,
  Search,
  Shuffle,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  ALL_TAGS,
  DOMAIN_LIST,
  PRACTICE_SETS,
  filterPool,
  resolveCount,
  type CountPreset,
  type Domain,
  type SetupConfig,
  type TimePreset,
} from "@/lib/quiz";
import type { ProgressStore } from "@/lib/progress-store";
import { ProgressPanel } from "./progress-panel";
import { PaywallCard } from "./paywall-card";
import { DebugProToggle } from "./debug-pro-toggle";
import { cn } from "@/lib/utils";

const COUNT_PRESETS: { value: CountPreset; label: string }[] = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: "all", label: "All" },
  { value: "custom", label: "Custom" },
];

const TIME_PRESETS: { value: TimePreset; label: string }[] = [
  { value: 0, label: "None" },
  { value: 15, label: "15m" },
  { value: 30, label: "30m" },
  { value: 45, label: "45m" },
  { value: 60, label: "60m" },
  { value: 90, label: "90m" },
];

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 rounded-2xl border border-border/70 bg-muted/40 p-1.5",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-10 flex-1 rounded-xl px-3 text-sm font-medium transition-all sm:min-h-9 sm:flex-none",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/80 hover:bg-card hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
        className
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
  const [tagQuery, setTagQuery] = useState("");
  const pool = useMemo(() => filterPool(config), [config]);
  const count = resolveCount(config, pool.length);

  const isQuotaExhausted = !isPro && remainingQuota <= 0;
  const isClamped = !isPro && remainingQuota > 0 && remainingQuota < count;
  const effectiveCount = isClamped ? remainingQuota : count;

  const filteredTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    const list = q
      ? ALL_TAGS.filter((t) => t.toLowerCase().includes(q))
      : ALL_TAGS;
    // Keep selected tags visible even if filtered out
    const selected = config.tags.filter((t) => !list.includes(t));
    return [...selected, ...list].slice(0, 28);
  }, [tagQuery, config.tags]);

  const toggleDomain = (d: Domain) => {
    const on = config.domains.includes(d);
    onChange({
      ...config,
      domains: on
        ? config.domains.filter((x) => x !== d)
        : [...config.domains, d],
    });
  };

  const toggleTag = (t: string) => {
    const on = config.tags.includes(t);
    onChange({
      ...config,
      tags: on ? config.tags.filter((x) => x !== t) : [...config.tags, t],
    });
  };

  const toggleSet = (set: number) => {
    const on = config.sets.includes(set);
    onChange({
      ...config,
      sets: on
        ? config.sets.filter((s) => s !== set)
        : [...config.sets, set].sort((a, b) => a - b),
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 sm:pb-12 sm:pt-10">
      {/* Resume Banner */}
      {store.activeSession && (
        <div className="mb-6 rounded-2xl border border-copper/35 bg-gradient-to-r from-copper/10 via-card to-copper/5 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-copper/40 bg-copper/15 font-mono text-[10px] text-copper uppercase"
                >
                  Unfinished session
                </Badge>
                <span className="text-sm font-semibold text-foreground">
                  In-progress drill detected
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Question {store.activeSession.index + 1} of{" "}
                {store.activeSession.questionIds.length} ·{" "}
                {Object.keys(store.activeSession.answers).length} answered
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onDiscardResume && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDiscardResume}
                  className="h-9 rounded-full text-xs text-muted-foreground"
                >
                  Discard
                </Button>
              )}
              {onResumeSession && (
                <Button
                  size="sm"
                  onClick={onResumeSession}
                  className="h-9 rounded-full bg-copper text-white hover:bg-copper/90 text-xs font-semibold"
                >
                  <Play className="size-3.5" />
                  Resume
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="mb-6 text-center sm:mb-8">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-copper/30 bg-[radial-gradient(circle_at_30%_20%,#e8b07a,transparent_55%),linear-gradient(160deg,#8a3b16,#c45c26)] text-[#f8ead6] shadow-[0_10px_30px_-12px_rgba(138,59,22,0.65)] sm:size-16">
          <FlaskConical className="size-7 sm:size-8" strokeWidth={1.6} />
        </div>
        <p className="mb-2 font-mono text-[11px] tracking-[0.28em] text-copper uppercase">
          Agent SDK · Practice
        </p>
        <h1 className="font-heading text-3xl tracking-tight text-ink sm:text-5xl">
          Claude Quiz Lab
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-sm text-muted-foreground sm:text-base">
          Filter by domain and tag, pick a length, then drill Instant or Exam
          mode — built for mobile first.
        </p>
      </header>

      {/* Daily Quota Status Banner */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card/85 px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            Daily quota:
          </span>
          {isPro ? (
            <Badge
              variant="outline"
              className="border-copper/40 bg-copper/15 font-mono text-[10px] font-semibold text-copper"
            >
              <Sparkles className="mr-1 size-3" />
              Pro Unlimited
            </Badge>
          ) : (
            <span className="font-mono text-xs font-semibold text-foreground">
              {store.questionsToday} / 50 questions used today
            </span>
          )}
        </div>
        {!isPro && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-mono text-xs font-medium",
                remainingQuota > 10
                  ? "text-muted-foreground"
                  : remainingQuota > 0
                    ? "text-copper"
                    : "font-semibold text-destructive"
              )}
            >
              {remainingQuota} remaining
            </span>
            {remainingQuota <= 0 && (
              <Badge variant="destructive" className="font-mono text-[10px]">
                Exhausted
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3.5 sm:gap-4">
        {/* How to use */}
        <Card className="overflow-hidden border-copper/20 bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BookOpen className="size-4 text-copper" />
              How to use
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ol className="grid gap-2.5 text-sm text-muted-foreground">
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 font-mono text-[11px] font-semibold text-primary">
                  1
                </span>
                <span>
                  Optionally filter by <strong className="text-foreground">domains</strong> and{" "}
                  <strong className="text-foreground">tags</strong> (or a practice set).
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 font-mono text-[11px] font-semibold text-primary">
                  2
                </span>
                <span>
                  Choose session size and an optional timer. Progress shows as{" "}
                  <strong className="text-foreground">current / total</strong> during the run.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 font-mono text-[11px] font-semibold text-primary">
                  3
                </span>
                <span>
                  Toggle shuffle and pick{" "}
                  <strong className="text-foreground">Instant</strong> (reveal after each) or{" "}
                  <strong className="text-foreground">Exam</strong> (review at the end).
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 font-mono text-[11px] font-semibold text-primary">
                  4
                </span>
                <span>
                  On desktop, tap <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">A–D</kbd> then{" "}
                  <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">Enter</kbd>. On mobile, use the large choices + sticky action.
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {onOpenGuide && (
          <Card className="border-copper/25 bg-card/95 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BookOpen className="size-4 text-copper" />
                Docs guide
              </CardTitle>
              <CardDescription>
                Official Claude Code, Agent SDK, and MCP pages, grouped like the quiz.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full sm:w-auto"
                onClick={onOpenGuide}
              >
                Open docs guide
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Theme coverage progress panel */}
        <ProgressPanel
          store={store}
          isPro={isPro}
          onUnlockPro={() => onUnlockDebugPro(true)}
        />

        {/* Domains */}
        <Card className="bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="size-4 text-copper" />
              Domains
            </CardTitle>
            <CardDescription>Multi-select. Empty = all domains.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5 pb-4">
            <Chip
              active={config.domains.length === 0}
              onClick={() => onChange({ ...config, domains: [] })}
            >
              All
            </Chip>
            {DOMAIN_LIST.map((d) => (
              <Chip
                key={d}
                active={config.domains.includes(d)}
                onClick={() => toggleDomain(d)}
              >
                {d}
              </Chip>
            ))}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Tags</CardTitle>
            <CardDescription>
              Keyword chips from stems. Search to narrow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                placeholder="Search tags (MCP, CLAUDE.md, hooks…)"
                className="h-11 bg-background pl-9"
              />
              {tagQuery && (
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setTagQuery("")}
                  aria-label="Clear tag search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {config.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Selected:</span>
                {config.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="cursor-pointer border-primary/40 bg-primary/8 font-mono"
                    onClick={() => toggleTag(t)}
                  >
                    {t}
                    <X className="ml-1 size-3" />
                  </Badge>
                ))}
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => onChange({ ...config, tags: [] })}
                >
                  Clear
                </button>
              </div>
            )}
            <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto overscroll-contain pr-1">
              {filteredTags.map((t) => (
                <Chip
                  key={t}
                  active={config.tags.includes(t)}
                  onClick={() => toggleTag(t)}
                  className="font-mono"
                >
                  {t}
                </Chip>
              ))}
              {!filteredTags.length && (
                <p className="text-sm text-muted-foreground">No tags match.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Practice sets (optional) */}
        <Card className="bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Practice set</CardTitle>
            <CardDescription>Optional. Leave empty for any set.</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={config.sets.length === 0}
                onClick={() => onChange({ ...config, sets: [] })}
              >
                Any
              </Chip>
              {PRACTICE_SETS.map((set) => (
                <Chip
                  key={set}
                  active={config.sets.includes(set)}
                  onClick={() => toggleSet(set)}
                  className="font-mono"
                >
                  {set}
                </Chip>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session size */}
        <Card className="bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Session size</CardTitle>
            <CardDescription>
              Drawing {effectiveCount} from the filtered pool
              {pool.length !== count ? ` (${pool.length} available)` : ""}.
              {isClamped && ` Clamped from ${count} due to daily quota (${remainingQuota} remaining).`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-4">
            <Segmented
              options={COUNT_PRESETS}
              value={config.countPreset}
              onChange={(countPreset) => onChange({ ...config, countPreset })}
            />
            {(config.countPreset === "custom" ||
              config.countPreset === "all") && (
              <div className="space-y-2">
                {config.countPreset === "custom" && (
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="custom-count" className="text-muted-foreground">
                      Custom
                    </Label>
                    <Input
                      id="custom-count"
                      type="number"
                      min={1}
                      max={Math.max(1, pool.length)}
                      value={config.customCount}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          customCount: Number(e.target.value),
                        })
                      }
                      className="h-10 w-24 bg-background text-center font-mono"
                    />
                  </div>
                )}
                <Slider
                  min={1}
                  max={Math.max(1, pool.length)}
                  step={1}
                  value={[
                    config.countPreset === "all"
                      ? pool.length || 1
                      : Math.min(
                          Math.max(1, config.customCount),
                          Math.max(1, pool.length)
                        ),
                  ]}
                  onValueChange={(v) => {
                    const n = Array.isArray(v) ? v[0] : v;
                    onChange({
                      ...config,
                      countPreset: "custom",
                      customCount: Number(n) || 1,
                    });
                  }}
                  className="py-1"
                />
              </div>
            )}
            {isClamped && (
              <div className="rounded-xl border border-copper/35 bg-copper/5 p-3 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Daily quota limit:</strong>{" "}
                  You have {remainingQuota} questions remaining today on Free.
                  Your session is clamped to {remainingQuota} questions.
                </p>
                <button
                  type="button"
                  onClick={() => onUnlockDebugPro(true)}
                  className="mt-1.5 font-semibold text-copper underline underline-offset-2 hover:text-copper/80"
                >
                  Unlock Pro for unlimited questions
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Duration */}
        <Card className="bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Timer className="size-4 text-copper" />
              Duration
            </CardTitle>
            <CardDescription>
              Live countdown. Time&apos;s up auto-submits.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <Segmented
              options={TIME_PRESETS}
              value={config.timeMinutes}
              onChange={(timeMinutes) => onChange({ ...config, timeMinutes })}
            />
          </CardContent>
        </Card>

        {/* Options + mode */}
        <Card className="bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-4">
            <RowToggle
              icon={<Shuffle className="size-4 text-copper" />}
              title="Shuffle questions"
              hint="Random order from the filtered pool"
              checked={config.shuffleQuestions}
              onCheckedChange={(shuffleQuestions) =>
                onChange({ ...config, shuffleQuestions })
              }
            />
            <Separator />
            <RowToggle
              title="Shuffle choices"
              hint="Reorder A–D so the key isn’t memorized"
              checked={config.shuffleChoices}
              onCheckedChange={(shuffleChoices) =>
                onChange({ ...config, shuffleChoices })
              }
            />
            <Separator />
            <div>
              <div className="mb-2 flex items-center gap-2 font-medium">
                <Keyboard className="size-4 text-copper" />
                Mode
              </div>
              <Segmented
                options={[
                  { value: "instant" as const, label: "Instant feedback" },
                  { value: "exam" as const, label: "Exam" },
                ]}
                value={config.feedback}
                onChange={(feedback) => onChange({ ...config, feedback })}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Instant reveals after each submit. Exam waits until results.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Soft Paywall if Quota Exhausted */}
        {isQuotaExhausted && (
          <PaywallCard onUnlockDebugPro={() => onUnlockDebugPro(true)} />
        )}

        {/* Debug Pro Toggle */}
        <DebugProToggle
          debugPro={store.debugPro}
          onToggle={onUnlockDebugPro}
          className="mt-2"
        />
      </div>

      {/* Sticky start CTA — mobile critical */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 sm:flex-row sm:items-center">
          <p className="hidden text-center font-mono text-xs text-muted-foreground sm:block sm:flex-1 sm:text-left">
            {effectiveCount} question{effectiveCount === 1 ? "" : "s"}
            {config.timeMinutes ? ` · ${config.timeMinutes}m` : ""}
            {config.feedback === "exam" ? " · exam" : " · instant"}
            {isClamped ? " · (clamped)" : ""}
          </p>
          <Button
            size="lg"
            className="h-12 w-full rounded-full text-base font-semibold sm:w-auto sm:min-w-48"
            onClick={onStart}
            disabled={pool.length === 0 || isQuotaExhausted}
          >
            {isQuotaExhausted
              ? "Daily quota reached (50/50)"
              : isClamped
                ? `Start (${effectiveCount} questions)`
                : "Start session"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RowToggle({
  icon,
  title,
  hint,
  checked,
  onCheckedChange,
}: {
  icon?: ReactNode;
  title: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-medium">
          {icon}
          {title}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
