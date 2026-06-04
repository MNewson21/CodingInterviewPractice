# AI Features — Supabase Edge Functions (provider-agnostic LLM proxy)

Hints and review call an LLM through Supabase Edge Functions so the API key stays
server-side. The proxy speaks the OpenAI-compatible Chat Completions format, so you
can point it at a FREE provider — you are not locked into a paid one.

> Nothing here is required to run the app. Until you deploy these functions, the AI
> buttons are simply disabled. Everything else works for free.

## Free / cheap provider options
- **OpenRouter** — has free models (suffix `:free`, e.g. `meta-llama/llama-3.3-70b-instruct:free`). Rate-limited but $0. (default)
- **Groq** — free tier, very fast. `AI_BASE_URL=https://api.groq.com/openai/v1`
- **Google Gemini** — free tier. `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`
- **Bring-your-own-key** — or have users supply their own key so costs fall on them.

All are rate-limited and can change (like Piston did) — fine for a portfolio demo.

## Deploy
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF

# point at a free provider (example: OpenRouter free model)
supabase secrets set AI_API_KEY=sk-or-...                       # your free key
supabase secrets set AI_BASE_URL=https://openrouter.ai/api/v1   # optional (this is the default)
supabase secrets set AI_MODEL=meta-llama/llama-3.3-70b-instruct:free  # optional

supabase functions deploy ai-hint
supabase functions deploy ai-review
```

JWT verification is on by default, so only signed-in users can call them, and the
client calls them via `supabase.functions.invoke(...)` (auto-attaches the JWT).
Both calls are on-demand (button click only) and capped at a few hundred tokens.
