# Claude Quiz Lab — Commercial Freemium Design (2026-09-17)

## Goal
Turn https://claude-quiz-six.vercel.app into a sellable freemium practice product: safe local progress, theme coverage, daily free quota, Pro unlock path (Debug Pro now; Stripe later).

## Decisions (approved)
- **Model:** Freemium
- **Free:** 50 questions/day from any domain + **basic** theme coverage progress
- **Pro:** unlimited questions + **full** session history
- **Approach A:** client-only persistence (localStorage), soft paywall, Debug Pro toggle, Cancel/Exit session controls
- Stay on Vercel Hobby; no paid add-ons

## Data model (localStorage)
Key: `claude-quiz-lab-v1` (versioned; migrate or reset safely on parse failure)

```ts
type ProgressStore = {
  v: 1;
  pro: boolean;           // true if Pro / Debug Pro
  debugPro: boolean;      // UI flag; implies pro while on
  dayKey: string;         // YYYY-MM-DD local
  questionsToday: number; // answered count for dayKey
  // per questionId: last result for coverage
  answered: Record<string, { correct: boolean; at: string; domain?: string; tags?: string[] }>;
  // Pro-only: finished sessions
  history: Array<{
    id: string;
    startedAt: string;
    endedAt: string;
    score: number;
    total: number;
    domains: string[];
    tags: string[];
  }>;
  activeSession: null | {
    id: string;
    config: SetupConfig;
    questionIds: string[];
    index: number;
    answers: Record<string, string>; // qid -> choice key
    startedAt: string;
  };
};
```

**Safety:** wrap all read/write in try/catch; quota/private mode → soft degrade (in-memory only + banner). Never throw through React. Schema version bump = migrate or clear with notice.

## Theme coverage (basic, Free+)
On setup / Progress panel:
- For each **domain**: answered unique questions / total in domain; % bar; correct rate optional
- For top **tags**: same compact list (or top 12 by bank size)
- “Covered” = at least one answered attempt for that question id
- Free sees this basic map; Pro additionally sees history list + export later (not v1)

## Daily quota
- Count increments when user **submits** an answer (not on start)
- Reset when `dayKey` ≠ today (local timezone)
- At 50 answered today and `!pro`: block starting new session OR block next question mid-session with soft paywall card
- Prefer: allow finishing an in-progress session if it started under quota; block **next** start. Simpler UX: if remaining quota < requested count, clamp count or show paywall before start.

## Debug Pro
- Settings / footer toggle: **Debug Pro**
- When on: `pro=true`, badge “Pro (debug)”, no quota
- Persist in store; easy off
- Visible always in v1 (dev/demo commercial); no secret URL required

## Session controls
- **Cancel quiz** / Exit: confirm dialog → discard or save partial progress (answered so far still count toward coverage + quota); clear `activeSession`
- Resume banner if `activeSession` exists on load
- Keep existing Instant / Exam modes

## Soft paywall (no Stripe yet)
- Card copy: Free = 50/day; Pro = unlimited + full history
- CTA: “Unlock Pro” → for now enables Debug Pro path or shows “Coming soon — use Debug Pro”
- Do not break free path

## UI
- Keep Claude-warm cream/terracotta aesthetic
- Progress card on setup screen
- Session header: progress bar + Cancel
- Mobile-first

## Out of scope v1
- Real payments / accounts / cloud sync
- Export PDF
- Leaderboards

## Success
- Progress survives refresh
- Domain coverage updates after answers
- 51st question/day gated without Pro
- Debug Pro removes gate
- Cancel exits cleanly
- Build + deploy Hobby green
