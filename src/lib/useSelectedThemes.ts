import { useMemo, useSyncExternalStore } from 'react';
import {
  MAX_SELECTED,
  clearSelectedThemes,
  getSelectedIds,
  removeSelectedTheme,
  subscribeSelectedIds,
  toggleSelectedTheme,
} from '@/lib/selectedThemesStore';

export function useSelectedThemes() {
  const selectedIds = useSyncExternalStore(subscribeSelectedIds, getSelectedIds, () => []);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const canSelectMore = selectedIds.length < MAX_SELECTED;

  return {
    selectedIds,
    selectedSet,
    maxSelected: MAX_SELECTED,
    canSelectMore,
    toggle: toggleSelectedTheme,
    remove: removeSelectedTheme,
    clear: clearSelectedThemes,
  };
}

