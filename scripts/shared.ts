import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

export interface ThemeCsvRow {
  page: string;
  extension_id: string;
  extension_name: string;
  extension_display_name: string;
  publisher_name: string;
  publisher_display_name: string;
  theme_internal_name: string;
  theme_display_name: string;
  short_description: string;
  editor_background: string;
  activity_bar_badge_background: string;
  theme_url: string;
  preview_svg_url: string;
  marketplace_url: string;
  total_themes_in_extension: string;
}

export interface SyntaxSummaryItem {
  hex: string;
  category: string;
}

export type SyntaxSummary = Partial<Record<'comment' | 'string' | 'keyword' | 'function' | 'variable' | 'number' | 'type' | 'operator', SyntaxSummaryItem>>;

export interface ThemeIndexRecord {
  id: string;
  extensionId: string;
  extensionName: string;
  publisher: string;
  themeInternalName: string;
  themeDisplayName: string;
  description: string;
  bg: string;
  badge: string;
  bgCategory: string;
  syntaxSummary: SyntaxSummary;
  previewSvg?: string;
  previewPng?: string;
  marketplaceUrl: string;
  themeUrl: string;
  labVectors: [number, number, number];
}

const workspaceRoot = path.resolve(process.cwd(), '..');

export const paths = {
  workspaceRoot,
  csvPath: path.resolve(workspaceRoot, 'themes_enhanced.csv'),
  docsThemesJson: path.resolve(workspaceRoot, 'docs/themes.json'),
  extractedThemesDir: path.resolve(workspaceRoot, 'extracted_themes'),
  previewSvgDir: path.resolve(workspaceRoot, 'theme_previews_svg'),
  previewPngDir: path.resolve(workspaceRoot, 'theme_previews_png'),
  publicDir: path.resolve(process.cwd(), 'public'),
  publicDataDir: path.resolve(process.cwd(), 'public/data'),
};

export const DEFAULT_SHARD_SIZE = 500;

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readCsvRows(csvPath = paths.csvPath): ThemeCsvRow[] {
  const csvRaw = fs.readFileSync(csvPath, 'utf8');
  return parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ThemeCsvRow[];
}

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/color\s*theme/g, '')
    .replace(/\btheme\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function hashDjb2(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash &= 0xffffffff;
  }
  return (hash >>> 0).toString(16);
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function makeThemeId(extensionId: string, themeInternalName: string, themeDisplayName: string): string {
  const base = `${extensionId}::${themeInternalName}`;
  const slug = slugify(themeDisplayName || themeInternalName || extensionId) || 'theme';
  return `${slug}-${hashDjb2(base)}`;
}

export function parseHexColor(input: string): string {
  if (!input || typeof input !== 'string') {
    return '#2b2d30';
  }

  const hex = input.trim();
  if (!hex.startsWith('#')) {
    return '#2b2d30';
  }

  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{8}$/.test(hex)) {
    return `#${hex.slice(1, 7).toLowerCase()}`;
  }

  return '#2b2d30';
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safe = parseHexColor(hex).slice(1);
  return {
    r: Number.parseInt(safe.slice(0, 2), 16),
    g: Number.parseInt(safe.slice(2, 4), 16),
    b: Number.parseInt(safe.slice(4, 6), 16),
  };
}

function pivotRgb(v: number): number {
  const c = v / 255;
  return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
}

function pivotXyz(v: number): number {
  return v > 0.008856 ? v ** (1 / 3) : (7.787 * v) + (16 / 116);
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const rl = pivotRgb(r);
  const gl = pivotRgb(g);
  const bl = pivotRgb(b);

  const x = ((rl * 0.4124) + (gl * 0.3576) + (bl * 0.1805)) / 0.95047;
  const y = ((rl * 0.2126) + (gl * 0.7152) + (bl * 0.0722)) / 1.0;
  const z = ((rl * 0.0193) + (gl * 0.1192) + (bl * 0.9505)) / 1.08883;

  const fx = pivotXyz(x);
  const fy = pivotXyz(y);
  const fz = pivotXyz(z);

  const l = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);
  return [Number(l.toFixed(4)), Number(a.toFixed(4)), Number(bb.toFixed(4))];
}

export function hexToLab(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex);
  return rgbToLab(r, g, b);
}

export function colorCategory(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  if (brightness < 55) return 'dark';
  if (brightness > 210) return 'light';

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation < 0.15) return 'gray';

  if (r > g && r > b) return g > b ? 'orange' : 'red';
  if (g > r && g > b) return b > r ? 'cyan' : 'green';
  if (b > r && b > g) return r > g ? 'purple' : 'blue';
  return 'mixed';
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data));
}

export function loadSyntaxFromDocsThemes(): Map<string, SyntaxSummary> {
  const map = new Map<string, SyntaxSummary>();
  if (!fs.existsSync(paths.docsThemesJson)) {
    return map;
  }

  const raw = JSON.parse(fs.readFileSync(paths.docsThemesJson, 'utf8')) as {
    themes?: Array<{ ext_id?: string; theme?: string; syntax?: SyntaxSummary }>;
  };

  for (const item of raw.themes ?? []) {
    if (!item.ext_id || !item.theme || !item.syntax) {
      continue;
    }
    map.set(`${item.ext_id}::${normalizeText(item.theme)}`, item.syntax);
  }

  return map;
}

export function parseArgs(argv: string[]): { limit?: number; shardSize?: number } {
  const out: { limit?: number; shardSize?: number } = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--limit') {
      const value = Number.parseInt(argv[i + 1] ?? '', 10);
      if (!Number.isNaN(value) && value > 0) {
        out.limit = value;
      }
      i += 1;
    }
    if (arg === '--shard-size') {
      const value = Number.parseInt(argv[i + 1] ?? '', 10);
      if (!Number.isNaN(value) && value > 0) {
        out.shardSize = value;
      }
      i += 1;
    }
  }
  return out;
}
