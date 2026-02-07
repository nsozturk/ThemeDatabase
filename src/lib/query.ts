import type { ThemeFilters } from '@/types/theme';

export const defaultFilters: ThemeFilters = {
  q: '',
  bg: 'all',
  token: 'any',
  hex: '',
  tolerance: 28,
  sort: 'name',
  view: 'grid',
};

export function readFiltersFromSearch(params: URLSearchParams): ThemeFilters {
  return {
    q: params.get('q') ?? defaultFilters.q,
    bg: params.get('bg') ?? defaultFilters.bg,
    token: (params.get('token') as ThemeFilters['token']) ?? defaultFilters.token,
    hex: params.get('hex') ?? defaultFilters.hex,
    tolerance: Number.parseInt(params.get('tolerance') ?? `${defaultFilters.tolerance}`, 10) || defaultFilters.tolerance,
    sort: (params.get('sort') as ThemeFilters['sort']) ?? defaultFilters.sort,
    view: (params.get('view') as ThemeFilters['view']) ?? defaultFilters.view,
  };
}

export function writeFiltersToSearch(filters: ThemeFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.bg !== defaultFilters.bg) params.set('bg', filters.bg);
  if (filters.token !== defaultFilters.token) params.set('token', filters.token);
  if (filters.hex) params.set('hex', filters.hex);
  if (filters.tolerance !== defaultFilters.tolerance) params.set('tolerance', `${filters.tolerance}`);
  if (filters.sort !== defaultFilters.sort) params.set('sort', filters.sort);
  if (filters.view !== defaultFilters.view) params.set('view', filters.view);

  return params;
}
