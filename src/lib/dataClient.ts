import type {
  ThemeDetailManifest,
  ThemeDetailRecord,
  ThemeIndexManifest,
  ThemeIndexRecord,
} from '@/types/theme';

const indexManifestUrl = 'data/index/manifest.json';
const detailsManifestUrl = 'data/details/manifest.json';

let indexManifestPromise: Promise<ThemeIndexManifest> | null = null;
let detailsManifestPromise: Promise<ThemeDetailManifest> | null = null;
const indexShardCache = new Map<number, Promise<ThemeIndexRecord[]>>();
const detailShardCache = new Map<number, Promise<ThemeDetailRecord[]>>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return (await response.json()) as T;
}

export function getIndexManifest(): Promise<ThemeIndexManifest> {
  if (!indexManifestPromise) {
    indexManifestPromise = fetchJson<ThemeIndexManifest>(indexManifestUrl);
  }
  return indexManifestPromise;
}

export function getDetailsManifest(): Promise<ThemeDetailManifest> {
  if (!detailsManifestPromise) {
    detailsManifestPromise = fetchJson<ThemeDetailManifest>(detailsManifestUrl);
  }
  return detailsManifestPromise;
}

export function getIndexShard(shard: number): Promise<ThemeIndexRecord[]> {
  const cached = indexShardCache.get(shard);
  if (cached) {
    return cached;
  }

  const req = fetchJson<ThemeIndexRecord[]>(`data/index/shards/index-${String(shard).padStart(3, '0')}.json`);
  indexShardCache.set(shard, req);
  return req;
}

export function getDetailShard(shard: number): Promise<ThemeDetailRecord[]> {
  const cached = detailShardCache.get(shard);
  if (cached) {
    return cached;
  }

  const req = fetchJson<ThemeDetailRecord[]>(`data/details/shards/detail-${String(shard).padStart(3, '0')}.json`);
  detailShardCache.set(shard, req);
  return req;
}

export async function loadAllIndexRecords(
  onProgress?: (loaded: number, total: number) => void,
): Promise<ThemeIndexRecord[]> {
  const manifest = await getIndexManifest();
  const all: ThemeIndexRecord[] = [];

  for (let i = 0; i < manifest.shardCount; i += 1) {
    const shard = await getIndexShard(i);
    all.push(...shard);
    onProgress?.(i + 1, manifest.shardCount);
  }

  return all;
}

export async function getThemeIndexRecordById(id: string): Promise<ThemeIndexRecord | null> {
  const manifest = await getIndexManifest();
  const location = manifest.themeIdToShard[id];
  if (!location) {
    return null;
  }

  const shard = await getIndexShard(location.shard);
  return shard[location.offset] ?? null;
}

export async function getThemeDetailRecordById(id: string): Promise<ThemeDetailRecord | null> {
  const manifest = await getDetailsManifest();
  const location = manifest.themeIdToShard[id];
  if (!location) {
    return null;
  }

  const shard = await getDetailShard(location.shard);
  return shard[location.offset] ?? null;
}
