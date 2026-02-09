import type { BuiltArtifact } from '@/types/export';
import type { PlannedCatalog } from '@/exports/plan';
import { parseCssColor, rgbaToXcodeFloatString } from '@/lib/resolveColor';

type XcodeFormat = 'dvt' | 'xc';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export interface XcodeExportInput {
  filenameBase: string; // without extension
  mode: 'exact' | 'fallback';
  format: XcodeFormat;
}

type PlistPrimitive =
  | { kind: 'string'; value: string }
  | { kind: 'integer'; value: number }
  | { kind: 'real'; value: number }
  | { kind: 'dict'; value: Record<string, PlistPrimitive> };

function plistValueXml(v: PlistPrimitive, indent: string): string {
  if (v.kind === 'string') return `${indent}<string>${escapeXml(v.value)}</string>`;
  if (v.kind === 'integer') return `${indent}<integer>${v.value}</integer>`;
  if (v.kind === 'real') return `${indent}<real>${v.value}</real>`;
  const keys = Object.keys(v.value).sort((a, b) => a.localeCompare(b));
  const inner = keys.map((k) => {
    return `${indent}  <key>${escapeXml(k)}</key>\n${plistValueXml(v.value[k]!, indent + '  ')}`;
  }).join('\n');
  return `${indent}<dict>\n${inner}\n${indent}</dict>`;
}

function dictXml(dict: Record<string, PlistPrimitive>, indent = ''): string {
  const keys = Object.keys(dict).sort((a, b) => a.localeCompare(b));
  const body = keys.map((k) => {
    return `${indent}<key>${escapeXml(k)}</key>\n${plistValueXml(dict[k]!, indent)}`;
  }).join('\n');
  return `${indent}<dict>\n${body}\n${indent}</dict>`;
}

export async function buildXcodeArtifact(
  input: XcodeExportInput,
  planned: PlannedCatalog,
): Promise<BuiltArtifact> {
  const top: Record<string, PlistPrimitive> = {};

  // `.xccolortheme` files usually contain a minimal header for versioning/format.
  if (input.format === 'xc') {
    top.DVTFontAndColorVersion = { kind: 'integer', value: 1 };
    // Match the common default seen in reference themes.
    top.DVTLineSpacing = { kind: 'real', value: 1.100000023841858 };
  }

  const ensureDict = (key: string): Record<string, PlistPrimitive> => {
    const existing = top[key];
    if (existing?.kind === 'dict') return existing.value;
    const next: Record<string, PlistPrimitive> = {};
    top[key] = { kind: 'dict', value: next };
    return next;
  };

  for (const item of planned.plan.included) {
    const parsed = parseCssColor(item.value);
    if (!parsed) continue;
    const floatString = rgbaToXcodeFloatString(parsed);

    const [a, b] = item.key.split('/', 2);
    if (a && b) {
      const dict = ensureDict(a);
      dict[b] = { kind: 'string', value: floatString };
      continue;
    }

    // Top-level simple entry.
    if (item.key) {
      top[item.key] = { kind: 'string', value: floatString };
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n` +
    `<plist version="1.0">\n` +
    `${dictXml(top)}\n` +
    `</plist>\n`;

  const ext = input.format === 'xc' ? '.xccolortheme' : '.dvtcolortheme';

  return {
    target: planned.plan.target,
    filename: `${input.filenameBase}${ext}`,
    blob: new Blob([xml], { type: 'application/xml' }),
    mode: input.mode,
  };
}

