// Tool-choice eval for the assistant: does it call the right tools, in the right order, for each message?
// Runs the real agent loop against Groq. The free tier allows 8K tokens a minute and one agent turn can
// use 4-7K, so cases are paced and a "busy" answer is retried after a pause.
// Results are printed and saved to eval/agent-results.json.
//
// Run all cases:        npm run eval:agent
// Re-run some cases:    npm run eval:agent -- --only=visit-en,none-injection
//   (--only merges the new rows into the existing results file, so a run cut short by rate
//    limits can be completed without repeating the cases that already ran)
import { readFile, writeFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { connectDb } from '../src/db.js';
import { languageOf } from '../src/lib/language.js';
import { runAgent } from '../src/routes/assistant.js';
import { parsePrefs } from '../src/routes/match.js';

const PAUSE_MS = 40000;
const BUSY_WAIT_MS = 90000;
const ATTEMPTS = 3;
const RESULTS_URL = new URL('./agent-results.json', import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const allCases = JSON.parse(await readFile(new URL('./agent-cases.json', import.meta.url), 'utf8'));
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').filter(Boolean)) : null;
const cases = only ? allCases.filter((c) => only.has(c.id)) : allCases;
if (only && cases.length !== only.size) {
  console.error(`Unknown case id in --only: ${[...only].filter((id) => !allCases.some((c) => c.id === id)).join(', ')}`);
  process.exit(1);
}

async function runCase(c) {
  let reply = '';
  const started = Date.now();
  const result = await runAgent({
    history: [{ role: 'user', content: c.message }],
    prefs: parsePrefs(c.prefs ?? {}),
    language: languageOf(c.message),
    send: (event) => {
      if (event.type === 'delta') reply += event.text;
    },
  });
  return { tools: result.toolsUsed.map((t) => (t.error ? `${t.name}!` : t.name)), models: result.models, reply, ms: Date.now() - started };
}

await connectDb();
const rows = [];
for (const [i, c] of cases.entries()) {
  if (i > 0) await sleep(PAUSE_MS);
  let outcome;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      outcome = await runCase(c);
      break;
    } catch (err) {
      if (attempt === ATTEMPTS || !/busy/i.test(err.message)) {
        outcome = { error: err.message };
        break;
      }
      console.log(`  ${c.id}: rate limited, waiting ${BUSY_WAIT_MS / 1000}s`);
      await sleep(BUSY_WAIT_MS);
    }
  }
  const called = (outcome.tools ?? []).map((t) => t.replace(/!$/, ''));
  const row = {
    id: c.id,
    expect: c.expect,
    called: outcome.tools ?? [],
    exact: !outcome.error && JSON.stringify(called) === JSON.stringify(c.expect),
    firstRight: !outcome.error && (c.expect[0] ?? null) === (called[0] ?? null),
    ms: outcome.ms,
    models: outcome.models,
    error: outcome.error,
    reply: outcome.reply?.slice(0, 300),
    ranAt: new Date().toISOString(),
  };
  rows.push(row);
  console.log(`${row.error ? 'SKIP' : row.exact ? 'PASS' : 'FAIL'}  ${c.id.padEnd(22)} expected [${c.expect.join(', ')}]  got [${row.called.join(', ')}]${row.error ? `  (${row.error})` : ''}`);
}

// With --only, merge into the previous results so the file always covers every case.
let results = rows;
if (only) {
  const previous = JSON.parse(await readFile(RESULTS_URL, 'utf8').catch(() => '{"results":[]}')).results;
  results = allCases.map((c) => rows.find((r) => r.id === c.id) ?? previous.find((r) => r.id === c.id)).filter(Boolean);
}

// Counts, not just percentages: cases that never ran (rate limits) must not look like passes.
const ran = results.filter((r) => !r.error);
const summary = {
  cases: allCases.length,
  ran: ran.length,
  notRun: allCases.length - ran.length,
  exactSequence: `${ran.filter((r) => r.exact).length}/${ran.length}`,
  firstToolRight: `${ran.filter((r) => r.firstRight).length}/${ran.length}`,
  modelsUsed: [...new Set(ran.flatMap((r) => r.models ?? []))],
  medianMs: ran.map((r) => r.ms).sort((a, b) => a - b)[Math.floor(ran.length / 2)] ?? null,
};
console.log('\n', summary);
await writeFile(RESULTS_URL, JSON.stringify({ updatedAt: new Date().toISOString(), summary, results }, null, 2));
await mongoose.disconnect();
