<h1 align="center">NestFinder</h1>

<p align="center">
  <b>An AI flat finder for Bengaluru.</b><br/>
  Tell it how you live, in English, Hindi or Hinglish. It finds the flats that fit, explains why,<br/>
  checks whether the rent and deposit are fair, and helps you choose from your shortlist.
</p>

<p align="center">
  <a href="https://nestfinder-woad.vercel.app"><b>Live demo</b></a> ·
  <a href="docs/demo.mp4"><b>Demo video (2:45)</b></a> ·
  <a href="#9-run-it-on-your-computer"><b>Run locally</b></a> ·
  Broker demo login: <code>demo@nestfinder.test</code> / <code>demo1234</code>
</p>

<p align="center">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white">
  <img alt="Tailwind CSS v4" src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="Node.js 24" src="https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&logoColor=white">
  <img alt="Express 5" src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white">
  <img alt="MongoDB Atlas" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white">
  <br/>
  <img alt="Groq gpt-oss-120b" src="https://img.shields.io/badge/LLM-Groq_gpt--oss--120b-F55036">
  <img alt="Tool calling agent" src="https://img.shields.io/badge/AI-tool_calling_agent-1E4FFF">
  <img alt="Langfuse" src="https://img.shields.io/badge/tracing-Langfuse-0A0A0A">
  <img alt="OpenTelemetry" src="https://img.shields.io/badge/OpenTelemetry-425CC7?logo=opentelemetry&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white">
  <img alt="Render" src="https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=black">
  <br/>
  <img alt="Agent eval 20/20" src="https://img.shields.io/badge/agent_eval-20%2F20-0E8F63">
  <img alt="Unit tests 26 passing" src="https://img.shields.io/badge/unit_tests-26_passing-0E8F63">
  <img alt="Free tier only" src="https://img.shields.io/badge/cost-free_tier_only-6B7284">
</p>

![The assistant answering "I work at Manyata Tech Park, budget 25k, I have a dog and want the metro nearby" with three scored flats](docs/demo-chat.gif)

<p align="center"><sub>Designed and built by <b>Rudra Pratap Singh</b>. The 120 listings and the brokers are sample data; the map, the 82 Namma Metro stations, 25 localities and 6 tech parks are real (OpenStreetMap).</sub></p>

## At a glance

| | |
|---|---|
| **What** | AI flat finder for Bengaluru: Match Score, Fair Rent Check, Compare & Decide, broker dashboard |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router, motion (scroll animation), cobe (WebGL globe) |
| **Backend** | Node.js 24, Express 5, MongoDB Atlas + Mongoose, JWT auth in httpOnly cookies, Web Push |
| **AI** | Groq `gpt-oss-120b` (fallback `gpt-oss-20b`): tool calling, streaming, strict JSON schemas |
| **Quality** | 26 unit tests, a 20-case agent eval (20/20), every model call traced in Langfuse via OpenTelemetry |
| **Hosting** | Vercel (frontend) + Render (API) + MongoDB Atlas M0, all on free tiers |
| **Languages** | The chat understands and replies in English, Hindi and Hinglish |

## Highlights

- **A tool-calling agent written from scratch** (no LangChain): 5 tools, answers streamed word by word, at most 3 tool rounds, automatic repair of rejected tool calls, and a reply is never empty.
- **"The AI talks, the code decides."** Match scores, rent medians and distances come from tested rules, so they are explainable and the model can't invent them.
- **Evaluated, not just demoed.** A 20-message eval checks the assistant picks the right tools, including a prompt-injection attempt. The failures and the fixes are written down.
- **Observable.** Every AI request is a trace in Langfuse (prompt, output, model, latency, tokens), with phone numbers masked first.
- **Safe by design.** The AI can't book a visit on its own; you confirm it. Rate limits, bcrypt, httpOnly cookies.
- **Production details.** Falls back to a second model when rate limited, wakes the sleeping free server on page load, and trusts exactly the proxy hops measured on the live deploy.

![NestFinder home page: a dark globe with the headline "Tell the AI how you live. It finds the flat."](docs/screenshots/hero-light.webp)

---

## Contents

1. [The problem](#1-the-problem)
2. [What you can do with it (a tour with screenshots)](#2-a-tour-of-the-app)
3. [How it works, in plain words](#3-how-it-works-in-plain-words)
4. [Architecture](#4-architecture)
5. [The AI parts, in depth](#5-the-ai-parts-in-depth)
6. [Data](#6-data)
7. [Tech stack and why](#7-tech-stack-and-why)
8. [Project structure](#8-project-structure)
9. [Run it on your computer](#9-run-it-on-your-computer)
10. [API reference](#10-api-reference)
11. [Testing and evaluation](#11-testing-and-evaluation)
12. [Security and privacy](#12-security-and-privacy)
13. [Limitations](#13-limitations)
14. [What's next](#14-whats-next)
15. [Glossary](#15-glossary)

---

## 1. The problem

Renting a flat in Bengaluru usually goes like this:

- You scroll through hundreds of listings that each ask the same questions in a different way.
- You can't tell how far a flat really is from your office or the metro.
- A broker says "₹48,000, 10 months deposit" on WhatsApp and you have no idea whether that's normal.
- You end up with three good options and no clear way to choose.

NestFinder answers the three questions every flat hunt comes down to:

| Question | Feature |
|---|---|
| Does this flat fit my life? | **AI Match Score:** a % for every flat, with the reasons |
| Is the price fair? | **Fair Rent Check:** paste the broker's message, get a verdict and a counter-offer |
| Which one should I pick? | **Compare & Decide:** your shortlist side by side, with a reasoned pick |

Plus a **broker dashboard** where brokers see enquiries, visit requests and their listings, and get a browser notification when a new lead comes in.

---

## 2. A tour of the app

### 2.1 Home page

The hero has a draggable 3D globe. The arcs show where people move to Bengaluru from (Mumbai, Delhi, Hyderabad, Chennai, Pune, Kolkata). There is a light theme (dark globe) and a dark theme (white globe), switched from the moon/sun button in the navbar.

| Light theme | Dark theme |
|---|---|
| ![Home page in the light theme](docs/screenshots/hero-light.webp) | ![Home page in the dark theme](docs/screenshots/hero-dark.webp) |

As you scroll, a phone stands up, wakes to a lock screen and plays a short chat with the assistant, message by message. Scrolling back up reverses it.

![A phone showing a chat: "I work at Manyata. My budget is 25k and I have a dog." and three matching flats](docs/screenshots/phone-story.webp)

The three features, each with a small live preview. The rent card is interactive: move your cursor over the bar and the verdict and the saving change.

![Three feature cards: Match Score, Fair Rent Check, Compare & Decide](docs/screenshots/features.webp)

An "Ask anything" panel shows a real Fair Rent Check answer, and an FAQ answers 18 common questions in three tabs.

![Ask anything panel with a rent answer card](docs/screenshots/ask-anything.webp)

![FAQ with tabs: Finding a flat, Data and AI, For brokers](docs/screenshots/faq.webp)

### 2.2 Match: chat with the assistant

On `/match` you can either fill in the filters or just type. The assistant understands the message, fills in the form for you, scores all 120 flats and replies with the top three, including each flat's main problem.

![The assistant replying to "I work at Manyata Tech Park, budget 25k, I have a dog and want the metro nearby" with three flats and their scores](docs/screenshots/match-chat.webp)

What happened behind that reply:

1. The model read the message and decided to call the `search_flats` tool with `techPark: "Manyata Tech Park", budget: 25000, pets: true, metro: true`.
2. The server scored every flat with fixed rules (not the AI) and sent back the top three, each split into what fits and what doesn't.
3. The model wrote the reply using only those facts. The filter form on the left updated itself.

The same chat can also check a rent ("is 48k fair for a 2BHK in HSR?"), compare flats ("compare NF-102 and NF-097"), look up a flat ("does NF-066 have a gym?") and set up a visit ("can I see NF-097 on Saturday?"). A visit is never booked by the AI: a card appears and **you** confirm it.

### 2.3 Flats and flat details

All 120 flats with filters (area, BHK, budget, tenant type, furnishing, metro distance, office distance, pets). Filters live in the URL, so a filtered list can be shared as a link.

![The flats page with filters on the left and flat cards](docs/screenshots/flats.webp)

Each flat has its details, a deposit warning when it's 8 months or more, distances to all six tech parks, a map, an enquiry / visit form and a link to check its rent.

![A flat detail page with facts, an enquiry form and a map](docs/screenshots/flat-detail.webp)

### 2.4 Fair Rent Check

Paste the broker's WhatsApp message. The app pulls out the area, BHK, rent and deposit, compares them with similar sample flats, and gives a verdict, a fair counter-offer and a polite message to send back (in English or Hinglish).

![Fair Rent Check: "Slightly high, ₹48,000 is 14% above the median of 7 2BHK flats", a 10-month deposit warning, a counter-offer and a message to the broker](docs/screenshots/rent-check.webp)

### 2.5 Compare & Decide

Shortlist up to four flats with the heart button. The comparison table highlights the best value in each row. "Pick the best one for me" asks the AI to choose, with three reasons based on the facts, when the runner-up would be the better choice, and one thing to check before paying.

![Compare page: the AI picks NF-066, with reasons, a runner-up note and a warning, above a comparison table](docs/screenshots/compare.webp)

### 2.6 Broker side

Brokers can register, or use the one-click demo login (`demo@nestfinder.test` / `demo1234`).

| Login | Dashboard |
|---|---|
| ![Broker login page with a demo login button](docs/screenshots/broker-login.webp) | ![Broker dashboard with stats, lead alerts and a list of leads](docs/screenshots/dashboard.webp) |

The dashboard shows listings, total and new leads, upcoming visits, each lead with an inline status change, and the broker's own listings with edit and delete. "Enable notifications" turns on browser push alerts for new leads.

![Form to add a new listing](docs/screenshots/listing-form.webp)

When a broker adds a flat, the server works out its map location, nearest metro station and distance to every tech park on its own.

### 2.7 On a phone

Every page works at phone width. Below a laptop width the navbar folds into a menu.

| Home | Match (dark theme) | Flats |
|---|---|---|
| ![Home page on a phone](docs/screenshots/mobile-home.webp) | ![Match page on a phone in the dark theme](docs/screenshots/mobile-match.webp) | ![Flats page on a phone](docs/screenshots/mobile-flats.webp) |

---

## 3. How it works, in plain words

If you're new to web apps, here is the whole thing in five pieces.

1. **The frontend** is what you see in the browser: the pages, buttons and animations. It's built with React. It never talks to the database directly; it asks the backend.
2. **The backend** is a small server (Node.js + Express). The frontend sends it requests like "give me flats under ₹25,000" and it sends back data as JSON.
3. **The database** (MongoDB) stores the flats, the brokers, the leads and the push-notification subscriptions.
4. **The rules engine** is plain code that scores flats and judges rents. Same input, same answer, every time, and every point has a written reason. No AI here.
5. **The AI (a large language model)** does the language work only:
   - understanding a message in English, Hindi or Hinglish,
   - deciding which tool to use,
   - writing a friendly reply from facts it was given,
   - drafting the negotiation message,
   - choosing between shortlisted flats and explaining why.

The key design idea: **the AI talks, the code decides.** Numbers like match scores, medians and distances always come from code, so the AI can't invent them.

---

## 4. Architecture

```mermaid
flowchart LR
  subgraph Browser
    UI["React app<br/>(Vite, Tailwind)"]
    SW["Service worker<br/>(push alerts)"]
  end

  subgraph Server["Express API (Node 24)"]
    R["Routes<br/>/api/listings, /api/match,<br/>/api/assistant, /api/rent-check,<br/>/api/compare, /api/broker ..."]
    RULES["Rules engine<br/>match.js, fairRent.js, geo.js"]
    AGENT["Assistant loop<br/>+ 5 tools"]
    LLM["llm.js<br/>Groq client + fallback"]
    TRACE["tracing.js<br/>OpenTelemetry spans"]
  end

  DB[("MongoDB Atlas<br/>listings, brokers,<br/>leads, push subs")]
  GROQ["Groq API<br/>gpt-oss-120b<br/>(fallback gpt-oss-20b)"]
  LF["Langfuse<br/>traces"]
  PUSH["Browser push service<br/>(FCM etc.)"]

  UI -- "/api (JSON, NDJSON stream)" --> R
  R --> RULES
  R --> AGENT
  AGENT --> RULES
  AGENT --> LLM
  LLM --> GROQ
  LLM --> TRACE --> LF
  R <--> DB
  R -- "new lead" --> PUSH --> SW
```

In development, Vite serves the frontend on port 5173 and forwards every `/api` request to the backend on port 5000. In production it's the same idea: Vercel serves the frontend and rewrites `/api` to the backend on Render (`client/vercel.json`), so the browser sees one site and the login cookie stays first-party. The Render service is described in `render.yaml`; secrets are set in the Render dashboard, not in the repo.

The free Render instance sleeps after 15 idle minutes and takes up to a minute to wake, so the app pings `/api/health` as soon as it loads, and the chat retries once if the server can't be reached. Requests pass through four proxies (Vercel, Cloudflare and two inside Render), measured on the live deploy, so Express trusts four hops to see the visitor's real IP for rate limiting.

### One assistant message, step by step

```mermaid
sequenceDiagram
  participant U as You
  participant C as React (ChatPanel)
  participant A as /api/assistant
  participant M as Groq model
  participant T as Tools (rules + DB)

  U->>C: "I work at Manyata, budget 25k, I have a dog"
  C->>A: POST messages + current filters
  A->>M: system prompt + chat + TODAY + preferences + tool list
  M-->>A: call search_flats({techPark, budget, pets})
  A-->>C: {"type":"status","text":"Finding flats that fit"}
  A->>T: search_flats → score all 120 flats
  T-->>A: top 3, each with fits and problems
  A-->>C: {"type":"tool", ...} (flat chips, form updates)
  A->>M: here are the tool results
  M-->>A: reply text, streamed word by word
  A-->>C: {"type":"delta","text":"Here"} ...
  A-->>C: {"type":"done"}
```

The answer arrives as **NDJSON** (one JSON object per line), so the chat can show "Finding flats that fit", then the flat cards, then the reply as it's being written, instead of making you wait for the whole thing.

---

## 5. The AI parts, in depth

### 5.1 Which model, and why

- **Groq** hosts open-weight models with a free tier and very fast responses. The main model is **`openai/gpt-oss-120b`** with low reasoning effort, about 2.4 seconds per assistant turn.
- The free tier allows 8,000 tokens a minute and 200,000 a day **per model**. When the main model is rate limited (HTTP 429), `llm.js` retries once on **`openai/gpt-oss-20b`**, which has its own budget. The trace records which model answered.
- The client is plain `fetch`, no SDK, so every request and error is visible in one small file.

### 5.2 Rules first: Match Score

`server/src/lib/match.js` scores a flat out of 100 against what you asked for. Things you didn't mention are ignored.

| Factor | Weight | Full marks | Zero |
|---|---|---|---|
| Budget (rent + maintenance) | 25 | within budget | 20% over |
| Distance to your office | 25 | up to 3 km | 18 km |
| Metro, if you asked for it | 15 | up to 0.8 km | 4 km |
| Metro, if you didn't ask | 5 | up to 1 km | 5 km |
| BHK | 15 | exact | 2 off |
| Tenant type (bachelor/family) | 10 | owner accepts you | owner doesn't |
| Pets | 10 | allowed | not allowed |
| Quiet area | 8 | quiet | noisy |
| Gym, car parking, furnishing | 5 each | has it / exact | doesn't |

Score = points earned ÷ points possible × 100. Two things are **dealbreakers**: the owner not accepting your tenant type, and no pets when you have one. A dealbreaker caps the score at 40%, however good the rest is. Reasons are sorted with problems first, so you see the catch before the good news.

### 5.3 Rules first: Fair Rent Check

`server/src/lib/fairRent.js`:

1. Find sample flats with the same BHK in the same area. If there are fewer than 4, widen the search to 4 km, then 8 km. Prefer the same furnishing when there are enough.
2. Take the **median** rent of those flats.
3. Verdict by how far the asked rent is from the median: within ±10% is fair, up to 25% above is slightly high, more than that is high.
4. Flag the deposit if it's above what similar flats ask, or above 6 months.
5. Counter-offer: the median rent (never above what was asked) and the typical deposit.

The AI is used only at the edges: to read the broker's message (strict JSON schema), and to write the negotiation message, and only when there is something to negotiate.

### 5.4 Structured outputs

Where the app needs data, not prose, the model must answer in a **strict JSON schema** (Groq structured outputs). Examples:

- Reading a broker's message into `{ locality, bhk, rent, depositMonths, furnishing }`.
- The Compare pick: `pick` and `runnerUp` are **enums of the shortlisted flat codes**, so the model cannot pick a flat that isn't on your list.

The server still re-validates every value (for example `parsePrefs` for preferences), because a schema guarantees a shape, not a sensible value.

### 5.5 The tool-calling assistant

`server/src/routes/assistant.js` runs a small **agent loop**. The model can call five tools (`server/src/lib/agentTools.js`), each a thin wrapper over existing code:

| Tool | What it does |
|---|---|
| `search_flats` | scores all flats for the preferences and returns the top 3 with fits and problems |
| `check_rent` | runs the Fair Rent Check for an area, BHK and rent (or one of our flats) |
| `get_flat` | returns the facts of one flat by code |
| `compare_flats` | compares 2–4 flats by code |
| `book_visit` | validates a date and asks the user to confirm. It writes nothing. |

Guard rails in the loop:

- **At most 3 rounds** of tool calls per message, then the model must answer.
- **Repair:** if Groq rejects a tool call because the arguments don't match the schema, the error is sent back to the model and it gets up to 2 tries to fix it.
- **Nudge:** if a turn comes back completely empty, the model is asked once to continue.
- **Never an empty reply:** if all else fails, a fallback sentence is sent.
- **Today's date** (India time) is given to the model so "next Saturday" becomes a real date.
- **Free-text names, resolved in code:** the schemas take office and area names as plain text, and `server/src/lib/areas.js` maps "Whitefield", "Hebbal", "Kasavanahalli" or "e-city" to the right place. An earlier version used enums, and Groq rejected the whole call when the model wrote "Whitefield" instead of "ITPL Whitefield", which showed up as empty replies.
- **Language:** `server/src/lib/language.js` picks the reply language (Devanagari → Hindi, common Hinglish words → Hinglish, otherwise English).

### 5.6 Grounding: the AI only says what the tools said

- Tool results split each flat into `fits` and `problems`, and the prompt says to describe a flat only with its fits and to mention its main problem. This was added after the model once called a noisy flat "quiet" because the user asked for quiet.
- Tool results are treated as **data, not instructions**: the prompt tells the model to ignore any instructions found inside them or inside pasted messages.

### 5.7 Observability with Langfuse

Every AI request is traced (`server/src/lib/tracing.js`): one trace per request, with one child per model call showing the prompt, the output, the model, latency, token usage and errors. It's sent as **OpenTelemetry** spans (OTLP over HTTP) to Langfuse's free cloud. Indian mobile numbers are masked as `[phone]` before anything leaves the server.

### 5.8 Evaluation

A tool-choice eval (`npm run eval:agent`) sends 20 messages to the real agent and checks that it calls the right tools in the right order: searches, rent checks, lookups, comparisons, visits, two-intent messages, an off-topic request and a prompt-injection attempt. **Current result: 20/20**, all on gpt-oss-120b. The full history, including the failures that led to fixes, is in [`server/eval/README.md`](server/eval/README.md). See [section 11](#11-testing-and-evaluation).

---

## 6. Data

| File | What | Source |
|---|---|---|
| `server/data/metro-stations.json` | 82 Namma Metro stations (Purple, Green, Yellow lines) with coordinates | OpenStreetMap (Overpass API). Pink line left out because it isn't open yet. |
| `server/data/places.json` | 25 localities and 6 tech parks | OpenStreetMap (Nominatim), via `server/scripts/geocode-places.js` |
| `server/data/listings.json` | 120 sample flats | `server/scripts/generate-listings.js` |

The listings are generated, not scraped. The generator uses a seeded random number generator (seed 2026), so it produces exactly the same 120 flats every time. Rents start from a per-area 1BHK assumption and scale with BHK, size and furnishing. Each flat's nearest metro and distance to every tech park are computed from real coordinates. Distances are **straight-line**, not travel time, and the app says so wherever it shows them.

---

## 7. Tech stack and why

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Vite | fast dev server, component model, the most common choice in job descriptions |
| Styling | Tailwind CSS v4 | design tokens in one place (`@theme`), which also made the dark theme a token swap |
| Routing | React Router | filters and chat preferences live in the URL, so pages are shareable |
| Animation | `motion` | scroll-linked phone story with spring smoothing |
| Globe | `cobe` | tiny WebGL globe (a few KB) |
| Icons | lucide-react | consistent, light |
| Backend | Node 24 + Express 5 | same language as the frontend; Express 5 passes async errors to the error handler |
| Database | MongoDB Atlas (free M0) + Mongoose | flexible documents, geospatial `2dsphere` index, free hosted tier |
| Auth | JWT in an httpOnly cookie, bcrypt | the token can't be read by page scripts |
| LLM | Groq: gpt-oss-120b, fallback gpt-oss-20b | free tier, fast, supports tool calling, streaming and strict JSON schemas |
| Tracing | Langfuse via OpenTelemetry | free cloud, standard format |
| Alerts | Web Push (VAPID) + service worker | free, works without an app |
| Tests | `node:test` | built into Node, no extra framework |
| Browser checks | puppeteer-core | end-to-end checks and these screenshots |

LangChain was planned at the start but wasn't needed: the agent loop is about 70 lines and easier to explain and debug without a framework.

---

## 8. Project structure

```
NestFinder/
├── client/                      React app
│   ├── index.html               applies a saved dark theme before first paint
│   ├── public/sw.js             service worker for push alerts
│   └── src/
│       ├── App.jsx              routes
│       ├── index.css            design tokens, light and dark values, .glass
│       ├── pages/               Home, Listings, ListingDetail, Match, RentCheck,
│       │                        Compare, BrokerLogin, Dashboard, ListingForm
│       ├── components/          Navbar, Footer, Globe, ChatPanel, ListingCard,
│       │   └── home/            PhoneStory ...
│       ├── context/             AuthContext, ShortlistContext, ThemeContext
│       └── lib/                 api.js (fetch + errors), useFetch.js, ui.js
├── server/                      Express API
│   ├── src/
│   │   ├── index.js             app setup, routes, error handler
│   │   ├── routes/              listings, match, chat, assistant, rentCheck,
│   │   │                        compare, auth, leads, broker
│   │   ├── lib/                 match.js, fairRent.js, geo.js, areas.js,
│   │   │                        language.js, llm.js, agentTools.js,
│   │   │                        tracing.js, notify.js, telegram.js
│   │   └── models/              Listing, Broker, Lead, PushSubscription
│   ├── data/                    metro stations, places, listings (JSON)
│   ├── scripts/                 geocode, generate listings, seed the database
│   ├── test/                    unit tests
│   └── eval/                    assistant tool-choice eval and its history
└── docs/screenshots/            images used in this README
```

---

## 9. Run it on your computer

Everything here uses free accounts. Nothing asks for a credit card.

### What you need

- **Node.js 24** ([download](https://nodejs.org)). The server uses `node --env-file`, so Node 20.6 or newer is required; 24 is what it was built on.
- A free **MongoDB Atlas** cluster ([mongodb.com/atlas](https://www.mongodb.com/atlas)), or MongoDB on your machine.
- A free **Groq** API key ([console.groq.com](https://console.groq.com)) for the AI features. Without it, everything except the AI works.
- Optional: free **Langfuse** keys ([cloud.langfuse.com](https://cloud.langfuse.com)) for tracing.

### Steps

```bash
# 1. Get the code
git clone <this repo>
cd NestFinder

# 2. Install
cd server && npm install
cd ../client && npm install
cd ..

# 3. Settings: copy the example and fill in your values
cp server/.env.example server/.env
#    MONGODB_URI   your Atlas connection string
#    JWT_SECRET    any long random string
#    GROQ_API_KEY  your Groq key (optional but needed for AI)
#    VAPID_*       optional, for push alerts: npx web-push generate-vapid-keys
#    LANGFUSE_*    optional, for tracing

# 4. Put the demo data in the database (120 flats, 3 brokers, 10 leads)
cd server && npm run seed

# 5. Start the API (terminal 1)
npm run dev                      # http://localhost:5000

# 6. Start the app (terminal 2)
cd client && npm run dev         # http://localhost:5173
```

Open http://localhost:5173. For the broker side, use the demo login on `/broker/login`.

`npm run seed` resets the demo data, so anything changed with the demo login goes back to the original.

### Useful commands

| Where | Command | What it does |
|---|---|---|
| server | `npm run dev` | API with auto-restart on changes |
| server | `npm run seed` | reset demo listings, brokers and leads |
| server | `npm test` | unit tests |
| server | `npm run eval:agent` | assistant eval against the real model (~15 min, uses free quota) |
| client | `npm run dev` | app with hot reload |
| client | `npm run build` | production build into `client/dist` |
| client | `npm run lint` | oxlint |

---

## 10. API reference

All endpoints are under `/api` and return JSON.

### Public

| Method | Path | What |
|---|---|---|
| GET | `/api/health` | is the server up |
| GET | `/api/listings` | flats with filters, sort and pagination |
| GET | `/api/listings/meta` | values for the filter dropdowns |
| GET | `/api/listings/:id` | one flat, by code (`NF-066`) or id |
| GET | `/api/match?...` | score every flat for the given preferences |
| POST | `/api/assistant` | the tool-calling assistant; streams NDJSON events |
| POST | `/api/chat` | simpler chat (extract preferences, score, reply); used as a fallback |
| POST | `/api/rent-check` | Fair Rent Check from a broker message and/or form values |
| GET | `/api/compare?codes=...` | comparison data for up to 4 flats |
| POST | `/api/compare/decide` | the AI's pick for a shortlist |
| POST | `/api/leads` | send an enquiry or visit request to the flat's broker |

### Broker (needs login)

| Method | Path | What |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | account |
| GET | `/api/auth/me` | who is logged in (`{ broker: null }` when nobody) |
| GET | `/api/broker/stats` | counts for the dashboard |
| GET, PATCH | `/api/broker/leads`, `/api/broker/leads/:id` | list leads, change a lead's status |
| GET, POST, PATCH, DELETE | `/api/broker/listings`, `/api/broker/listings/:code` | manage own listings |
| GET, POST | `/api/broker/push`, `.../subscribe`, `.../unsubscribe`, `.../test` | browser push alerts |
| GET, POST, DELETE | `/api/broker/telegram`, `.../connect`, `.../verify`, `.../test` | Telegram alerts (off until a bot token is set) |

Every broker query is scoped to the logged-in broker, so one broker can never read another's leads.

---

## 11. Testing and evaluation

**Unit tests** (`server/test`, run with `npm test`, 26 passing) cover the parts where a silent mistake would hurt most:

- `match.test.js`: scores, dealbreaker caps, the order of reasons
- `fairRent.test.js`: medians, widening the search, verdict bands, deposit flags, counter-offers
- `areas.test.js`: name resolution ("Kasavanahalli" → Sarjapur Road) and language detection
- `tracing.test.js`: phone numbers are masked before export

**Assistant eval** (`server/eval`): 20 messages with the tools the assistant should call.

| Run | What changed before it | Result |
|---|---|---|
| 1 | first version | 18/20. One reply was empty (an enum-rejected tool call); one neighbourhood wasn't known. |
| 2 | free-text names resolved in code, stream errors surfaced, repair loop | 20/20 |
| 3 | tool results split into fits and problems | 13/13; 7 not run (daily free limit) |
| 4 | optional tool fields accept `null` | the 7 missing cases: 7/7, so **20/20** overall |

What the eval does **not** check yet is whether the reply text is true to the tool results. Reading the replies by hand found two slips that a tool-choice eval can't catch, and they are written down in the eval README. A reply-groundedness eval is the next step.

**Browser checks:** the main flows were checked end to end in real Chrome with puppeteer-core, including push notifications through a real push service.

---

## 12. Security and privacy

- **Passwords** are hashed with bcrypt. **Logins** use a JWT in an `httpOnly`, `sameSite=lax` cookie.
- **Rate limits:** failed logins, registrations (5 an hour), public enquiries (10 per 15 minutes), the assistant (25 messages per 10 minutes) and the other AI endpoints.
- **The AI can't take actions on its own.** `book_visit` only shows a confirmation card; the visit request is sent when you press Confirm. (This follows the OWASP LLM Top 10 advice on "excessive agency".)
- **Prompt injection:** the model is told that tool results and pasted text are data, not instructions. The eval includes an "ignore all previous instructions" message, which is refused.
- **Shared demo account:** visitors' phone numbers are masked (`98XXXXXX10`) for the public demo broker, in the dashboard and in alerts. The demo account can't connect Telegram.
- **Tracing:** phone numbers are replaced with `[phone]` before traces are sent to Langfuse.
- **Secrets** live only in `server/.env`, which is git-ignored.

---

## 13. Limitations

Being honest about these is part of the project.

- The listings and brokers are **sample data**. Rents are realistic assumptions, not market data.
- Distances are **straight-line**, not commute time.
- The free Groq tier limits how many AI messages fit in a minute and a day. Heavy use falls back to the smaller model, whose replies are longer.
- The eval checks tool choice, not reply wording.
- Rate limits are kept in memory, so a server restart resets them.
- Telegram alerts are built but switched off: the author's Telegram account can't create bots.
- On the free hosting, the first request after a quiet spell can take up to a minute while the server wakes.

---

## 14. What's next

1. A reply-groundedness eval with Langfuse datasets (does every number in a reply appear in the tool results?).
2. Prompt Guard 2 in front of the chat and broker-written text.
3. Check a rent from a screenshot of the broker's message (a vision model).
4. Hinglish voice input (Whisper).
5. A read-only MCP server so other AI assistants can search flats.

---

## 15. Glossary

| Term | Meaning here |
|---|---|
| **LLM** | Large language model: an AI that reads and writes text. Here, gpt-oss-120b on Groq. |
| **Token** | A piece of a word. Free AI limits are counted in tokens. |
| **Prompt** | The instructions and context sent to the model. |
| **Tool calling** | The model answers "call this function with these arguments" instead of text; the server runs it and sends back the result. |
| **Agent** | A loop where the model can call tools several times before answering. |
| **Structured output** | Forcing the model to reply in an exact JSON shape. |
| **Enum** | A fixed list of allowed values, like the shortlisted flat codes. |
| **Grounding** | Making the model answer only from facts it was given. |
| **Hallucination** | When a model states something that isn't true. |
| **Prompt injection** | Text that tries to make the model ignore its instructions. |
| **Streaming / NDJSON** | Sending the answer piece by piece, one JSON object per line. |
| **Eval** | A fixed set of test inputs with expected behaviour, run against the real model. |
| **Trace** | A record of one request: every model call, its input, output, time and cost. |
| **Rate limit / 429** | "Too many requests"; the server or the AI provider asks you to slow down. |
| **Fallback model** | A second model used when the first is rate limited. |
| **Median** | The middle value when sorted; less affected by one very high or low rent than the average. |
| **JWT** | A signed token that proves who is logged in. |
| **httpOnly cookie** | A cookie that page scripts can't read, which protects the login token. |
| **Service worker** | A small script the browser keeps running to receive push notifications. |
| **2dsphere index** | A MongoDB index for searching by location on a globe. |
| **Design tokens** | Named colours and fonts (like `ink`, `porcelain`, `signal`) used everywhere instead of raw values. |

---

Designed and built by **Rudra Pratap Singh** as a portfolio project.
