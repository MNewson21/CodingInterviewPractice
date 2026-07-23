import { describe, it, expect } from 'vitest';
import { buildZincRamp, hexToHsl, hslToHex, isDarkHex, normalizeHex } from './themes';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

describe('normalizeHex', () => {
  it('expands shorthand and lowercases', () => {
    expect(normalizeHex('#FFF')).toBe('#ffffff');
    expect(normalizeHex('0d1117')).toBe('#0d1117');
  });
});

describe('isDarkHex', () => {
  it('classifies dark vs light backgrounds', () => {
    expect(isDarkHex('#0d1117')).toBe(true);
    expect(isDarkHex('#ffffff')).toBe(false);
  });
});

describe('hslToHex/hexToHsl roundtrip', () => {
  it('preserves a colour through a roundtrip', () => {
    const { h, s, l } = hexToHsl('#3b82f6');
    expect(normalizeHex(hslToHex(h, s, l))).toBe('#3b82f6');
  });
});

describe('buildZincRamp', () => {
  it('returns all 11 zinc steps', () => {
    const ramp = buildZincRamp('#0d1117');
    expect(Object.keys(ramp)).toHaveLength(11);
    for (const step of STEPS) expect(ramp[`--color-zinc-${step}`]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('anchors 950 to exactly the picked colour', () => {
    expect(buildZincRamp('#0d1117')['--color-zinc-950']).toBe('#0d1117');
    expect(buildZincRamp('#ff8800')['--color-zinc-950']).toBe('#ff8800');
  });

  it('for a dark base, makes the text end (50) light and the bg end (950) dark', () => {
    const ramp = buildZincRamp('#0d1117');
    expect(hexToHsl(ramp['--color-zinc-50']).l).toBeGreaterThan(0.85);
    expect(hexToHsl(ramp['--color-zinc-950']).l).toBeLessThan(0.2);
  });

  it('for a light base, inverts: text end (50) dark, bg end (950) light', () => {
    const ramp = buildZincRamp('#fefefe');
    expect(hexToHsl(ramp['--color-zinc-50']).l).toBeLessThan(0.2);
    expect(hexToHsl(ramp['--color-zinc-950']).l).toBeGreaterThan(0.9);
  });
});
