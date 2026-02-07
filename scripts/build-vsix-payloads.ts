import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_SHARD_SIZE,
  ThemeIndexRecord,
  chunkArray,
  normalizeText,
  parseArgs,
  paths,
  writeJson,
} from './shared.ts';

interface ExactCandidate {
  filePath: string;
  uiTheme: string;
}

interface VsixPayloadRecord {
  themeId: string;
  mode: 'exact' | 'fallback';
  uiTheme: string;
  themeJson: Record<string, unknown>;
}

function loadIndexRecords(): ThemeIndexRecord[] {
  const manifestPath = path.resolve(paths.publicDataDir, 'index/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { shards: string[] };

  const records: ThemeIndexRecord[] = [];
  for (const shardName of manifest.shards) {
    const shard = JSON.parse(
      fs.readFileSync(path.resolve(paths.publicDataDir, 'index/shards', shardName), 'utf8'),
    ) as ThemeIndexRecord[];
    records.push(...shard);
  }

  return records;
}

function toUiTheme(value: unknown): string {
  const type = typeof value === 'string' ? value.toLowerCase() : 'dark';
  if (type.includes('light')) {
    return 'vs';
  }
  if (type.includes('hc')) {
    return 'hc-black';
  }
  return 'vs-dark';
}

function safeJsonRead(filePath: string): Record<string, unknown> | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildExtensionThemeCandidates(): Map<string, Map<string, ExactCandidate>> {
  const map = new Map<string, Map<string, ExactCandidate>>();

  if (!fs.existsSync(paths.extractedThemesDir)) {
    return map;
  }

  for (const entry of fs.readdirSync(paths.extractedThemesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const extensionDir = path.resolve(paths.extractedThemesDir, entry.name);
    const metadataFile = path.resolve(extensionDir, 'metadata.json');
    if (!fs.existsSync(metadataFile)) {
      continue;
    }

    let metadata: {
      extension_id?: string;
      themes?: Array<{ label?: string; uiTheme?: string; path?: string }>;
    };

    try {
      metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8')) as {
        extension_id?: string;
        themes?: Array<{ label?: string; uiTheme?: string; path?: string }>;
      };
    } catch {
      continue;
    }

    const extensionId = metadata.extension_id;
    if (!extensionId) {
      continue;
    }

    const candidateMap = map.get(extensionId) ?? new Map<string, ExactCandidate>();

    for (const contributed of metadata.themes ?? []) {
      if (!contributed.path) {
        continue;
      }
      const filePath = path.resolve(extensionDir, contributed.path);
      const normPathStem = normalizeText(path.basename(contributed.path, '.json'));
      if (normPathStem && fs.existsSync(filePath)) {
        candidateMap.set(normPathStem, { filePath, uiTheme: toUiTheme(contributed.uiTheme) });
      }
      if (contributed.label) {
        const normLabel = normalizeText(contributed.label);
        if (normLabel && fs.existsSync(filePath)) {
          candidateMap.set(normLabel, { filePath, uiTheme: toUiTheme(contributed.uiTheme) });
        }
      }
    }

    const themesDir = path.resolve(extensionDir, 'themes');
    if (fs.existsSync(themesDir)) {
      for (const f of fs.readdirSync(themesDir)) {
        if (!f.endsWith('.json')) {
          continue;
        }
        const filePath = path.resolve(themesDir, f);
        const normName = normalizeText(path.basename(f, '.json'));
        if (normName) {
          candidateMap.set(normName, { filePath, uiTheme: 'vs-dark' });
        }
      }
    }

    map.set(extensionId, candidateMap);
  }

  return map;
}

function buildFallbackThemeJson(record: ThemeIndexRecord): Record<string, unknown> {
  const tokenColors = Object.entries(record.syntaxSummary).map(([role, value]) => ({
    name: role,
    scope: role,
    settings: { foreground: value?.hex ?? '#c9d1d9' },
  }));

  return {
    name: record.themeDisplayName,
    type: record.bgCategory === 'light' ? 'light' : 'dark',
    colors: {
      'editor.background': record.bg,
      'editor.foreground': '#dfe1e5',
      'activityBarBadge.background': record.badge,
      'activityBarBadge.foreground': '#ffffff',
      'editor.selectionBackground': '#3b4252',
      'editorCursor.foreground': '#4a88ff',
    },
    tokenColors,
  };
}

export function buildVsixPayloads(
  exactCap = 5000,
  shardSize = DEFAULT_SHARD_SIZE,
): { exactCount: number; fallbackCount: number; shardCount: number } {
  const records = loadIndexRecords();
  const extensionCandidates = buildExtensionThemeCandidates();

  const exactPayloads: VsixPayloadRecord[] = [];
  const fallbackPayloads: VsixPayloadRecord[] = [];

  for (const record of records) {
    const fallbackPayload: VsixPayloadRecord = {
      themeId: record.id,
      mode: 'fallback',
      uiTheme: record.bgCategory === 'light' ? 'vs' : 'vs-dark',
      themeJson: buildFallbackThemeJson(record),
    };

    fallbackPayloads.push(fallbackPayload);

    if (exactPayloads.length >= exactCap) {
      continue;
    }

    const extensionMap = extensionCandidates.get(record.extensionId);
    if (!extensionMap) {
      continue;
    }

    const normInternal = normalizeText(record.themeInternalName);
    const normDisplay = normalizeText(record.themeDisplayName);

    const candidate = extensionMap.get(normInternal) ?? extensionMap.get(normDisplay);

    if (!candidate) {
      continue;
    }

    const themeJson = safeJsonRead(candidate.filePath);
    if (!themeJson) {
      continue;
    }

    exactPayloads.push({
      themeId: record.id,
      mode: 'exact',
      uiTheme: candidate.uiTheme,
      themeJson,
    });
  }

  const exactShards = chunkArray(exactPayloads, shardSize);
  const outputDir = path.resolve(paths.publicDataDir, 'vsix');
  const exactShardDir = path.resolve(outputDir, 'exact-shards');

  fs.rmSync(outputDir, { force: true, recursive: true });
  fs.mkdirSync(exactShardDir, { recursive: true });

  const exactLookup: Record<string, { shard: number; offset: number }> = {};

  exactShards.forEach((shard, shardIndex) => {
    const shardName = `exact-${String(shardIndex).padStart(3, '0')}.json`;
    shard.forEach((item, offset) => {
      exactLookup[item.themeId] = { shard: shardIndex, offset };
    });
    writeJson(path.resolve(exactShardDir, shardName), shard);
  });

  writeJson(path.resolve(outputDir, 'fallback.json'), fallbackPayloads);

  writeJson(path.resolve(outputDir, 'manifest.json'), {
    generatedAt: new Date().toISOString(),
    exactCap,
    exactCount: exactPayloads.length,
    fallbackCount: fallbackPayloads.length,
    exactShardSize: shardSize,
    exactShardCount: exactShards.length,
    exactShards: exactShards.map((_, idx) => `exact-${String(idx).padStart(3, '0')}.json`),
    exactLookup,
  });

  return {
    exactCount: exactPayloads.length,
    fallbackCount: fallbackPayloads.length,
    shardCount: exactShards.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { limit, shardSize } = parseArgs(process.argv.slice(2));
  const exactCap = limit ?? 5000;
  const result = buildVsixPayloads(exactCap, shardSize ?? DEFAULT_SHARD_SIZE);
  console.log(
    `VSIX payload generated: exact=${result.exactCount}, fallback=${result.fallbackCount}, exactShards=${result.shardCount}`,
  );
}
