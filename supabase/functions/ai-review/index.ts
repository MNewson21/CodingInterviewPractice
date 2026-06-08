import { corsHeaders, json } from '../_shared/cors.ts';
import { callLLM, extractJsonObject } from '../_shared/llm.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Reviews are the heaviest LLM call, so throttle tighter: 6/min and 50/hour per caller.
    const limit = await checkRateLimit(req, 'ai-review', [
      { max: 6, windowSeconds: 60 },
      { max: 50, windowSeconds: 3600 },
    ]);
    if (!limit.allowed) {
      return json(
        { error: 'You are requesting reviews too quickly. Please wait a moment and try again.' },
        429,
      );
    }

    const { title, description, language, code, testSummary } = await req.json();

    const system =
      `You are reviewing a candidate's solution to a coding-interview problem.\n\n` +
      `Title: ${title}\n\n${description}\n\n` +
      `Respond ONLY with minified JSON matching exactly this shape:\n` +
      `{"correctness": string, "timeComplexity": string, "spaceComplexity": string, ` +
      `"improvements": string[], "summary": string}\n` +
      `timeComplexity/spaceComplexity must be Big-O. improvements: 2-4 short bullet strings. ` +
      `Be concise and specific.`;

    const user =
      `Language: ${language}\nTest results: ${testSummary}\n` +
      `Solution:\n\`\`\`\n${code}\n\`\`\``;

    const raw = await callLLM({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      maxTokens: 700,
    });

    return json(extractJsonObject(raw));
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
