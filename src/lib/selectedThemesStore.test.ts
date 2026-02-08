import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_SELECTED,
  clearSelectedThemes,
  getSelectedIds,
  removeSelectedTheme,
  toggleSelectedTheme,
} from '@/lib/selectedThemesStore';

describe('selectedThemesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSelectedThemes();
  });

  it('toggles add/remove and preserves selection order', () => {
    expect(getSelectedIds()).toEqual([]);
    toggleSelectedTheme('a');
    toggleSelectedTheme('b');
    toggleSelectedTheme('c');
    expect(getSelectedIds()).toEqual(['a', 'b', 'c']);

    toggleSelectedTheme('b');
    expect(getSelectedIds()).toEqual(['a', 'c']);

    toggleSelectedTheme('b');
    expect(getSelectedIds()).toEqual(['a', 'c', 'b']);
  });

  it('enforces max selection limit', () => {
    for (let i = 0; i < MAX_SELECTED; i += 1) {
      const res = toggleSelectedTheme(`t${i}`);
      expect(res.ok).toBe(true);
    }

    const denied = toggleSelectedTheme('overflow');
    expect(denied.ok).toBe(false);
    expect(denied.reason).toBe('limit');
  });

  it('removes selected theme id', () => {
    toggleSelectedTheme('a');
    toggleSelectedTheme('b');
    removeSelectedTheme('a');
    expect(getSelectedIds()).toEqual(['b']);
  });
});

