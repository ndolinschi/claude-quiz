# Claude Quiz Lab

Interactive quiz for the **Claude Agent SDK practice bank**: 18 sets, 1,078 questions, each with A–D choices, the correct answer, and an explanation.

## Features

- Client-side bank in `src/data/questions.json`
- Setup: question count (10 / 25 / 50 / 100 / All / custom), time limit, shuffle, practice-set filter, instant vs exam mode
- Session: one question at a time, progress, countdown, keyboard **A–D** + Enter
- Results: score, time used, review misses, retry / new shuffle

## Parse

```bash
npm run parse
# reads /tmp/questions-quiz.pdf.txt by default
# node scripts/parse-questions.mjs --input=/path/to.txt --output=src/data/questions.json
```

## Develop

```bash
npm install
npm run dev
```

## Stack

Next.js App Router · TypeScript · Tailwind CSS v4 · shadcn/ui
