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

interface Runtime {
  language: string;
  version: string;
  aliases: string[];
}

// Piston requires an explicit version per language; fetch the list once and cache.
let runtimesCache: Runtime[] | null = null;

async function getRuntimes(): Promise<Runtime[]> {
  if (runtimesCache) return runtimesCache;
  const res = await fetch(`${PISTON_URL}/runtimes`);
  if (!res.ok) throw new Error(`Failed to load Piston runtimes (${res.status})`);
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

  const res = await fetch(`${PISTON_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: PISTON_LANGUAGE[language],
      version,
      files: [{ name: FILE_NAME[language], content: code }],
      stdin,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Piston execute failed (${res.status}): ${text}`);
  }

  return (await res.json()) as PistonResponse;
}
