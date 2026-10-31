// Groq chat completions (OpenAI-compatible API) over plain fetch.
import { httpError } from './errors.js';

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
// Groq's free limits (tokens per minute and per day) are counted per model. When the main model
// is rate limited, the same request is retried once on a smaller model that has its own budget:
// a slightly weaker answer beats "busy".
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';
const MODELS = [...new Set([MODEL, FALLBACK_MODEL].filter(Boolean))];

export const llmEnabled = () => Boolean(process.env.GROQ_API_KEY);

// Posts a chat request, moving on to the next model when one answers 429. Returns { res, model }.
async function post(request, timeoutMs) {
  for (const [i, model] of MODELS.entries()) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, model }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 429 && i < MODELS.length - 1) {
      const data = await res.json().catch(() => ({}));
      console.warn(`Groq: ${model} is rate limited (${String(data.error?.message ?? '').split('.')[0]}); retrying on ${MODELS[i + 1]}`);
      continue;
    }
    return { res, model };
  }
}

// `trace` (optional, from lib/tracing.js) records this call as a generation named `name`.
async function complete(body, { trace, name = 'llm' } = {}) {
  if (!llmEnabled()) throw httpError(503, 'The AI assistant is not set up on this server');
  const request = { reasoning_effort: 'low', temperature: 0.3, ...body };
  let model = MODEL;
  const startTime = new Date().toISOString();
  const record = (fields) =>
    trace?.generation({
      name,
      model,
      modelParameters: { temperature: request.temperature, reasoning_effort: request.reasoning_effort },
      input: request.messages,
      startTime,
      endTime: new Date().toISOString(),
      ...fields,
    });

  let res;
  let data;
  try {
    ({ res, model } = await post(request, 25000));
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

// One streamed model turn that may call tools. Text arrives through `onDelta` as it is generated;
// tool calls are assembled from their streamed pieces. Returns { content, toolCalls }.
// Groq does not allow strict structured outputs together with tools or streaming, so tool
// arguments are validated by the caller.
export async function streamTurn({ messages, tools, toolChoice = 'auto', maxTokens = 700 }, { trace, name = 'llm', onDelta } = {}) {
  if (!llmEnabled()) throw httpError(503, 'The AI assistant is not set up on this server');
  const request = {
    reasoning_effort: 'low',
    temperature: 0.3,
    stream: true,
    messages,
    max_completion_tokens: maxTokens,
    ...(tools && { tools, tool_choice: toolChoice }),
  };
  let model = MODEL;
  const startTime = new Date().toISOString();
  let content = '';
  const calls = [];
  let usage;
  let finishReason = null;
  let streamError = null;
  const record = (fields) =>
    trace?.generation({
      name,
      model,
      modelParameters: { temperature: request.temperature, reasoning_effort: request.reasoning_effort, tool_choice: tools ? toolChoice : undefined },
      input: messages,
      startTime,
      endTime: new Date().toISOString(),
      ...fields,
    });

  let res;
  try {
    ({ res, model } = await post(request, 30000));
  } catch (err) {
    record({ error: `Request failed: ${err.message}` });
    throw httpError(502, 'The AI assistant had a problem, please try again');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    record({ error: `Groq ${res.status}: ${data.error?.message ?? 'unknown error'}` });
    if (res.status === 429) throw httpError(503, 'The AI assistant is busy right now, please try again in a minute');
    console.error('Groq error:', res.status, data.error?.message);
    throw httpError(502, 'The AI assistant had a problem, please try again');
  }

  // Server-sent events: one "data: {json}" line per chunk, ending with "data: [DONE]".
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') continue;
      const chunk = JSON.parse(data);
      // Groq reports mid-stream failures (e.g. a rejected tool call) as an "event: error" chunk.
      if (chunk.error) {
        streamError = chunk.error;
        continue;
      }
      const delta = chunk.choices?.[0]?.delta ?? {};
      if (delta.content) {
        content += delta.content;
        onDelta?.(delta.content);
      }
      for (const part of delta.tool_calls ?? []) {
        const call = (calls[part.index] ??= { id: '', name: '', arguments: '' });
        if (part.id) call.id = part.id;
        if (part.function?.name) call.name += part.function.name;
        if (part.function?.arguments) call.arguments += part.function.arguments;
      }
      usage = chunk.x_groq?.usage ?? chunk.usage ?? usage;
      finishReason = chunk.choices?.[0]?.finish_reason ?? finishReason;
    }
  }

  if (streamError) {
    record({ error: `Groq stream error ${streamError.code ?? ''}: ${streamError.message}`, output: streamError.failed_generation });
    return { content, toolCalls: [], finishReason: 'error', model, error: { code: streamError.code, message: streamError.message } };
  }

  const toolCalls = calls.filter(Boolean);
  record({ output: toolCalls.length ? { content, tool_calls: toolCalls, finish_reason: finishReason } : content || { empty: true, finish_reason: finishReason }, usage });
  return { content, toolCalls, finishReason, model };
}
