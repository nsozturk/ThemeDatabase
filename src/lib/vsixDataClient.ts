import type { VsixManifest, VsixPayloadRecord } from '@/types/theme';

let manifestPromise: Promise<VsixManifest> | null = null;
let fallbackPromise: Promise<VsixPayloadRecord[]> | null = null;
const exactCache = new Map<number, Promise<VsixPayloadRecord[]>>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return (await response.json()) as T;
}

export function getVsixManifest(): Promise<VsixManifest> {
  if (!manifestPromise) {
    manifestPromise = fetchJson<VsixManifest>('data/vsix/manifest.json');
  }
  return manifestPromise;
}

function getExactShard(shard: number): Promise<VsixPayloadRecord[]> {
  const cached = exactCache.get(shard);
  if (cached) {
    return cached;
  }

  const req = fetchJson<VsixPayloadRecord[]>(`data/vsix/exact-shards/exact-${String(shard).padStart(3, '0')}.json`);
  exactCache.set(shard, req);
  return req;
}

function getFallback(): Promise<VsixPayloadRecord[]> {
  if (!fallbackPromise) {
    fallbackPromise = fetchJson<VsixPayloadRecord[]>('data/vsix/fallback.json');
  }
  return fallbackPromise;
}

export async function getVsixPayloadByThemeId(themeId: string): Promise<VsixPayloadRecord | null> {
  const manifest = await getVsixManifest();
  const exact = manifest.exactLookup[themeId];

  if (exact) {
    const shard = await getExactShard(exact.shard);
    return shard[exact.offset] ?? null;
  }

  const fallback = await getFallback();
  return fallback.find((item) => item.themeId === themeId) ?? null;
}
