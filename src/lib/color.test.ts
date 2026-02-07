import { deltaE, hexToLab, normalizeHex, toleranceToDelta } from '@/lib/color';

describe('color utils', () => {
  it('normalizes hex values', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex('#AABBCC')).toBe('#aabbcc');
    expect(normalizeHex('bad')).toBe('');
  });

  it('calculates perceptual distance', () => {
    const a = hexToLab('#2b2d30');
    const b = hexToLab('#2b2d30');
    const c = hexToLab('#ffffff');

    expect(deltaE(a, b)).toBeCloseTo(0, 5);
    expect(deltaE(a, c)).toBeGreaterThan(50);
  });

  it('maps tolerance to max delta', () => {
    expect(toleranceToDelta(0)).toBe(0);
    expect(toleranceToDelta(100)).toBe(120);
    expect(toleranceToDelta(50)).toBe(60);
  });
});
