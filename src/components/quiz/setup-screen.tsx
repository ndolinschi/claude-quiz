"use client";

import type { ReactNode } from "react";
import { FlaskConical, Keyboard, Shuffle, Timer } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  PRACTICE_SETS,
  SET_COUNTS,
  TOTAL_QUESTIONS,
  poolForSets,
  resolveCount,
  type CountPreset,
  type SetupConfig,
  type TimePreset,
} from "@/lib/quiz";
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
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
];

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-9 rounded-full border px-3.5 text-sm font-medium transition-all",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.2)_inset]"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function SetupScreen({
  config,
  onChange,
  onStart,
}: {
  config: SetupConfig;
  onChange: (next: SetupConfig) => void;
  onStart: () => void;
}) {
  const pool = poolForSets(config.sets);
  const count = resolveCount(config, pool.length);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center sm:mb-10">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-copper/30 bg-[radial-gradient(circle_at_30%_20%,#e8b07a,transparent_55%),linear-gradient(160deg,#8a3b16,#c45c26)] text-[#f8ead6] shadow-[0_10px_30px_-12px_rgba(138,59,22,0.65)]">
          <FlaskConical className="size-8" strokeWidth={1.6} />
        </div>
        <p className="mb-2 font-mono text-[11px] tracking-[0.28em] text-copper uppercase">
          Agent SDK · Practice Bank
        </p>
        <h1 className="font-heading text-4xl tracking-tight text-ink sm:text-5xl">
          Claude Quiz Lab
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
          {TOTAL_QUESTIONS.toLocaleString()} questions across 18 practice sets.
          Sit a timed drill or work through the whole bank.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="border-copper/30 bg-card">
            {TOTAL_QUESTIONS} items
          </Badge>
          <Badge variant="outline" className="border-copper/30 bg-card">
            Instant or exam mode
          </Badge>
          <Badge variant="outline" className="border-copper/30 bg-card">
            Keys A–D
          </Badge>
        </div>
      </header>

      <div className="grid gap-4">
        <Card className="bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>How many questions?</CardTitle>
            <CardDescription>
              Draw from {pool.length.toLocaleString()} items in the selected
              sets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Segmented
              options={COUNT_PRESETS}
              value={config.countPreset}
              onChange={(countPreset) => onChange({ ...config, countPreset })}
            />
            {config.countPreset === "custom" && (
              <div className="flex items-center gap-2">
                <Label htmlFor="custom-count" className="text-muted-foreground">
                  Count
                </Label>
                <Input
                  id="custom-count"
                  type="number"
                  min={1}
                  max={pool.length}
                  value={config.customCount}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      customCount: Number(e.target.value),
                    })
                  }
                  className="h-9 w-28 bg-background"
                />
              </div>
            )}
            <p className="font-mono text-xs text-muted-foreground">
              Session length: {count} question{count === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="size-4 text-copper" /> Time limit
            </CardTitle>
            <CardDescription>
              Live countdown during the session. Time&apos;s up auto-submits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Segmented
              options={TIME_PRESETS}
              value={config.timeMinutes}
              onChange={(timeMinutes) => onChange({ ...config, timeMinutes })}
            />
          </CardContent>
        </Card>

        <Card className="bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Session options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RowToggle
              icon={<Shuffle className="size-4 text-copper" />}
              title="Shuffle questions"
              hint="Random order from the selected pool"
              checked={config.shuffleQuestions}
              onCheckedChange={(shuffleQuestions) =>
                onChange({ ...config, shuffleQuestions })
              }
            />
            <RowToggle
              title="Shuffle choices"
              hint="Reorder A–D so the answer key is not memorized"
              checked={config.shuffleChoices}
              onCheckedChange={(shuffleChoices) =>
                onChange({ ...config, shuffleChoices })
              }
            />
            <RowToggle
              icon={<Keyboard className="size-4 text-copper" />}
              title="Instant feedback"
              hint="Show the answer and explanation after each submit. Off = exam mode, review at the end."
              checked={config.feedback === "instant"}
              onCheckedChange={(on) =>
                onChange({ ...config, feedback: on ? "instant" : "exam" })
              }
            />
          </CardContent>
        </Card>

        <Card className="bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Practice sets</CardTitle>
            <CardDescription>
              Leave all on to use the full bank. Each set is a self-contained
              exam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ ...config, sets: [] })}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-medium",
                  config.sets.length === 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                All sets
              </button>
              {PRACTICE_SETS.map((set) => {
                const on = config.sets.includes(set);
                return (
                  <button
                    key={set}
                    type="button"
                    onClick={() => {
                      const next = on
                        ? config.sets.filter((s) => s !== set)
                        : [...config.sets, set].sort((a, b) => a - b);
                      onChange({ ...config, sets: next });
                    }}
                    className={cn(
                      "h-8 rounded-full border px-3 font-mono text-xs font-medium",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    {set}
                    <span className="ml-1 opacity-70">{SET_COUNTS[set]}</span>
                  </button>
                );
              })}
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Pool: {pool.length.toLocaleString()} · Using {count}
            </p>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="h-12 w-full rounded-full text-base font-semibold"
          onClick={onStart}
          disabled={pool.length === 0}
        >
          Start session
        </Button>
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
