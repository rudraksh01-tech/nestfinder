# Design decisions

The main technical choices in NestFinder: what I chose, why, what it cost, and what I would change. The [README](README.md) explains how everything works; this file explains why it works that way.

---

## 1. The AI talks, the code decides

**Decision.** Match scores, rent medians, deposit flags and distances are computed by plain code (`server/src/lib/match.js`, `fairRent.js`, `geo.js`). The language model only reads messages, picks tools, and writes replies from the results.

**Why.** A score from a model changes between runs and can't be explained point by point. Rules give the same answer for the same input, every point has a written reason, and they can be unit tested. It also means the model can't invent a number: if a figure appears in a reply, it came from a tool.

**Trade-off.** The rules only know the factors I wrote (budget, office distance, metro, BHK, tenant type, pets, noise, gym, parking, furnishing). Anything else the user cares about is ignored by the score.

**Result.** Unit tests cover the scoring and the rent check (26 tests across the server). Interview questions like "why is this flat 84%?" have an exact answer.

---

## 2. No RAG or vector database in this project

**Decision.** Flats are filtered and scored as structured data. There are no embeddings and no vector search.

**Why.** The data that matters here is structured: rent, BHK, distances, pets. Code filters and ranks that more accurately than similarity search, and it stays explainable. (My other project, AyurIP-Sahayak, is the RAG one.)

**Trade-off.** Free-text questions about listing descriptions ("which flat gets morning sun?") can't be answered.

**What I'd change.** If listings had long descriptions or reviews, I would add pgvector search over those text fields and keep the scoring in code.

---

## 3. A hand-written agent loop instead of LangChain

**Decision.** The tool-calling assistant (`server/src/routes/assistant.js`) is about 70 lines of my own code using plain `fetch`.

**Why.** I wanted to see every request and handle Groq's behaviour directly. That paid off: Groq reports a rejected tool call as an error *inside* the stream, and handling that myself was what fixed the empty-reply bug (see the README's "What went wrong" section). With 5 tools and at most 3 rounds, a framework would have added more code than it saved.

**Trade-off.** No ready-made integrations, memory or tracing from a framework; I wrote the retry, repair and fallback logic and the tracing myself.

**What I'd change.** With many more tools, several agents or a team working on it, I would move to a framework such as LangGraph for shared structure.

---

## 4. Groq with an open model, plus a fallback model

**Decision.** The main model is `openai/gpt-oss-120b` on Groq. On HTTP 429 (rate limited) each call retries once on `openai/gpt-oss-20b`.

**Why.** Groq's free tier needs no card, responds fast (about 2.4 s per assistant turn in the eval) and supports tool calling, streaming and strict JSON schemas. Each model has its own free budget (8K tokens a minute, 200K a day), so the fallback keeps the app answering when the main model's budget is used up.

**Trade-off.** Free-tier limits are tight: one assistant turn uses 4–7K tokens. The smaller fallback model writes longer replies and sends `null` for missing tool arguments, so the schemas had to accept `null`.

---

## 5. Free-text tool arguments, resolved in code

**Decision.** Tool schemas take office and area names as plain text. `server/src/lib/areas.js` maps them to the right place ("Whitefield" → ITPL Whitefield, "Kasavanahalli" → Sarjapur Road).

**Why.** My first version used enums. When the model wrote "Whitefield" instead of "ITPL Whitefield", Groq rejected the whole tool call and the user got an empty reply. A lookup table in code is deterministic and unit tested; asking the model to match exact strings is not.

**Trade-off.** New neighbourhood names have to be added to the alias table by hand.

**Result.** The tool-choice eval went from 18/20 to 20/20.

---

## 6. Strict JSON schemas where the output is data

**Decision.** Reading a broker's message and choosing the best flat in Compare use strict JSON schemas. In Compare, the `pick` and `runnerUp` fields are enums of the shortlisted flat codes.

**Why.** When the app needs data, not prose, a schema guarantees the shape. The enum makes it impossible for the model to pick a flat that isn't on the user's shortlist. The server still re-validates every value, because a schema guarantees a shape, not a sensible value.

**Trade-off.** Groq can't combine strict schemas with tool calling and streaming, so the streaming assistant uses free-form tool arguments with server-side validation instead.

---

## 7. Streaming over a normal POST (NDJSON)

**Decision.** `/api/assistant` streams newline-delimited JSON events (`status`, `tool`, `delta`, `done`) over a POST response.

**Why.** The user sees "Finding flats that fit", then the flat cards, then the reply as it is written, instead of waiting for the whole answer. Server-Sent Events via the browser's `EventSource` only support GET, and I needed to POST the conversation. WebSockets would add a long-lived connection for what is one request and one response.

**Trade-off.** The client reads and splits the stream itself (about 20 lines in `ChatPanel.jsx`).

---

## 8. The AI can't act on its own

**Decision.** The `book_visit` tool writes nothing. It returns a confirmation card, and the visit request is sent only when the user presses Confirm.

**Why.** A model can misunderstand a message, and text pasted into a chat can try to give it instructions (prompt injection). Following the OWASP LLM Top 10 advice on "excessive agency", the model can suggest an action but only a person can carry it out.

**Trade-off.** One extra click for the user.

---

## 9. MongoDB, not Postgres

**Decision.** MongoDB Atlas (free M0) with Mongoose.

**Why.** Listings are documents with nested facts that vary a little between flats, and MongoDB's `2dsphere` index handles location queries. The free cluster runs in Mumbai with no card.

**Trade-off.** No SQL and no joins. Reports across brokers or months would be easier in Postgres.

---

## 10. Straight-line distances, labelled as such

**Decision.** Distances to metro stations and tech parks are straight-line kilometres from real OpenStreetMap coordinates.

**Why.** Routing APIs with traffic need a card or cost money, and the project stays on free tiers.

**Trade-off.** 3 km straight-line can be a 30-minute drive in Bengaluru. The app says "straight-line" wherever it shows a distance, so the number is never mistaken for travel time.

---

## 11. One site for the browser: Vercel rewrites `/api` to Render

**Decision.** The frontend is on Vercel and the API on Render, but the browser only talks to the Vercel domain: `client/vercel.json` forwards `/api/*` to Render.

**Why.** The login token lives in an httpOnly cookie. If the API were on another domain, browsers would treat the cookie as third-party and increasingly block it. With the rewrite, the cookie is first-party and can stay `SameSite=Lax` and `Secure`.

**Trade-off.** Each API request goes through extra proxies (Vercel, Cloudflare and two hops inside Render, measured on the live deploy), so Express must trust exactly that many hops to see the visitor's real IP for rate limiting. Someone calling the Render URL directly could fake their IP.

---

## 12. Generated sample data instead of scraped listings

**Decision.** The 120 listings come from a generator with a seeded random number generator (seed 2026), so it produces the same flats every time. Metro stations, localities and tech parks are real.

**Why.** Scraping listing sites isn't allowed and real data costs money. Fixed, repeatable data also keeps tests, evals and screenshots stable.

**Trade-off.** Rents are realistic assumptions, not market data, and the app labels them as demo data everywhere.
