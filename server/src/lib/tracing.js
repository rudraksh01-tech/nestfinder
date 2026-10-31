// LLM tracing with Langfuse over OpenTelemetry (OTLP/HTTP JSON, plain fetch, no SDK).
// Each request that uses the LLM becomes one trace: a root span for the request and one child
// "generation" span per model call, with its prompt, output, latency and token usage.
// With no keys set, everything here is a no-op.
import { randomBytes } from 'node:crypto';

export const tracingEnabled = () => Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
const baseUrl = () => (process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com').replace(/\/+$/, '');

// Indian mobile numbers in user text (e.g. a pasted broker message) never leave the server.
const PHONE_RE = /(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g;
export function maskPhones(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value).replace(PHONE_RE, '[phone]'));
}

const environment = () => (process.env.NODE_ENV === 'production' ? 'production' : 'development');
const hexId = (bytes) => randomBytes(bytes).toString('hex');
const nanos = (date) => (BigInt(new Date(date).getTime()) * 1_000_000n).toString();

// OTLP attribute values are typed. Lists of strings (tags) stay arrays; any other object or
// list (e.g. chat messages) goes in as a JSON string, which is what Langfuse reads.
function attr(key, value) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return { key, value: { arrayValue: { values: value.map((v) => ({ stringValue: v })) } } };
  }
  if (typeof value === 'boolean') return { key, value: { boolValue: value } };
  if (typeof value === 'number') return { key, value: Number.isInteger(value) ? { intValue: String(value) } : { doubleValue: value } };
  return { key, value: { stringValue: typeof value === 'string' ? value : JSON.stringify(value) } };
}
const attrs = (obj) => Object.entries(obj).map(([k, v]) => attr(k, v)).filter(Boolean);

async function send(spans) {
  try {
    const auth = Buffer.from(`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`).toString('base64');
    const res = await fetch(`${baseUrl()}/api/public/otel/v1/traces`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json', 'x-langfuse-ingestion-version': '4' },
      body: JSON.stringify({
        resourceSpans: [
          {
            resource: { attributes: attrs({ 'service.name': 'nestfinder-server' }) },
            scopeSpans: [{ scope: { name: 'nestfinder' }, spans }],
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) console.error('Langfuse export failed:', res.status, (await res.text()).slice(0, 500));
  } catch (err) {
    console.error('Langfuse export failed:', err.message);
  }
}

export function startTrace(name, { input, metadata } = {}) {
  const traceId = hexId(16);
  const rootSpanId = hexId(8);
  const startedAt = new Date();
  const children = [];
  return {
    id: traceId,
    // Called by the LLM client for every model call made during this trace.
    generation({ name: genName, model, input: genInput, output, startTime, endTime, usage, error, modelParameters }) {
      children.push({
        traceId,
        spanId: hexId(8),
        parentSpanId: rootSpanId,
        name: genName,
        kind: 1, // INTERNAL
        startTimeUnixNano: nanos(startTime),
        endTimeUnixNano: nanos(endTime),
        attributes: attrs({
          'langfuse.observation.type': 'generation',
          'langfuse.environment': environment(),
          'langfuse.observation.model.name': model,
          'langfuse.observation.model.parameters': modelParameters,
          'langfuse.observation.input': maskPhones(genInput),
          'langfuse.observation.output': maskPhones(output),
          'langfuse.observation.usage_details': usage && { input: usage.prompt_tokens, output: usage.completion_tokens, total: usage.total_tokens },
          'langfuse.observation.level': error ? 'ERROR' : undefined,
          'langfuse.observation.status_message': error,
        }),
        status: error ? { code: 2, message: error } : { code: 1 },
      });
    },
    // Sends the root span and its generations in one request, without making the caller wait.
    end({ output, error } = {}) {
      if (!tracingEnabled()) return;
      const finalOutput = maskPhones(error ? { error } : output);
      const root = {
        traceId,
        spanId: rootSpanId,
        name,
        kind: 2, // SERVER: one incoming API request
        startTimeUnixNano: nanos(startedAt),
        endTimeUnixNano: nanos(new Date()),
        attributes: attrs({
          'langfuse.trace.name': name,
          'langfuse.trace.tags': ['nestfinder', ...(error ? ['error'] : [])],
          'langfuse.environment': environment(),
          'langfuse.observation.input': maskPhones(input),
          'langfuse.observation.output': finalOutput,
          'langfuse.observation.level': error ? 'ERROR' : undefined,
          ...Object.fromEntries(Object.entries(metadata ?? {}).map(([k, v]) => [`langfuse.trace.metadata.${k}`, v])),
        }),
        status: error ? { code: 2, message: error } : { code: 1 },
      };
      send([root, ...children]);
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
