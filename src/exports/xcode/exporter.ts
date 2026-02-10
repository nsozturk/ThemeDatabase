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

/** User-selectable font configuration for Xcode themes. */
export interface XcodeFontConfig {
  fontFamily: string;   // e.g. "SFMono-Regular", "Menlo-Regular"
  boldFamily: string;   // e.g. "SFMono-Bold", "Menlo-Bold"
  fontSize: number;     // e.g. 13
}

export const DEFAULT_FONT_CONFIG: XcodeFontConfig = {
  fontFamily: 'SFMono-Regular',
  boldFamily: 'SFMono-Bold',
  fontSize: 13,
};

export interface XcodeExportInput {
  filenameBase: string; // without extension
  mode: 'exact' | 'fallback';
  format: XcodeFormat;
  fontConfig?: XcodeFontConfig;
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

/**
 * Build a font plist string like "SFMono-Regular - 13.0".
 */
function fontEntry(family: string, size: number): PlistPrimitive {
  return { kind: 'string', value: `${family} - ${size.toFixed(1)}` };
}

/**
 * All Xcode syntax font keys that should be present in DVTSourceTextSyntaxFonts.
 * Each corresponds to a color key in DVTSourceTextSyntaxColors.
 */
const SYNTAX_FONT_KEYS = [
  'xcode.syntax.plain',
  'xcode.syntax.comment',
  'xcode.syntax.comment.doc',
  'xcode.syntax.comment.doc.keyword',
  'xcode.syntax.string',
  'xcode.syntax.keyword',
  'xcode.syntax.number',
  'xcode.syntax.attribute',
  'xcode.syntax.character',
  'xcode.syntax.preprocessor',
  'xcode.syntax.url',
  'xcode.syntax.mark',
  'xcode.syntax.regex',
  'xcode.syntax.regex.keyword',
  'xcode.syntax.regex.capture.variable',
  'xcode.syntax.regex.character.class',
  'xcode.syntax.regex.number',
  'xcode.syntax.regex.constant',
  'xcode.syntax.identifier.function',
  'xcode.syntax.identifier.function.system',
  'xcode.syntax.identifier.variable',
  'xcode.syntax.identifier.variable.system',
  'xcode.syntax.identifier.type',
  'xcode.syntax.identifier.type.system',
  'xcode.syntax.identifier.class',
  'xcode.syntax.identifier.class.system',
  'xcode.syntax.identifier.constant',
  'xcode.syntax.identifier.constant.system',
  'xcode.syntax.identifier.macro',
  'xcode.syntax.identifier.macro.system',
  'xcode.syntax.declaration.type',
  'xcode.syntax.declaration.other',
];

export async function buildXcodeArtifact(
  input: XcodeExportInput,
  planned: PlannedCatalog,
): Promise<BuiltArtifact> {
  const top: Record<string, PlistPrimitive> = {};
  const fc = input.fontConfig ?? DEFAULT_FONT_CONFIG;

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

  // ─── Font entries ──────────────────────────────────────────────
  // DVTSourceTextSyntaxFonts — one entry per syntax key
  const syntaxFonts = ensureDict('DVTSourceTextSyntaxFonts');
  for (const key of SYNTAX_FONT_KEYS) {
    // Keywords and markup-related items get bold variant in Xcode convention
    const isBold = key.includes('keyword') || key === 'xcode.syntax.mark';
    syntaxFonts[key] = fontEntry(isBold ? fc.boldFamily : fc.fontFamily, fc.fontSize);
  }

  // Console fonts
  top.DVTConsoleTextFont = fontEntry(fc.fontFamily, fc.fontSize);

  // Markup fonts (documentation rendering)
  top.DVTMarkupTextCodeFont = fontEntry(fc.fontFamily, fc.fontSize);
  top.DVTMarkupTextEmphasisFont = fontEntry(fc.fontFamily, fc.fontSize);
  top.DVTMarkupTextStrongFont = fontEntry(fc.boldFamily, fc.fontSize);
  top.DVTMarkupTextNormalFont = fontEntry(fc.fontFamily, fc.fontSize);
  top.DVTMarkupTextPrimaryHeadingFont = fontEntry(fc.boldFamily, fc.fontSize + 6);
  top.DVTMarkupTextSecondaryHeadingFont = fontEntry(fc.boldFamily, fc.fontSize + 3);
  top.DVTMarkupTextOtherHeadingFont = fontEntry(fc.boldFamily, fc.fontSize + 1);
  top.DVTMarkupTextLinkFont = fontEntry(fc.fontFamily, fc.fontSize);

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

