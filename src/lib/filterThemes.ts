import type { ThemeFilters, ThemeIndexRecord } from '@/types/theme';
import { recordMatchesColor } from '@/lib/color';

function bySort(a: ThemeIndexRecord, b: ThemeIndexRecord, sort: ThemeFilters['sort']): number {
  switch (sort) {
    case 'publisher':
      return a.publisher.localeCompare(b.publisher);
    case 'background':
      return a.bg.localeCompare(b.bg);
    case 'name':
    default:
      return a.themeDisplayName.localeCompare(b.themeDisplayName);
  }
}

export function applyThemeFilters(records: ThemeIndexRecord[], filters: ThemeFilters): ThemeIndexRecord[] {
  const q = filters.q.trim().toLowerCase();

  const filtered = records.filter((record) => {
    if (q) {
      const text = `${record.themeDisplayName} ${record.extensionName} ${record.publisher} ${record.description}`.toLowerCase();
      if (!text.includes(q)) {
        return false;
      }
    }

    if (filters.bg !== 'all' && record.bgCategory !== filters.bg) {
      return false;
    }

    if (!recordMatchesColor(record, filters.hex, filters.token, filters.tolerance)) {
      return false;
    }

    return true;
  });

  return filtered.slice().sort((a, b) => bySort(a, b, filters.sort));
}
