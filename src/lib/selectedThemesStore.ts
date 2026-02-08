const STORAGE_KEY = 'tdb.selectedThemeIds';
export const MAX_SELECTED = 10;

type Listener = () => void;

const listeners = new Set<Listener>();
let cachedRaw: string | null = null;
let cachedIds: string[] = [];

function emit() {
  for (const cb of listeners) cb();
}

function parseIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  } catch {
    return [];
  }
}

function readRawString(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeRaw(ids: string[]) {
  try {
    const raw = JSON.stringify(ids);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedIds = ids;
  } catch {
    // Storage can be unavailable in some browsing modes; fail silently.
  }
}

export function getSelectedIds(): string[] {
  const raw = readRawString();
  if (raw === cachedRaw) return cachedIds;

  cachedRaw = raw;
  cachedIds = raw ? parseIds(raw) : [];
  return cachedIds;
}

export function subscribeSelectedIds(cb: Listener): () => void {
  listeners.add(cb);

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) emit();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function clearSelectedThemes(): void {
  cachedRaw = '[]';
  cachedIds = [];
  writeRaw([]);
  emit();
}

export function removeSelectedTheme(id: string): void {
  const ids = getSelectedIds().slice();
  const next = ids.filter((x) => x !== id);
  if (next.length === ids.length) return;
  writeRaw(next);
  emit();
}

export function toggleSelectedTheme(id: string): { ok: boolean; reason?: 'limit' | 'not-found' } {
  const safeId = id.trim();
  if (!safeId) return { ok: false, reason: 'not-found' };

  const ids = getSelectedIds().slice();
  const exists = ids.includes(safeId);
  if (exists) {
    writeRaw(ids.filter((x) => x !== safeId));
    emit();
    return { ok: true };
  }

  if (ids.length >= MAX_SELECTED) {
    return { ok: false, reason: 'limit' };
  }

  writeRaw([...ids, safeId]);
  emit();
  return { ok: true };
}
