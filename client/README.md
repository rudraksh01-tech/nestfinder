# NestFinder client

The React app for NestFinder. See the [main README](../README.md) for what the project does, how it works and how to run it.

```bash
npm install
npm run dev      # http://localhost:5173 (forwards /api to the server on :5000)
npm run build    # production build into dist/
npm run lint     # oxlint
```

- Pages are in `src/pages`, shared pieces in `src/components`.
- Colours and fonts are design tokens in `src/index.css`; the dark theme re-declares the same tokens.
- Requests go through `src/lib/api.js` and `src/lib/useFetch.js`.
