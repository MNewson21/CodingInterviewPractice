import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { extractJsonObject } from './llm.ts';

// extractJsonObject has to survive the many shapes an LLM returns JSON in:
// bare, fenced, fenced-with-language, or wrapped in prose.

Deno.test('parses a bare JSON object', () => {
  assertEquals(extractJsonObject('{"a":1,"b":"two"}'), { a: 1, b: 'two' });
});

Deno.test('unwraps a ```json fenced block', () => {
  const raw = 'Here is your review:\n```json\n{"verdict":"pass"}\n```';
  assertEquals(extractJsonObject(raw), { verdict: 'pass' });
});

Deno.test('unwraps a plain (unlabelled) fenced block', () => {
  assertEquals(extractJsonObject('```\n{"n":2}\n```'), { n: 2 });
});

Deno.test('strips prose surrounding the object', () => {
  assertEquals(extractJsonObject('Sure! {"ok":true} hope that helps'), { ok: true });
});

Deno.test('throws when the response contains no object', () => {
  assertThrows(() => extractJsonObject('no json here'), Error, 'did not return JSON');
});
