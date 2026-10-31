// LLM tracing with Langfuse, via its public ingestion API (plain fetch, no SDK).
// Each request that uses the LLM becomes one trace; each model call inside it is a generation
// with its prompt, output, latency and token usage. With no keys set, everything here is a no-op.
import { randomUUID } from 'node:crypto';

export const tracingEnabled = () => Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
const baseUrl = () => (process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com').replace(/\/+$/, '');

// Indian mobile numbers in user text (e.g. a pasted broker message) never leave the server.
const PHONE_RE = /(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g;
export function maskPhones(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value).replace(PHONE_RE, '[phone]'));
}

async function send(batch) {
  try {
    const auth = Buffer.from(`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`).toString('base64');
    const res = await fetch(`${baseUrl()}/api/public/ingestion`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch }),
      signal: AbortSignal.timeout(10000),
    });
    // The API answers 207 with per-event results; report any event it rejected.
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.errors?.length) console.error('Langfuse ingestion problem:', res.status, JSON.stringify(body.errors ?? body).slice(0, 300));
  } catch (err) {
    console.error('Langfuse ingestion failed:', err.message);
  }
}

const event = (type, body) => ({ id: randomUUID(), timestamp: new Date().toISOString(), type, body });

export function startTrace(name, { input, metadata } = {}) {
  const id = randomUUID();
  const startedAt = new Date().toISOString();
  const generations = [];
  return {
    id,
    // Called by the LLM client for every model call made during this trace.
    generation({ name: genName, model, input: genInput, output, startTime, endTime, usage, error, modelParameters }) {
      generations.push(
        event('generation-create', {
          id: randomUUID(),
          traceId: id,
          name: genName,
          model,
          modelParameters,
          input: maskPhones(genInput),
          output: maskPhones(output),
          startTime,
          endTime,
          usage: usage && { input: usage.prompt_tokens, output: usage.completion_tokens, total: usage.total_tokens, unit: 'TOKENS' },
          level: error ? 'ERROR' : 'DEFAULT',
          statusMessage: error,
        }),
      );
    },
    // Sends the trace and its generations in one batch, without making the caller wait.
    end({ output, error } = {}) {
      if (!tracingEnabled()) return;
      const trace = event('trace-create', {
        id,
        name,
        timestamp: startedAt,
        input: maskPhones(input),
        output: maskPhones(error ? { error } : output),
        metadata: { ...metadata, durationMs: Date.now() - new Date(startedAt).getTime() },
        tags: ['nestfinder', ...(error ? ['error'] : [])],
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      });
      send([trace, ...generations]);
    },
  };
}

// Runs `fn(trace)` inside a trace and always ends it, recording either the output or the error.
export async function withTrace(name, opts, fn, toOutput = (r) => r) {
  const trace = startTrace(name, opts);
  try {
    const result = await fn(trace);
    trace.end({ output: toOutput(result) });
    return result;
  } catch (err) {
    trace.end({ error: err.message });
    throw err;
  }
}
