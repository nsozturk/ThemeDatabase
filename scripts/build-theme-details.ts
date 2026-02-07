import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_SHARD_SIZE,
  ThemeIndexRecord,
  chunkArray,
  parseArgs,
  paths,
  writeJson,
} from './shared.ts';

interface ThemeDetailRecord {
  id: string;
  description: string;
  tokenPalette: Array<{ role: string; hex: string; category: string }>;
  editorColors: Record<string, string>;
  similarThemeIds: string[];
  license: string | null;
  sourceInfo: {
    extensionId: string;
    extensionName: string;
    publisher: string;
    marketplaceUrl: string;
    themeUrl: string;
    exactAvailable: boolean;
    exactSource: 'extracted' | 'fallback';
  };
}

function loadIndexRecords(): ThemeIndexRecord[] {
  const indexManifest = JSON.parse(
    fs.readFileSync(path.resolve(paths.publicDataDir, 'index/manifest.json'), 'utf8'),
  ) as { shards: string[] };

  const records: ThemeIndexRecord[] = [];
  for (const shardName of indexManifest.shards) {
    const shard = JSON.parse(
      fs.readFileSync(path.resolve(paths.publicDataDir, 'index/shards', shardName), 'utf8'),
    ) as ThemeIndexRecord[];
    records.push(...shard);
  }

  return records;
}

export function buildThemeDetails(shardSize = DEFAULT_SHARD_SIZE): { count: number; shardCount: number } {
  const records = loadIndexRecords();
  const byCategory = new Map<string, string[]>();

  for (const rec of records) {
    const list = byCategory.get(rec.bgCategory) ?? [];
    list.push(rec.id);
    byCategory.set(rec.bgCategory, list);
  }

  const details: ThemeDetailRecord[] = records.map((rec) => {
    const tokenPalette = Object.entries(rec.syntaxSummary).map(([role, entry]) => ({
      role,
      hex: entry?.hex ?? '#c9d1d9',
      category: entry?.category ?? 'unknown',
    }));

    const similarPool = (byCategory.get(rec.bgCategory) ?? []).filter((id) => id !== rec.id);

    return {
      id: rec.id,
      description: rec.description,
      tokenPalette,
      editorColors: {
        'editor.background': rec.bg,
        'activityBarBadge.background': rec.badge,
      },
      similarThemeIds: similarPool.slice(0, 8),
      license: null,
      sourceInfo: {
        extensionId: rec.extensionId,
        extensionName: rec.extensionName,
        publisher: rec.publisher,
        marketplaceUrl: rec.marketplaceUrl,
        themeUrl: rec.themeUrl,
        exactAvailable: false,
        exactSource: 'fallback',
      },
    };
  });

  const shards = chunkArray(details, shardSize);
  const outputDir = path.resolve(paths.publicDataDir, 'details');
  const shardDir = path.resolve(outputDir, 'shards');

  fs.rmSync(outputDir, { force: true, recursive: true });
  fs.mkdirSync(shardDir, { recursive: true });

  const themeIdToShard: Record<string, { shard: number; offset: number }> = {};

  shards.forEach((shard, shardIndex) => {
    const shardName = `detail-${String(shardIndex).padStart(3, '0')}.json`;
    shard.forEach((item, offset) => {
      themeIdToShard[item.id] = { shard: shardIndex, offset };
    });
    writeJson(path.resolve(shardDir, shardName), shard);
  });

  writeJson(path.resolve(outputDir, 'manifest.json'), {
    generatedAt: new Date().toISOString(),
    shardSize,
    totalRecords: details.length,
    shardCount: shards.length,
    shards: shards.map((_, idx) => `detail-${String(idx).padStart(3, '0')}.json`),
    themeIdToShard,
  });

  return { count: details.length, shardCount: shards.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { shardSize } = parseArgs(process.argv.slice(2));
  const result = buildThemeDetails(shardSize ?? DEFAULT_SHARD_SIZE);
  console.log(`Theme details generated: ${result.count} records in ${result.shardCount} shards.`);
}
