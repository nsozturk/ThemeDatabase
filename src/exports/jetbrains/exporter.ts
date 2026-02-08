import JSZip from 'jszip';
import type { BuiltArtifact } from '@/types/export';
import type { PlannedCatalog } from '@/exports/plan';
import { parseCssColor, rgbaToHexNoHash } from '@/lib/resolveColor';

export interface JetBrainsExportInput {
  filenameBase: string; // slug base
  displayName: string; // scheme name
  version: string;
  mode: 'exact' | 'fallback';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'theme';
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function colorHexNoHash(raw: string | undefined): string | null {
  if (!raw) return null;
  const parsed = parseCssColor(raw);
  if (!parsed) return null;
  if (parsed.a < 0.999) return null;
  return rgbaToHexNoHash(parsed);
}

function buildIclsXml(input: JetBrainsExportInput, planned: PlannedCatalog): string {
  const byKey = new Map(planned.plan.included.map((f) => [f.key, f.value] as const));
  const get = (key: string): string | null => colorHexNoHash(byKey.get(key));

  const textBg = get('TEXT.BACKGROUND');
  const textFg = get('TEXT.FOREGROUND');

  const attrs: Array<{ name: string; fg?: string | null; bg?: string | null }> = [
    { name: 'TEXT', fg: textFg, bg: textBg },
    { name: 'LINE_COMMENT', fg: get('LINE_COMMENT.FOREGROUND') },
    { name: 'BLOCK_COMMENT', fg: get('BLOCK_COMMENT.FOREGROUND') },
    { name: 'STRING', fg: get('STRING.FOREGROUND') },
    { name: 'NUMBER', fg: get('NUMBER.FOREGROUND') },
    { name: 'DEFAULT_KEYWORD', fg: get('KEYWORD.FOREGROUND') },
    { name: 'FUNCTION_DECLARATION', fg: get('FUNCTION_DECLARATION.FOREGROUND') },
    { name: 'LOCAL_VARIABLE', fg: get('LOCAL_VARIABLE.FOREGROUND') },
    { name: 'CLASS_NAME', fg: get('TYPE.FOREGROUND') },
    { name: 'OPERATION_SIGN', fg: get('OPERATION_SIGN.FOREGROUND') },
  ].filter((a) => a.fg || a.bg);

  const colors: Array<{ name: string; value: string | null }> = [
    { name: 'CARET_COLOR', value: get('CARET_COLOR') },
    { name: 'SELECTION_BACKGROUND', value: get('SELECTION_BACKGROUND') },
    { name: 'SELECTION_FOREGROUND', value: get('SELECTION_FOREGROUND') },
    { name: 'CARET_ROW_COLOR', value: get('CURRENT_LINE') },
    { name: 'INDENT_GUIDE', value: get('INDENT_GUIDE') },
    { name: 'INDENT_GUIDE_SELECTED', value: get('INDENT_GUIDE_ACTIVE') },
    { name: 'LINE_NUMBERS_COLOR', value: get('LINE_NUMBERS') },
    { name: 'LINE_NUMBERS_ACTIVE_COLOR', value: get('LINE_NUMBERS_ACTIVE') },
    { name: 'GUTTER_BACKGROUND', value: get('GUTTER_BACKGROUND') },
  ].filter((c) => c.value);

  const consoleColors: Array<{ name: string; value: string | null }> = [
    { name: 'CONSOLE_BACKGROUND_KEY', value: get('CONSOLE.BACKGROUND') },
    { name: 'CONSOLE_FOREGROUND_KEY', value: get('CONSOLE.FOREGROUND') },
    { name: 'CONSOLE_BLACK_OUTPUT', value: get('CONSOLE.ANSI_BLACK') },
    { name: 'CONSOLE_RED_OUTPUT', value: get('CONSOLE.ANSI_RED') },
    { name: 'CONSOLE_GREEN_OUTPUT', value: get('CONSOLE.ANSI_GREEN') },
    { name: 'CONSOLE_YELLOW_OUTPUT', value: get('CONSOLE.ANSI_YELLOW') },
    { name: 'CONSOLE_BLUE_OUTPUT', value: get('CONSOLE.ANSI_BLUE') },
    { name: 'CONSOLE_MAGENTA_OUTPUT', value: get('CONSOLE.ANSI_MAGENTA') },
    { name: 'CONSOLE_CYAN_OUTPUT', value: get('CONSOLE.ANSI_CYAN') },
    { name: 'CONSOLE_WHITE_OUTPUT', value: get('CONSOLE.ANSI_WHITE') },
    { name: 'CONSOLE_DARKGRAY_OUTPUT', value: get('CONSOLE.ANSI_BRIGHT_BLACK') },
    { name: 'CONSOLE_LIGHTRED_OUTPUT', value: get('CONSOLE.ANSI_BRIGHT_RED') },
    { name: 'CONSOLE_LIGHTGREEN_OUTPUT', value: get('CONSOLE.ANSI_BRIGHT_GREEN') },
    { name: 'CONSOLE_LIGHTYELLOW_OUTPUT', value: get('CONSOLE.ANSI_BRIGHT_YELLOW') },
    { name: 'CONSOLE_LIGHTBLUE_OUTPUT', value: get('CONSOLE.ANSI_BRIGHT_BLUE') },
    { name: 'CONSOLE_LIGHTMAGENTA_OUTPUT', value: get('CONSOLE.ANSI_BRIGHT_MAGENTA') },
    { name: 'CONSOLE_LIGHTCYAN_OUTPUT', value: get('CONSOLE.ANSI_BRIGHT_CYAN') },
    { name: 'CONSOLE_GRAY_OUTPUT', value: get('CONSOLE.ANSI_BRIGHT_WHITE') },
  ].filter((c) => c.value);

  const colorsXml = [...colors, ...consoleColors]
    .map((c) => `    <option name="${escapeXml(c.name)}" value="${escapeXml(c.value!)}" />`)
    .join('\n');

  const attrsXml = attrs.map((a) => {
    const entries: string[] = [];
    if (a.fg) entries.push(`          <option name="FOREGROUND" value="${escapeXml(a.fg)}" />`);
    if (a.bg) entries.push(`          <option name="BACKGROUND" value="${escapeXml(a.bg)}" />`);
    return (
      `    <option name="${escapeXml(a.name)}">\n` +
      `      <value>\n` +
      `${entries.join('\n')}\n` +
      `      </value>\n` +
      `    </option>`
    );
  }).join('\n');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<scheme name="${escapeXml(input.displayName)}" version="142" parent_scheme="Darcula">\n` +
    `  <colors>\n` +
    `${colorsXml}\n` +
    `  </colors>\n` +
    `  <attributes>\n` +
    `${attrsXml}\n` +
    `  </attributes>\n` +
    `</scheme>\n`
  );
}

function buildPluginXml(input: JetBrainsExportInput, pluginId: string, schemeFile: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<idea-plugin>\n` +
    `  <id>${escapeXml(pluginId)}</id>\n` +
    `  <name>${escapeXml(input.displayName)} Color Scheme</name>\n` +
    `  <vendor email="telepenu@gmail.com">ThemeDatabase</vendor>\n` +
    `  <version>${escapeXml(input.version)}</version>\n` +
    `  <depends>com.intellij.modules.lang</depends>\n` +
    `  <extensions defaultExtensionNs="com.intellij">\n` +
    `    <bundledColorScheme path="/colors/${escapeXml(schemeFile)}" />\n` +
    `  </extensions>\n` +
    `</idea-plugin>\n`
  );
}

export async function buildJetBrainsIclsArtifact(input: JetBrainsExportInput, planned: PlannedCatalog): Promise<BuiltArtifact> {
  const content = buildIclsXml(input, planned);
  const filename = `${slugify(input.filenameBase)}.icls`;
  return {
    target: planned.plan.target,
    filename,
    blob: new Blob([content], { type: 'application/xml' }),
    mode: input.mode,
  };
}

export async function buildJetBrainsPluginArtifact(input: JetBrainsExportInput, planned: PlannedCatalog): Promise<BuiltArtifact> {
  const base = slugify(input.filenameBase);
  const pluginId = `themedatabase.scheme.${base}`;
  const schemeFile = `${base}.icls`;

  const zip = new JSZip();
  zip.file('META-INF/plugin.xml', buildPluginXml(input, pluginId, schemeFile));
  zip.file(`colors/${schemeFile}`, buildIclsXml(input, planned));

  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    target: planned.plan.target,
    filename: `${base}-${input.version}.zip`,
    blob,
    mode: input.mode,
  };
}

