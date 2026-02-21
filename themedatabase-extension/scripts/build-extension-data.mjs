#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = path.resolve(ROOT, '..', 'public', 'data');
const OUT_ROOT = path.resolve(ROOT, 'data');

const CATALOG_SHARD_SIZE = 1000;
const FALLBACK_SHARD_SIZE = 1000;
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data));
}

function normalizeHex(input) {
  const value = String(input ?? '').trim();
  if (!value) return '';
  const raw = value.startsWith('#') ? value : `#${value}`;
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
    return raw.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{8}$/.test(raw)) {
    return `#${raw.slice(1, 7).toLowerCase()}`;
  }
  return '';
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const safe = normalized.slice(1);
  return {
    r: Number.parseInt(safe.slice(0, 2), 16),
    g: Number.parseInt(safe.slice(2, 4), 16),
    b: Number.parseInt(safe.slice(4, 6), 16),
  };
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = ((bn - rn) / delta) + 2;
    else h = ((rn - gn) / delta) + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs((2 * l) - 1));
  return { h, s, l };
}

function relativeLuminance(r, g, b) {
  const toLinear = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (0.2126 * toLinear(r)) + (0.7152 * toLinear(g)) + (0.0722 * toLinear(b));
}

function contrastRatio(a, b) {
  const l1 = relativeLuminance(a.r, a.g, a.b);
  const l2 = relativeLuminance(b.r, b.g, b.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function scoreToBand(score) {
  if (score < 34) return 'low';
  if (score < 67) return 'medium';
  return 'high';
}

function hueBucket(h, s) {
  if (s < 0.14) return 'neutral';
  if (h < 15 || h >= 345) return 'red';
  if (h < 45) return 'orange';
  if (h < 70) return 'yellow';
  if (h < 165) return 'green';
  if (h < 195) return 'cyan';
  if (h < 255) return 'blue';
  if (h < 290) return 'purple';
  return 'pink';
}

function circularSpreadDegrees(hues) {
  if (hues.length <= 1) return 0;
  const sums = hues.reduce(
    (acc, h) => {
      const rad = (h * Math.PI) / 180;
      return { sin: acc.sin + Math.sin(rad), cos: acc.cos + Math.cos(rad) };
    },
    { sin: 0, cos: 0 },
  );

  const n = hues.length;
  const r = Math.sqrt((sums.cos / n) ** 2 + (sums.sin / n) ** 2);
  return (1 - Math.max(0, Math.min(1, r))) * 180;
}

function averageHex(colors) {
  const rgbs = colors.map(hexToRgb).filter(Boolean);
  if (!rgbs.length) return '#20242b';
  const sums = rgbs.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 });
  const avg = {
    r: Math.round(sums.r / rgbs.length),
    g: Math.round(sums.g / rgbs.length),
    b: Math.round(sums.b / rgbs.length),
  };
  return `#${avg.r.toString(16).padStart(2, '0')}${avg.g.toString(16).padStart(2, '0')}${avg.b.toString(16).padStart(2, '0')}`;
}

function computeAppearance(record) {
  const bg = normalizeHex(record.bg) || '#20242b';
  const badge = normalizeHex(record.badge);
  const syntaxColors = Object.values(record.syntaxSummary || {})
    .map((entry) => normalizeHex(entry?.hex))
    .filter(Boolean);

  const weighted = [bg, bg, ...syntaxColors];
  if (badge) weighted.push(badge);

  const avgHex = averageHex(weighted);
  const avgRgb = hexToRgb(avgHex) || { r: 32, g: 36, b: 43 };
  const avgHsl = rgbToHsl(avgRgb.r, avgRgb.g, avgRgb.b);
  const bucket = hueBucket(avgHsl.h, avgHsl.s);

  const bgRgb = hexToRgb(bg) || { r: 32, g: 36, b: 43 };
  const contrasts = syntaxColors
    .map((hex) => hexToRgb(hex))
    .filter(Boolean)
    .map((rgb) => contrastRatio(bgRgb, rgb));

  const avgContrast = contrasts.length ? contrasts.reduce((sum, value) => sum + value, 0) / contrasts.length : 1;
  const contrastScore = Math.round(Math.max(0, Math.min(100, ((avgContrast - 1) / 20) * 100)));
  const saturationScore = Math.round(Math.max(0, Math.min(100, avgHsl.s * 100)));
  const brightnessScore = Math.round(Math.max(0, Math.min(100, avgHsl.l * 100)));

  const hues = syntaxColors
    .map((hex) => hexToRgb(hex))
    .filter(Boolean)
    .map((rgb) => rgbToHsl(rgb.r, rgb.g, rgb.b))
    .filter((hsl) => hsl.s >= 0.12)
    .map((hsl) => hsl.h);

  const spread = circularSpreadDegrees(hues);
  const tags = [];
  if (saturationScore <= 45 && brightnessScore >= 62) tags.push('pastel');
  if (saturationScore >= 62) tags.push('vivid');
  if (saturationScore >= 20 && saturationScore <= 55 && contrastScore >= 18 && contrastScore <= 72) tags.push('muted');
  if (saturationScore >= 70 && contrastScore >= 68) tags.push('neon');
  if (spread <= 14 || saturationScore <= 10) tags.push('monochrome');
  if ((bucket === 'orange' || bucket === 'yellow' || bucket === 'green') && saturationScore <= 60 && brightnessScore <= 65) {
    tags.push('earthy');
  }

  return {
    avgHex,
    hueBucket: bucket,
    styleTags: [...new Set(tags)],
    contrastBand: scoreToBand(contrastScore),
    saturationBand: scoreToBand(saturationScore),
    brightnessBand: scoreToBand(brightnessScore),
  };
}

function shardRecords(records, shardSize, filenamePrefix) {
  const shardCount = Math.ceil(records.length / shardSize);
  const shards = [];
  for (let i = 0; i < shardCount; i += 1) {
    const start = i * shardSize;
    const end = start + shardSize;
    const file = `${filenamePrefix}-${String(i).padStart(3, '0')}.json`;
    shards.push({
      file,
      items: records.slice(start, end),
    });
  }
  return shards;
}

function buildCatalogData(exactIdSet) {
  const indexManifest = readJson(path.resolve(SOURCE_ROOT, 'index', 'manifest.json'));
  const records = [];

  for (let i = 0; i < indexManifest.shardCount; i += 1) {
    const shardPath = path.resolve(SOURCE_ROOT, 'index', 'shards', `index-${String(i).padStart(3, '0')}.json`);
    const shard = readJson(shardPath);
    for (const record of shard) {
      const appearance = computeAppearance(record);
      records.push({
        id: record.id,
        extensionId: record.extensionId,
        extensionName: record.extensionName,
        publisher: record.publisher,
        themeDisplayName: record.themeDisplayName,
        description: record.description,
        bg: normalizeHex(record.bg) || '#20242b',
        badge: normalizeHex(record.badge),
        bgCategory: record.bgCategory || 'mixed',
        syntaxSummary: record.syntaxSummary || {},
        marketplaceUrl: record.marketplaceUrl,
        themeUrl: record.themeUrl,
        quality: exactIdSet.has(record.id) ? 'upgradable' : 'fallback',
        ...appearance,
      });
    }
  }

  return records;
}

function buildFallbackData() {
  const fallback = readJson(path.resolve(SOURCE_ROOT, 'vsix', 'fallback.json'));
  return fallback.map((item) => ({
    themeId: item.themeId,
    uiTheme: item.uiTheme,
    themeJson: item.themeJson,
  }));
}

function buildExactManifestData() {
  const manifest = readJson(path.resolve(SOURCE_ROOT, 'vsix', 'manifest.json'));
  return Object.keys(manifest.exactLookup || {});
}

function buildData() {
  cleanDir(OUT_ROOT);

  const exactIds = buildExactManifestData();
  const exactIdSet = new Set(exactIds);

  const catalogRecords = buildCatalogData(exactIdSet);
  const fallbackRecords = buildFallbackData();

  const catalogShards = shardRecords(catalogRecords, CATALOG_SHARD_SIZE, 'catalog');
  const fallbackShards = shardRecords(fallbackRecords, FALLBACK_SHARD_SIZE, 'fallback');

  const catalogDir = path.resolve(OUT_ROOT, 'catalog', 'shards');
  const fallbackDir = path.resolve(OUT_ROOT, 'payload', 'fallback', 'shards');
  const exactDir = path.resolve(OUT_ROOT, 'payload', 'exact');

  ensureDir(catalogDir);
  ensureDir(fallbackDir);
  ensureDir(exactDir);

  catalogShards.forEach((shard, shardIndex) => {
    writeJson(path.resolve(catalogDir, shard.file), shard.items);
  });

  writeJson(path.resolve(OUT_ROOT, 'catalog', 'manifest.json'), {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    totalRecords: catalogRecords.length,
    shardSize: CATALOG_SHARD_SIZE,
    shardCount: catalogShards.length,
    shards: catalogShards.map((shard) => shard.file),
  });

  fallbackShards.forEach((shard, shardIndex) => {
    writeJson(path.resolve(fallbackDir, shard.file), shard.items);
  });

  writeJson(path.resolve(OUT_ROOT, 'payload', 'fallback', 'manifest.json'), {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    totalRecords: fallbackRecords.length,
    shardSize: FALLBACK_SHARD_SIZE,
    shardCount: fallbackShards.length,
    shards: fallbackShards.map((shard) => shard.file),
  });

  writeJson(path.resolve(exactDir, 'manifest.json'), {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    count: exactIds.length,
    themeIds: exactIds,
  });

  const catalogSize = fs.statSync(path.resolve(OUT_ROOT, 'catalog', 'manifest.json')).size;
  const fallbackSize = fs.statSync(path.resolve(OUT_ROOT, 'payload', 'fallback', 'manifest.json')).size;
  const exactSize = fs.statSync(path.resolve(OUT_ROOT, 'payload', 'exact', 'manifest.json')).size;

  console.log(
    JSON.stringify(
      {
        catalogRecords: catalogRecords.length,
        fallbackRecords: fallbackRecords.length,
        exactKnownRecords: exactIds.length,
        catalogManifestBytes: catalogSize,
        fallbackManifestBytes: fallbackSize,
        exactManifestBytes: exactSize,
      },
      null,
      2,
    ),
  );
}

buildData();
