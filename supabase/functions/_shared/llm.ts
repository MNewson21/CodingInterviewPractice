// Provider-agnostic LLM client (OpenAI-compatible Chat Completions).
// Works with OpenRouter (incl. free `:free` models), Groq, Gemini (OpenAI endpoint),
// Mistral, Together, DeepSeek, etc. The API key lives ONLY here, in Edge Function
// secrets — never in the browser. Configure via secrets:
//   AI_API_KEY   (required)
//   AI_BASE_URL  (default: https://openrouter.ai/api/v1)
//   AI_MODEL     (default: a free OpenRouter model)
const BASE_URL = Deno.env.get('AI_BASE_URL') ?? 'https://openrouter.ai/api/v1';
const MODEL = Deno.env.get('AI_MODEL') ?? 'meta-llama/llama-3.3-70b-instruct:free';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callLLM(opts: {
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<string> {
  const apiKey = Deno.env.get('AI_API_KEY');
  if (!apiKey) throw new Error('AI_API_KEY is not set in Edge Function secrets');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      messages: opts.messages,
    }),
  });

  if (!res.ok) throw new Error(`LLM API error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/** Pull a JSON object out of a model response that may be fenced or prefixed. */
export function extractJsonObject(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model did not return JSON');
  return JSON.parse(candidate.slice(start, end + 1));
}
