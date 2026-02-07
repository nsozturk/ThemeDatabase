import path from 'node:path';
import fs from 'node:fs';
import { buildThemeIndex } from './build-theme-index.ts';
import { buildThemeDetails } from './build-theme-details.ts';
import { buildVsixPayloads } from './build-vsix-payloads.ts';
import { parseArgs, paths, writeJson } from './shared.ts';

function annotateDetailsWithVsixExact(): void {
  const manifestPath = path.resolve(paths.publicDataDir, 'vsix/manifest.json');
  const detailsManifestPath = path.resolve(paths.publicDataDir, 'details/manifest.json');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(detailsManifestPath)) {
    return;
  }

  const vsixManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
    exactLookup: Record<string, { shard: number; offset: number }>;
  };
  const detailManifest = JSON.parse(fs.readFileSync(detailsManifestPath, 'utf8')) as { shards: string[] };

  const exactThemeIds = new Set(Object.keys(vsixManifest.exactLookup));
  for (const shardName of detailManifest.shards) {
    const shardPath = path.resolve(paths.publicDataDir, 'details/shards', shardName);
    const shard = JSON.parse(fs.readFileSync(shardPath, 'utf8')) as Array<{
      id: string;
      sourceInfo: { exactAvailable: boolean; exactSource: 'extracted' | 'fallback' };
    }>;

    for (const item of shard) {
      const hasExact = exactThemeIds.has(item.id);
      item.sourceInfo.exactAvailable = hasExact;
      item.sourceInfo.exactSource = hasExact ? 'extracted' : 'fallback';
    }

    fs.writeFileSync(shardPath, JSON.stringify(shard));
  }
}

function main(): void {
  const { limit, shardSize } = parseArgs(process.argv.slice(2));

  const index = buildThemeIndex(limit, shardSize);
  const details = buildThemeDetails(shardSize);
  const vsix = buildVsixPayloads(5000, shardSize);
  annotateDetailsWithVsixExact();

  writeJson(path.resolve(paths.publicDataDir, 'meta/build-info.json'), {
    generatedAt: new Date().toISOString(),
    options: {
      limit: limit ?? null,
      shardSize: shardSize ?? null,
    },
    index,
    details,
    vsix,
  });

  console.log('Data build completed.');
}

main();
