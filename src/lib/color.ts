import type { SyntaxSummary, ThemeIndexRecord } from '@/types/theme';

export function normalizeHex(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith('#')) {
    return '';
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{8}$/.test(trimmed)) {
    return `#${trimmed.slice(1, 7).toLowerCase()}`;
  }

  return '';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safe = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(safe.slice(0, 2), 16),
    g: Number.parseInt(safe.slice(2, 4), 16),
    b: Number.parseInt(safe.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = ((bn - rn) / delta) + 2;
    } else {
      h = ((rn - gn) / delta) + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs((2 * l) - 1));
  return { h, s, l };
}

function pivotRgb(v: number): number {
  const c = v / 255;
  return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
}

function pivotXyz(v: number): number {
  return v > 0.008856 ? v ** (1 / 3) : (7.787 * v) + (16 / 116);
}

export function hexToLab(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex);
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
  const b2 = 200 * (fy - fz);
  return [l, a, b2];
}

export function deltaE(a: [number, number, number], b: [number, number, number]): number {
  const dl = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt((dl * dl) + (da * da) + (db * db));
}

export function toleranceToDelta(tolerance: number): number {
  const clamped = Math.max(0, Math.min(100, tolerance));
  return ((clamped / 100) ** 1.25) * 65;
}

export function syntaxColorForRole(summary: SyntaxSummary, role: string): string | null {
  if (role === 'any') {
    const entry = Object.values(summary).find(Boolean);
    return entry?.hex ?? null;
  }
  return summary[role as keyof SyntaxSummary]?.hex ?? null;
}

function hueDistance(a: number, b: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, 360 - raw);
}

function canPassSaturationGuard(targetHex: string, candidateHex: string, tolerance: number): boolean {
  const clamped = Math.max(0, Math.min(100, tolerance));
  const targetRgb = hexToRgb(targetHex);
  const candidateRgb = hexToRgb(candidateHex);
  const target = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b);
  const candidate = rgbToHsl(candidateRgb.r, candidateRgb.g, candidateRgb.b);

  // Avoid gray-ish matches when user selected a vivid color.
  if (target.s >= 0.28 && candidate.s <= 0.16) {
    return false;
  }

  // Keep hue reasonably aligned for saturated colors.
  if (target.s >= 0.28 && candidate.s >= 0.2) {
    const maxHueDrift = 10 + (clamped / 100) * 58;
    if (hueDistance(target.h, candidate.h) > maxHueDrift) {
      return false;
    }
  }

  return true;
}

function candidateHexesForRole(record: ThemeIndexRecord, role: string): string[] {
  if (role === 'background') {
    return [record.bg];
  }

  if (role === 'any') {
    const syntax = Object.values(record.syntaxSummary)
      .map((entry) => entry?.hex)
      .filter((hex): hex is string => Boolean(hex));
    return [...syntax, record.bg];
  }

  const syntaxHex = syntaxColorForRole(record.syntaxSummary, role);
  return syntaxHex ? [syntaxHex] : [];
}

export function recordMatchesColor(
  record: ThemeIndexRecord,
  targetHex: string,
  role: string,
  tolerance: number,
): boolean {
  const normalizedTarget = normalizeHex(targetHex);
  if (!normalizedTarget) {
    return true;
  }

  const targetLab = hexToLab(normalizedTarget);
  const maxDistance = toleranceToDelta(tolerance);
  const checks = candidateHexesForRole(record, role);

  if (checks.length === 0) {
    return false;
  }

  return checks.some((hex) => {
    const normalized = normalizeHex(hex);
    if (!normalized) {
      return false;
    }
    if (!canPassSaturationGuard(normalizedTarget, normalized, tolerance)) {
      return false;
    }
    return deltaE(targetLab, hexToLab(normalized)) <= maxDistance;
  });
}
