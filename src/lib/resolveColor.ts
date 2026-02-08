import type { SyntaxRole } from '@/types/theme';
import type { ExportSource } from '@/lib/exportSource';
import { ROLE_SCOPES } from '@/lib/scopeMaps';

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ResolvedColor {
  rgba: RgbaColor;
  raw: string;
  source: string;
}

function clampByte(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(255, Math.round(v)));
}

function clampAlpha(v: number): number {
  if (!Number.isFinite(v)) return 1;
  return Math.max(0, Math.min(1, v));
}

function isHexChar(v: string): boolean {
  return /^[0-9a-fA-F]+$/.test(v);
}

function parseHexColor(input: string): RgbaColor | null {
  const raw = input.trim();
  if (!raw.startsWith('#')) return null;
  const hex = raw.slice(1);

  if (hex.length === 3 && isHexChar(hex)) {
    const rch = hex.charAt(0);
    const gch = hex.charAt(1);
    const bch = hex.charAt(2);
    const r = Number.parseInt(rch + rch, 16);
    const g = Number.parseInt(gch + gch, 16);
    const b = Number.parseInt(bch + bch, 16);
    return { r, g, b, a: 1 };
  }

  if (hex.length === 6 && isHexChar(hex)) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }

  if (hex.length === 8 && isHexChar(hex)) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    const a = Number.parseInt(hex.slice(6, 8), 16) / 255;
    return { r, g, b, a: clampAlpha(a) };
  }

  return null;
}

function parseRgbFunc(input: string): RgbaColor | null {
  const raw = input.trim();
  const m = raw.match(/^rgba?\((.+)\)$/i);
  if (!m) return null;
  const body = m[1];
  if (!body) return null;
  const parts = body.split(',').map((p) => p.trim());
  if (parts.length < 3 || parts.length > 4) return null;

  const r = Number(parts[0] ?? '0');
  const g = Number(parts[1] ?? '0');
  const b = Number(parts[2] ?? '0');
  const a = parts.length === 4 ? Number(parts[3] ?? '1') : 1;

  return {
    r: clampByte(r),
    g: clampByte(g),
    b: clampByte(b),
    a: clampAlpha(a),
  };
}

export function parseCssColor(input: unknown): RgbaColor | null {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;
  if (raw.toLowerCase() === 'transparent') return null;
  return parseHexColor(raw) ?? parseRgbFunc(raw);
}

export function rgbaToHexNoHash(rgb: RgbaColor): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `${toHex(clampByte(rgb.r))}${toHex(clampByte(rgb.g))}${toHex(clampByte(rgb.b))}`.toLowerCase();
}

export function rgbaToHexHash(rgb: RgbaColor): string {
  return `#${rgbaToHexNoHash(rgb)}`;
}

export function rgbaToXcodeFloatString(rgba: RgbaColor): string {
  const f = (v: number) => (v / 255).toFixed(6);
  const a = clampAlpha(rgba.a);
  // Keep alpha readable but stable for diffs.
  const alpha = a === 1 ? '1' : a.toFixed(6);
  return `${f(rgba.r)} ${f(rgba.g)} ${f(rgba.b)} ${alpha}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function resolveFromVsCodeColorKeys(
  source: ExportSource,
  keys: string[],
): ResolvedColor | null {
  const themeJson = asRecord(source.payload.themeJson);
  const colors = asRecord(themeJson?.colors) as Record<string, unknown> | null;

  for (const key of keys) {
    const raw = colors?.[key] ?? source.detail?.editorColors?.[key];
    const parsed = parseCssColor(raw);
    if (parsed) {
      return { rgba: parsed, raw: String(raw), source: `vscode.colors.${key}` };
    }
  }

  return null;
}

type TokenColorEntry = {
  scope?: string | string[];
  settings?: { foreground?: unknown };
};

function normalizeScopes(scope: unknown): string[] {
  if (Array.isArray(scope)) return scope.filter((s): s is string => typeof s === 'string');
  if (typeof scope === 'string') return scope.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function scopeMatchesRole(scopes: string[], role: SyntaxRole): boolean {
  const needles = ROLE_SCOPES[role] ?? [];
  return scopes.some((s) => needles.some((needle) => s === needle || s.startsWith(`${needle}.`)));
}

export function resolveFromTokenRole(
  source: ExportSource,
  role: SyntaxRole,
): ResolvedColor | null {
  const themeJson = asRecord(source.payload.themeJson);
  const tokenColors = themeJson?.tokenColors;

  if (Array.isArray(tokenColors) && tokenColors.length) {
    const counts = new Map<string, { count: number; color: RgbaColor; raw: string; source: string }>();

    for (const entry of tokenColors as unknown[]) {
      const e = entry as TokenColorEntry;
      const scopes = normalizeScopes(e.scope);
      if (!scopes.length) continue;
      if (!scopeMatchesRole(scopes, role)) continue;

      const raw = e.settings?.foreground;
      const parsed = parseCssColor(raw);
      if (!parsed) continue;

      const key = rgbaToHexHash(parsed) + `@${parsed.a.toFixed(4)}`;
      const prev = counts.get(key);
      if (prev) {
        prev.count += 1;
      } else {
        counts.set(key, {
          count: 1,
          color: parsed,
          raw: String(raw),
          source: `vscode.tokenColors(${role})`,
        });
      }
    }

    let best: { count: number; color: RgbaColor; raw: string; source: string } | null = null;
    for (const item of counts.values()) {
      if (!best || item.count > best.count) {
        best = item;
      }
    }

    if (best) {
      return { rgba: best.color, raw: best.raw, source: best.source };
    }
  }

  const fallback = source.detail?.tokenPalette?.find((item) => item.role.toLowerCase() === role);
  if (fallback) {
    const parsed = parseCssColor(fallback.hex);
    if (parsed) {
      return { rgba: parsed, raw: fallback.hex, source: `detail.tokenPalette.${role}` };
    }
  }

  return null;
}
