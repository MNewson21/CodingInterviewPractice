import { corsHeaders, json } from '../_shared/cors.ts';
import { callLLM } from '../_shared/llm.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Throttle before doing any LLM work: 12 hints/min and 120/hour per caller.
    const limit = await checkRateLimit(req, 'ai-hint', [
      { max: 12, windowSeconds: 60 },
      { max: 120, windowSeconds: 3600 },
    ]);
    if (!limit.allowed) {
      return json(
        { error: 'You are requesting hints too quickly. Please wait a moment and try again.' },
        429,
      );
    }

    const { title, description, language, code, level, priorHints } = await req.json();

    const system =
      `You are a coding-interview hint assistant. The candidate is solving:\n\n` +
      `Title: ${title}\n\n${description}\n\n` +
      `Give exactly ONE progressive hint at the requested level. NEVER give the full ` +
      `solution or complete code.\n` +
      `Level 1: nudge toward the general approach/insight.\n` +
      `Level 2: name the specific technique or data structure to use.\n` +
      `Level 3: outline the algorithm as a few pseudo-code steps (still not full code).\n` +
      `Keep it to 1-3 sentences and be encouraging.`;

    const prior = Array.isArray(priorHints) && priorHints.length ? priorHints.join(' | ') : 'none';
    const user =
      `Language: ${language}\nMy current code:\n\`\`\`\n${code}\n\`\`\`\n\n` +
      `Hints already given: ${prior}\n\nGive me hint level ${level}.`;

    const hint = await callLLM({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      maxTokens: 300,
    });

    return json({ level, hint });
  } catch (err) {
    console.error('ai-hint failed:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
