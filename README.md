# Claude Quiz Lab

Interactive, mobile-first quiz for the **Claude Agent SDK practice bank** — domains, keyword tags, Instant or Exam mode.

## Features

- Client-side bank in `src/data/questions.json` (1,078 items) with `domains` + `tags`
- Setup: how-to tip card, domain chips, searchable tags, optional practice set, duration, session size, shuffle, Instant vs Exam
- Session: large tap targets, sticky actions, subtle `current / total` progress, countdown
- Results: score ring, **domain breakdown**, miss review

## Scripts

```bash
npm run parse    # PDF text → questions.json (+ enrich)
npm run enrich   # re-attach domains/tags to existing JSON
npm run dev
npm run build
```

Parse reads `/tmp/questions-quiz.pdf.txt` by default:

```bash
node scripts/parse-questions.mjs --input=/path/to.txt --output=src/data/questions.json
```

## Stack

Next.js App Router · TypeScript · Tailwind CSS v4 · shadcn/ui (Claude-warm cream + terracotta)
