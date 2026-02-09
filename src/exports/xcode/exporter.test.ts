import { describe, expect, it } from 'vitest';
import { buildXcodeArtifact } from '@/exports/xcode/exporter';
import { buildStrictExportPlan } from '@/exports/plan';
import { XCODE_FIELDS } from '@/exports/xcode/catalog';
import { buildExportSource } from '@/lib/exportSource';
import type { ThemeDetailRecord, ThemeIndexRecord, VsixPayloadRecord } from '@/types/theme';

const theme: ThemeIndexRecord = {
  id: 't1',
  extensionId: 'pub.ext',
  extensionName: 'Ext',
  publisher: 'pub',
  themeInternalName: 'darcula',
  themeDisplayName: 'Darcula',
  description: '',
  bg: '#2b2d30',
  badge: '#4a88ff',
  bgCategory: 'dark',
  syntaxSummary: {},
  marketplaceUrl: 'https://example.com',
  themeUrl: 'https://example.com',
  labVectors: [0, 0, 0],
};

const payload: VsixPayloadRecord = {
  themeId: 't1',
  mode: 'fallback',
  uiTheme: 'vs-dark',
  themeJson: {
    name: 'Darcula',
    type: 'dark',
    colors: {
      'editor.background': '#2b2d30',
      'editor.foreground': '#eeeeee',
      'editorCursor.foreground': '#ffffff',
    },
    tokenColors: [],
  },
};

const detail: ThemeDetailRecord = {
  id: 't1',
  description: '',
  tokenPalette: [{ role: 'comment', hex: '#6a9955', category: 'green' }],
  editorColors: {},
  similarThemeIds: [],
  license: null,
  sourceInfo: {
    extensionId: theme.extensionId,
    extensionName: theme.extensionName,
    publisher: theme.publisher,
    marketplaceUrl: theme.marketplaceUrl,
    themeUrl: theme.themeUrl,
    exactAvailable: false,
    exactSource: 'fallback',
  },
};

describe('xcode exporter', () => {
  it('builds a dvtcolortheme plist', async () => {
    const src = buildExportSource(theme, payload, detail, {});
    const planned = buildStrictExportPlan('xcode-dvtcolortheme', src, XCODE_FIELDS, {}, {});
    const artifact = await buildXcodeArtifact({ filenameBase: 'darcula', mode: 'fallback', format: 'dvt' }, planned);
    expect(artifact.filename).toMatch(/\.dvtcolortheme$/);
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(artifact.blob);
    });
    expect(text).toContain('<plist');
    expect(text).toContain('DVTSourceTextBackground');
    expect(text).toContain('DVTSourceTextSyntaxColors');
    expect(text).toContain('xcode.syntax.comment');
  });

  it('builds an xccolortheme plist with header fields', async () => {
    const src = buildExportSource(theme, payload, detail, {});
    const planned = buildStrictExportPlan('xcode-xccolortheme', src, XCODE_FIELDS, {}, {});
    const artifact = await buildXcodeArtifact({ filenameBase: 'darcula', mode: 'fallback', format: 'xc' }, planned);
    expect(artifact.filename).toMatch(/\.xccolortheme$/);
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(artifact.blob);
    });
    expect(text).toContain('DVTFontAndColorVersion');
    expect(text).toContain('DVTSourceTextSyntaxColors');
  });
});
