// Groq chat completions (OpenAI-compatible API) over plain fetch.
import { httpError } from './errors.js';

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export const llmEnabled = () => Boolean(process.env.GROQ_API_KEY);

// `trace` (optional, from lib/tracing.js) records this call as a generation named `name`.
async function complete(body, { trace, name = 'llm' } = {}) {
  if (!llmEnabled()) throw httpError(503, 'The AI assistant is not set up on this server');
  const request = { model: MODEL, reasoning_effort: 'low', temperature: 0.3, ...body };
  const startTime = new Date().toISOString();
  const record = (fields) =>
    trace?.generation({
      name,
      model: MODEL,
      modelParameters: { temperature: request.temperature, reasoning_effort: request.reasoning_effort },
      input: request.messages,
      startTime,
      endTime: new Date().toISOString(),
      ...fields,
    });

  let res;
  let data;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(25000),
    });
    data = await res.json().catch(() => ({}));
  } catch (err) {
    record({ error: `Request failed: ${err.message}` });
    throw httpError(502, 'The AI assistant had a problem, please try again');
  }

  if (!res.ok) {
    record({ error: `Groq ${res.status}: ${data.error?.message ?? 'unknown error'}` });
    if (res.status === 429) throw httpError(503, 'The AI assistant is busy right now, please try again in a minute');
    console.error('Groq error:', res.status, data.error?.message);
    throw httpError(502, 'The AI assistant had a problem, please try again');
  }
  const content = data.choices[0].message.content;
  record({ output: content, usage: data.usage });
  return content;
}

// Returns an object that matches `schema` (Groq enforces it with strict structured outputs).
export async function completeJson(messages, name, schema, opts) {
  const content = await complete(
    { messages, response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } } },
    { name, ...opts },
  );
  return JSON.parse(content);
}

export const completeText = (messages, maxTokens = 600, opts) => complete({ messages, max_completion_tokens: maxTokens }, opts);
