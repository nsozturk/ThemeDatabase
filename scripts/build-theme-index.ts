import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_SHARD_SIZE,
  ThemeIndexRecord,
  chunkArray,
  colorCategory,
  hexToLab,
  loadSyntaxFromDocsThemes,
  makeThemeId,
  normalizeText,
  parseArgs,
  parseHexColor,
  paths,
  readCsvRows,
  writeJson,
} from './shared.ts';

export interface BuildThemeIndexResult {
  count: number;
  shardCount: number;
}

export function buildThemeIndex(limit?: number, shardSize = DEFAULT_SHARD_SIZE): BuildThemeIndexResult {
  const rows = readCsvRows();
  const syntaxMap = loadSyntaxFromDocsThemes();

  const selectedRows = typeof limit === 'number' ? rows.slice(0, limit) : rows;

  const records: ThemeIndexRecord[] = selectedRows.map((row) => {
    const id = makeThemeId(row.extension_id, row.theme_internal_name, row.theme_display_name);
    const bg = parseHexColor(row.editor_background);
    const normalizedInternal = normalizeText(row.theme_internal_name);
    const normalizedDisplay = normalizeText(row.theme_display_name);

    const syntaxSummary =
      syntaxMap.get(`${row.extension_id}::${normalizedInternal}`)
      ?? syntaxMap.get(`${row.extension_id}::${normalizedDisplay}`)
      ?? {};

    const svgSrc = path.resolve(paths.previewSvgDir, row.extension_id, `${row.theme_internal_name}.svg`);
    const pngSrc = path.resolve(paths.previewPngDir, row.extension_id, `${row.theme_internal_name}.svg.png`);

    const previewSvg = fs.existsSync(svgSrc) ? `previews/${row.extension_id}/${row.theme_internal_name}.svg` : undefined;
    const previewPng = fs.existsSync(pngSrc) ? `previews_png/${row.extension_id}/${row.theme_internal_name}.svg.png` : undefined;

    return {
      id,
      extensionId: row.extension_id,
      extensionName: row.extension_display_name || row.extension_name,
      publisher: row.publisher_display_name || row.publisher_name,
      themeInternalName: row.theme_internal_name,
      themeDisplayName: row.theme_display_name,
      description: row.short_description ?? '',
      bg,
      badge: parseHexColor(row.activity_bar_badge_background || '#4a88ff'),
      bgCategory: colorCategory(bg),
      syntaxSummary,
      previewSvg,
      previewPng,
      marketplaceUrl: row.marketplace_url,
      themeUrl: row.theme_url,
      labVectors: hexToLab(bg),
    };
  });

  const shards = chunkArray(records, shardSize);
  const outputDir = path.resolve(paths.publicDataDir, 'index');
  const shardDir = path.resolve(outputDir, 'shards');

  fs.rmSync(outputDir, { force: true, recursive: true });
  fs.mkdirSync(shardDir, { recursive: true });

  const themeIdToShard: Record<string, { shard: number; offset: number }> = {};

  shards.forEach((shard, shardIndex) => {
    const shardName = `index-${String(shardIndex).padStart(3, '0')}.json`;
    shard.forEach((item, offset) => {
      themeIdToShard[item.id] = { shard: shardIndex, offset };
    });
    writeJson(path.resolve(shardDir, shardName), shard);
  });

  writeJson(path.resolve(outputDir, 'manifest.json'), {
    generatedAt: new Date().toISOString(),
    sourceCsv: path.relative(process.cwd(), paths.csvPath),
    shardSize,
    totalRecords: records.length,
    shardCount: shards.length,
    shards: shards.map((_, idx) => `index-${String(idx).padStart(3, '0')}.json`),
    themeIdToShard,
  });

  return { count: records.length, shardCount: shards.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { limit, shardSize } = parseArgs(process.argv.slice(2));
  const result = buildThemeIndex(limit, shardSize ?? DEFAULT_SHARD_SIZE);
  console.log(`Theme index generated: ${result.count} records in ${result.shardCount} shards.`);
}
