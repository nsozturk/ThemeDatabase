import { deltaE, hexToLab, normalizeHex, recordMatchesColor, toleranceToDelta } from '@/lib/color';
import type { ThemeIndexRecord } from '@/types/theme';

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
    expect(toleranceToDelta(100)).toBeCloseTo(65, 3);
    expect(toleranceToDelta(50)).toBeLessThan(30);
  });

  it('prevents gray matches for saturated target colors', () => {
    const record: ThemeIndexRecord = {
      id: 'gray-comment',
      extensionId: 'publisher.gray',
      extensionName: 'Gray Themes',
      publisher: 'Gray',
      themeInternalName: 'gray',
      themeDisplayName: 'Gray Theme',
      description: '',
      bg: '#1f1f1f',
      badge: '#4a88ff',
      bgCategory: 'dark',
      syntaxSummary: {
        comment: { hex: '#808080', category: 'gray' },
      },
      marketplaceUrl: 'https://example.com',
      themeUrl: 'https://example.com',
      labVectors: [0, 0, 0],
    };

    expect(recordMatchesColor(record, '#22c55e', 'comment', 70)).toBe(false);
  });

  it('uses strict role matching for token filters', () => {
    const record: ThemeIndexRecord = {
      id: 'bg-green-comment-gray',
      extensionId: 'publisher.strict',
      extensionName: 'Strict Themes',
      publisher: 'Strict',
      themeInternalName: 'strict',
      themeDisplayName: 'Strict Theme',
      description: '',
      bg: '#22c55e',
      badge: '#4a88ff',
      bgCategory: 'green',
      syntaxSummary: {
        comment: { hex: '#808080', category: 'gray' },
      },
      marketplaceUrl: 'https://example.com',
      themeUrl: 'https://example.com',
      labVectors: [0, 0, 0],
    };

    expect(recordMatchesColor(record, '#22c55e', 'comment', 40)).toBe(false);
    expect(recordMatchesColor(record, '#22c55e', 'background', 40)).toBe(true);
  });
});
