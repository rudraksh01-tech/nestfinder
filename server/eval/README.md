# Assistant tool-choice eval

Checks that the assistant (`POST /api/assistant`) calls the right tools, in the right order, for 20 messages in English, Hindi and Hinglish: searches, rent checks, comparisons, flat lookups, visit requests, two-intent messages, and off-topic or prompt-injection messages that should call no tool.

```bash
npm run eval:agent                                   # all 20 cases (~15 min, paced for Groq's free limits)
npm run eval:agent -- --only=visit-en,none-injection # re-run some cases and merge them into the results
```

- Cases: `agent-cases.json` (message, optional starting preferences, expected tool sequence).
- Results: `agent-results.json` (latest), `agent-results.run1.json` (first run, before the fixes below).
- It runs the real agent against Groq, so it uses the same free quota as the app (8K tokens per minute and 200K per day for gpt-oss-120b). Run the full set sparingly.

## What it measures, and what it does not

- **Exact sequence:** the tools called match the expected list exactly.
- **First tool right:** the first tool called (or none) is the expected one.
- It does **not** check whether the reply text is true to the tool results. Reading the replies by hand found a case it missed (below), so a reply-groundedness eval is the next step.

## Runs

| Run | Code | Result | What it showed |
|---|---|---|---|
| 1 | First version of the agent | 18/20 exact | "Office in Whitefield" gave an **empty reply**: the model sent `techPark: "Whitefield"`, Groq rejected the whole tool call because the schema only allowed "ITPL Whitefield", and the stream's `event: error` was being ignored. "Kasavanahalli" was refused as an unknown area. |
| 2 | Free-text names resolved in code (`src/lib/areas.js`), stream errors surfaced, model asked to repair a rejected call, never an empty reply | 20/20 exact | Tool choice fixed. Reading the replies showed a noisy flat described as "quiet" because the user asked for quiet. |
| 3 | Tool results split into `fits` and `problems`; prompt forbids softening a problem | 13/13 exact, 7 not run | The remaining 7 cases were stopped by the Groq free **daily** token limit after a long day of testing, not by the agent. This led to the automatic fallback to gpt-oss-20b in `src/lib/llm.js`. |
| 4 | Same agent, plus optional tool fields that accept `null` (for the 20b fallback) | 7/7 exact for the cases run 3 missed, so **20/20** across runs 3 and 4 | All on gpt-oss-120b, no fallback needed, median 2.4 s. Injection and off-topic messages were refused with no tool call. Reading the replies: one Hinglish visit reply said "Flat flat ke liye" (code dropped, word doubled), and the model still adds `**bold**` sometimes; the chat UI strips it. Neither is caught by this eval. |

Median time for a turn is about 2.4-3 seconds.

Runs 3 and 4 were on different days (2026-10-31 and 2026-11-01); the only code change between them is the `null`-tolerant tool schema, which does not change what the 120b model is asked to do.
