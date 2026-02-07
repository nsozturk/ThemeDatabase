import { applyThemeFilters } from '@/lib/filterThemes';
import type { ThemeFilters, ThemeIndexRecord } from '@/types/theme';

const baseFilters: ThemeFilters = {
  q: '',
  bg: 'all',
  token: 'any',
  hex: '',
  tolerance: 28,
  sort: 'name',
  view: 'grid',
};

const sample: ThemeIndexRecord[] = [
  {
    id: 'a',
    extensionId: 'publisher.a',
    extensionName: 'A Theme Pack',
    publisher: 'Alpha',
    themeInternalName: 'darcula-pro',
    themeDisplayName: 'Darcula Pro',
    description: 'Dark coding theme',
    bg: '#2b2d30',
    badge: '#4a88ff',
    bgCategory: 'dark',
    syntaxSummary: {
      keyword: { hex: '#cc7832', category: 'orange' },
      string: { hex: '#6a8759', category: 'green' },
    },
    previewSvg: 'previews/a.svg',
    marketplaceUrl: 'https://example.com',
    themeUrl: 'https://example.com',
    labVectors: [0, 0, 0],
  },
  {
    id: 'b',
    extensionId: 'publisher.b',
    extensionName: 'B Theme Pack',
    publisher: 'Beta',
    themeInternalName: 'light',
    themeDisplayName: 'Light Fresh',
    description: 'Light coding theme',
    bg: '#f5f5f5',
    badge: '#7a7a7a',
    bgCategory: 'light',
    syntaxSummary: {
      keyword: { hex: '#005cc5', category: 'blue' },
    },
    previewSvg: 'previews/b.svg',
    marketplaceUrl: 'https://example.com',
    themeUrl: 'https://example.com',
    labVectors: [0, 0, 0],
  },
];

describe('applyThemeFilters', () => {
  it('filters by query', () => {
    const result = applyThemeFilters(sample, { ...baseFilters, q: 'darcula' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('a');
  });

  it('filters by background category', () => {
    const result = applyThemeFilters(sample, { ...baseFilters, bg: 'light' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('b');
  });

  it('filters by token color similarity', () => {
    const result = applyThemeFilters(sample, {
      ...baseFilters,
      token: 'keyword',
      hex: '#cc7832',
      tolerance: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('a');
  });
});
