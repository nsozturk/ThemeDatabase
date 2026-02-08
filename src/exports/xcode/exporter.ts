import type { BuiltArtifact } from '@/types/export';
import type { PlannedCatalog } from '@/exports/plan';
import { parseCssColor, rgbaToXcodeFloatString } from '@/lib/resolveColor';

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
}

export async function buildXcodeArtifact(
  input: XcodeExportInput,
  planned: PlannedCatalog,
): Promise<BuiltArtifact> {
  const dictEntries: Array<{ key: string; value: string }> = [];

  for (const item of planned.plan.included) {
    const rgba = parseCssColor(item.value) ?? parseCssColor(planned.groups.Editor?.find((f) => f.key === item.key)?.raw);
    const parsed = rgba ?? parseCssColor(item.value);
    if (!parsed) continue;
    dictEntries.push({ key: item.key, value: rgbaToXcodeFloatString(parsed) });
  }

  // Ensure deterministic order for diffs.
  dictEntries.sort((a, b) => a.key.localeCompare(b.key));

  const body = dictEntries.map(({ key, value }) => {
    return `  <key>${escapeXml(key)}</key>\n  <string>${escapeXml(value)}</string>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n` +
    `<plist version="1.0">\n<dict>\n${body}\n</dict>\n</plist>\n`;

  return {
    target: planned.plan.target,
    filename: `${input.filenameBase}.dvtcolortheme`,
    blob: new Blob([xml], { type: 'application/xml' }),
    mode: input.mode,
  };
}

