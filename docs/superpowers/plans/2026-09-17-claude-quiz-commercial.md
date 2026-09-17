# Claude Quiz Lab Commercial Implementation Plan

> **For agentic workers:** execute task-by-task. Russian chat to user is Project Dev's job.

**Goal:** Freemium Quiz Lab with safe localStorage progress, theme coverage, 50/day limit, Debug Pro, Cancel quiz. Deploy to existing Vercel Hobby.

**Spec:** `docs/superpowers/specs/2026-09-17-claude-quiz-commercial-design.md`

## File map
- Create: `src/lib/progress-store.ts` — load/save/migrate ProgressStore
- Create: `src/hooks/use-progress.ts` — React hook over store
- Create: `src/components/quiz/progress-panel.tsx` — domain/tag coverage UI
- Create: `src/components/quiz/paywall-card.tsx` — soft paywall
- Create: `src/components/quiz/debug-pro-toggle.tsx`
- Modify: `src/components/quiz/quiz-app.tsx` — wire store, resume, quota
- Modify: `src/components/quiz/setup-screen.tsx` — progress panel, quota remaining, Debug Pro
- Modify: `src/components/quiz/session-screen.tsx` — Cancel + confirm, record answers
- Modify: `src/components/quiz/results-screen.tsx` — append history if Pro
- Modify: `src/lib/quiz.ts` if helpers needed for coverage math

### Task 1: Progress store
- [ ] Implement versioned localStorage with try/catch, dayKey rollover, recordAnswer, setDebugPro, clearActiveSession, appendHistory
- [ ] Unit-smoke via node or quick vitest-free assert script
- Commit: `feat(quiz): safe localStorage progress store`

### Task 2: Wire session lifecycle
- [ ] On answer submit: recordAnswer + increment questionsToday
- [ ] Cancel with AlertDialog; resume banner
- [ ] Quota gate before start / soft paywall
- Commit: `feat(quiz): quota, cancel, resume`

### Task 3: Progress UI + Debug Pro
- [ ] Progress panel domains + tags
- [ ] Debug Pro toggle
- Commit: `feat(quiz): theme coverage + debug pro`

### Task 4: Ship
- [ ] `npm run build` exit 0
- [ ] push `main`, redeploy Vercel Hobby (browser if CLI logged out)
- [ ] Smoke: refresh keeps progress; Debug Pro bypasses limit
