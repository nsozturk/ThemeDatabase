import { defaultFilters, readFiltersFromSearch, writeFiltersToSearch } from '@/lib/query';

describe('query filters', () => {
  it('writes and reads filter params', () => {
    const params = writeFiltersToSearch({
      ...defaultFilters,
      q: 'darcula',
      bg: 'dark',
      token: 'keyword',
      hex: '#cc7832',
      tolerance: 40,
      sort: 'publisher',
      view: 'list',
    });

    const parsed = readFiltersFromSearch(params);
    expect(parsed.q).toBe('darcula');
    expect(parsed.bg).toBe('dark');
    expect(parsed.token).toBe('keyword');
    expect(parsed.hex).toBe('#cc7832');
    expect(parsed.tolerance).toBe(40);
    expect(parsed.sort).toBe('publisher');
    expect(parsed.view).toBe('list');
  });
});
