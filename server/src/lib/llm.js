// Groq chat completions (OpenAI-compatible API) over plain fetch.
import { httpError } from './errors.js';

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export const llmEnabled = () => Boolean(process.env.GROQ_API_KEY);

async function complete(body) {
  if (!llmEnabled()) throw httpError(503, 'The AI assistant is not set up on this server');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, reasoning_effort: 'low', temperature: 0.3, ...body }),
    signal: AbortSignal.timeout(25000),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 429) throw httpError(503, 'The AI assistant is busy right now, please try again in a minute');
  if (!res.ok) {
    console.error('Groq error:', res.status, data.error?.message);
    throw httpError(502, 'The AI assistant had a problem, please try again');
  }
  return data.choices[0].message.content;
}

// Returns an object that matches `schema` (Groq enforces it with strict structured outputs).
export async function completeJson(messages, name, schema) {
  const content = await complete({
    messages,
    response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } },
  });
  return JSON.parse(content);
}

export const completeText = (messages, maxTokens = 600) => complete({ messages, max_completion_tokens: maxTokens });
