#!/usr/bin/env node
/**
 * Parse Claude Agent SDK practice-bank PDF text into questions.json
 * Source: /tmp/questions-quiz.pdf.txt (or --input)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const inputArg = args.find((a) => a.startsWith("--input="))?.slice(8);
const outputArg = args.find((a) => a.startsWith("--output="))?.slice(9);
const INPUT = resolve(
  inputArg || process.env.QUIZ_SOURCE || "/tmp/questions-quiz.pdf.txt"
);
const OUTPUT = resolve(
  outputArg || resolve(__dirname, "../src/data/questions.json")
);

function unwrap(s) {
  return s
    .replace(/\r/g, "")
    .replace(/[ \t]+\n[ \t]*/g, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripNoise(text) {
  return text
    .replace(/\f/g, "\n")
    .replace(/^Practice Questions & Answers[ \t]+Practice Set \d+[ \t]*$/gm, "")
    .replace(/^All practice sets[ \t]+\d+[ \t]*$/gm, "")
    .replace(/^PRACTICE QUESTIONS & ANSWERS[ \t]*$/gm, "")
    .replace(/^CLAUDE AGENT SDK · PRACTICE BANK[ \t]*$/gm, "");
}

function extractExplanation(block) {
  const explMatch = block.match(
    /\n[ \t]*Explanation\.\s*([\s\S]*?)(?=\n[ \t]*Domain\(s\):|\n[ \t]*Q\d+\s*$|$)/
  );
  if (!explMatch) return "";
  let expl = unwrap(explMatch[1]);
  const domain = block.match(/\n[ \t]*Domain\(s\):\s*([^\n]+)/);
  if (domain) {
    const d = unwrap(domain[1]);
    if (d && !expl.includes(d)) expl = expl ? `${expl} Domain(s): ${d}` : `Domain(s): ${d}`;
  }
  if (/^correct\.?$/i.test(expl)) return "Correct.";
  return expl;
}

function parseChoicesAndStem(block) {
  // Split off answer/explanation tail so it doesn't leak into D
  const head = block.split(/\n[ \t]*Answer:\s*[A-D]/)[0];

  const choiceRe = /^[ \t]+([A-D])[ \t]{2,}(.*)$/gm;
  const matches = [...head.matchAll(choiceRe)];
  if (matches.length < 2) {
    return { stem: unwrap(head), choices: [], answerFromMarker: null };
  }

  const stem = unwrap(head.slice(0, matches[0].index));
  const choices = [];
  let answerFromMarker = null;

  for (let i = 0; i < matches.length; i++) {
    const key = matches[i][1];
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : head.length;
    let text = (matches[i][2] + head.slice(start, end)).replace(/\n/g, " ");
    if (/\(correct\)/i.test(text)) {
      answerFromMarker = key;
      text = text.replace(/\s*\(correct\)\s*/gi, " ");
    }
    text = unwrap(text);
    // skip accidental re-matches of Answer leftovers
    if (!text) continue;
    choices.push({ key, text });
  }

  // Keep last A-D if duplicates from page noise
  const byKey = new Map();
  for (const c of choices) byKey.set(c.key, c);
  const ordered = ["A", "B", "C", "D"]
    .filter((k) => byKey.has(k))
    .map((k) => byKey.get(k));

  return { stem, choices: ordered, answerFromMarker };
}

function parseQuestion(raw, set, globalIndex) {
  const qMatch = raw.match(/^[ \t]*Q(\d+)[ \t]*\n/);
  const localNum = qMatch ? Number(qMatch[1]) : globalIndex;
  const body = qMatch ? raw.slice(qMatch[0].length) : raw;

  const answerMatch = body.match(/\n[ \t]*Answer:\s*([A-D])/);
  const { stem, choices, answerFromMarker } = parseChoicesAndStem(body);
  const answer = answerMatch?.[1] || answerFromMarker || "";
  const explanation = extractExplanation(body);

  return {
    id: `s${set}-q${localNum}`,
    set,
    num: localNum,
    stem,
    choices,
    answer,
    explanation,
  };
}

function main() {
  const raw = readFileSync(INPUT, "utf8");
  const text = stripNoise(raw);

  // Drop contents page: start at first real set heading
  const firstSet = text.search(/Practice Set 1\s*\n\s*\d+\s+questions/);
  const body = firstSet >= 0 ? text.slice(firstSet) : text;

  const setSplit = body.split(/(?=Practice Set \d+\s*\n\s*\d+\s+questions)/);
  const questions = [];
  const issues = [];
  const setCounts = {};

  for (const chunk of setSplit) {
    const setMatch = chunk.match(/^Practice Set (\d+)/);
    if (!setMatch) continue;
    const set = Number(setMatch[1]);
    const afterHeader = chunk.replace(/^Practice Set \d+\s*\n\s*\d+\s+questions[^\n]*\n/, "");
    const parts = afterHeader.split(/(?=^[ \t]*Q\d+[ \t]*$)/m).filter((p) => /^[ \t]*Q\d+/.test(p));

    setCounts[set] = parts.length;
    for (const part of parts) {
      const q = parseQuestion(part, set, questions.length + 1);
      if (!q.stem) issues.push(`${q.id}: empty stem`);
      if (q.choices.length !== 4) issues.push(`${q.id}: ${q.choices.length} choices`);
      if (!q.answer || !["A", "B", "C", "D"].includes(q.answer)) {
        issues.push(`${q.id}: missing/invalid answer`);
      }
      if (!q.choices.some((c) => c.key === q.answer) && q.answer) {
        issues.push(`${q.id}: answer ${q.answer} not in choices`);
      }
      questions.push(q);
    }
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  const payload = questions.map(({ id, set, stem, choices, answer, explanation }) => ({
    id,
    set,
    stem,
    choices,
    answer,
    explanation,
  }));
  writeFileSync(OUTPUT, JSON.stringify(payload, null, 2) + "\n");

  console.log(`Parsed ${questions.length} questions from ${Object.keys(setCounts).length} sets`);
  console.log("Per set:", JSON.stringify(setCounts));
  console.log(`Wrote ${OUTPUT}`);
  if (issues.length) {
    console.log(`Issues (${issues.length}):`);
    for (const i of issues.slice(0, 40)) console.log(" -", i);
    if (issues.length > 40) console.log(` ... +${issues.length - 40} more`);
  } else {
    console.log("No structural issues.");
  }
}

main();
