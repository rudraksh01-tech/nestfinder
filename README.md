# NestFinder

AI flat finder for Bengaluru. Describe how you live in plain words (English, Hindi or Hinglish) and NestFinder matches you to flats, checks whether the rent and deposit are fair, and helps you decide between a shortlist.

> Work in progress. The listings are sample data.

## Planned features

- **AI Match Score:** a % match for every flat, with the reasons behind it.
- **Fair Rent Check:** paste a broker's message to see if the rent and deposit are fair for the area, and get a negotiation message.
- **Compare & Decide:** a side-by-side comparison of shortlisted flats with a reasoned recommendation.
- Broker dashboard with leads, visits and listing management.

## Stack

- **Client:** React (Vite), Tailwind CSS, React Router
- **Server:** Node.js, Express, MongoDB (Mongoose)
- **AI:** LangChain.js, MongoDB Atlas Vector Search, Langfuse

## Run locally

Requires Node.js 20 or later.

```
cd server && npm install && npm run dev     # API on http://localhost:5000
cd client && npm install && npm run dev     # app on http://localhost:5173
```

The Vite dev server forwards `/api` requests to the API.
