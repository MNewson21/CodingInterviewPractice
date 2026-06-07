import type { Language } from '../../types/problem';

// Configurable so the app can target a self-hosted Piston, a whitelisted
// public instance, or a proxy. Default is the public emkc endpoint
// (whitelist-only since 2026-02-15 — override via VITE_PISTON_URL).
const PISTON_URL = import.meta.env.VITE_PISTON_URL ?? 'https://emkc.org/api/v2/piston';

// Our language ids -> Piston language names.
const PISTON_LANGUAGE: Record<Language, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'c++',
};

// File names help Piston pick the right toolchain (esp. Java/C++).
const FILE_NAME: Record<Language, string> = {
  javascript: 'main.js',
  typescript: 'main.ts',
  python: 'main.py',
  java: 'Main.java',
  cpp: 'main.cpp',
};

// Per-request resource limits sent on every /execute. These are defence-in-depth:
// the authoritative caps live in the Piston server config + reverse proxy (see
// docs/PISTON_SETUP.md), but sending sane limits from the client keeps a single
// runaway submission from tying up a worker even on legitimate traffic.
//
// Piston REJECTS any request value that exceeds its configured ceiling, so these must
// stay <= the box's PISTON_RUN_TIMEOUT / PISTON_COMPILE_TIMEOUT. We use Piston's stock
// defaults (3000ms run, 10000ms compile) so the app works against an un-tuned box too.
const RUN_TIMEOUT_MS = 3_000;
const COMPILE_TIMEOUT_MS = 10_000;
const MEMORY_LIMIT_BYTES = 256 * 1024 * 1024; // 256 MB per run/compile

/** Distinguishes infrastructure failures from real run/compile errors so the UI can react. */
export type PistonErrorKind = 'unavailable' | 'rate-limited' | 'runtime';

export class PistonError extends Error {
  kind: PistonErrorKind;
  constructor(kind: PistonErrorKind, message: string) {
    super(message);
    this.name = 'PistonError';
    this.kind = kind;
  }
}

/** fetch wrapper that maps network failures and rate-limits onto typed PistonErrors. */
async function pistonFetch(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${PISTON_URL}${path}`, init);
  } catch {
    // Network-level failure: container down, wrong URL, offline, or blocked by CORS.
    throw new PistonError('unavailable', 'Could not reach the code-execution service.');
  }
  if (res.status === 429) {
    throw new PistonError('rate-limited', 'Code-execution service is rate-limited.');
  }
  return res;
}

interface Runtime {
  language: string;
  version: string;
  aliases: string[];
}

// Piston requires an explicit version per language; fetch the list once and cache.
let runtimesCache: Runtime[] | null = null;

async function getRuntimes(): Promise<Runtime[]> {
  if (runtimesCache) return runtimesCache;
  const res = await pistonFetch('/runtimes');
  if (!res.ok) throw new PistonError('unavailable', `Failed to load Piston runtimes (${res.status}).`);
  runtimesCache = (await res.json()) as Runtime[];
  return runtimesCache;
}

async function resolveVersion(language: Language): Promise<string> {
  const target = PISTON_LANGUAGE[language];
  const runtimes = await getRuntimes();
  const match = runtimes.find((r) => r.language === target || r.aliases.includes(target));
  if (!match) throw new Error(`Piston has no runtime for ${language}`);
  return match.version;
}

export interface PistonRunStage {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  output: string;
}

export interface PistonResponse {
  run: PistonRunStage;
  compile?: PistonRunStage;
}

export async function executeCode(params: {
  language: Language;
  code: string;
  stdin: string;
}): Promise<PistonResponse> {
  const { language, code, stdin } = params;
  const version = await resolveVersion(language);

  const res = await pistonFetch('/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: PISTON_LANGUAGE[language],
      version,
      files: [{ name: FILE_NAME[language], content: code }],
      stdin,
      run_timeout: RUN_TIMEOUT_MS,
      compile_timeout: COMPILE_TIMEOUT_MS,
      run_memory_limit: MEMORY_LIMIT_BYTES,
      compile_memory_limit: MEMORY_LIMIT_BYTES,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new PistonError('runtime', `Execution failed (${res.status}): ${text}`);
  }

  return (await res.json()) as PistonResponse;
}
