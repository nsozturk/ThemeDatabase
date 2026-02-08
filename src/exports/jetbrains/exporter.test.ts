import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { buildJetBrainsIclsArtifact, buildJetBrainsPluginArtifact } from '@/exports/jetbrains/exporter';
import { buildStrictExportPlan } from '@/exports/plan';
import { JETBRAINS_FIELDS } from '@/exports/jetbrains/catalog';
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
  syntaxSummary: { keyword: { hex: '#cc7832', category: 'orange' } },
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
  tokenPalette: [
    { role: 'comment', hex: '#6a9955', category: 'green' },
    { role: 'keyword', hex: '#cc7832', category: 'orange' },
  ],
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

describe('jetbrains exporter', () => {
  it('builds a .icls scheme', async () => {
    const src = buildExportSource(theme, payload, detail, {});
    const planned = buildStrictExportPlan('jetbrains-icls', src, JETBRAINS_FIELDS, {}, {});
    const artifact = await buildJetBrainsIclsArtifact({ filenameBase: 'darcula', displayName: 'Darcula', version: '1.0.0', mode: 'fallback' }, planned);
    expect(artifact.filename).toMatch(/\.icls$/);
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(artifact.blob);
    });
    expect(text).toContain('<scheme');
    expect(text).toContain('TEXT');
  });

  it('builds a plugin zip with plugin.xml and colors scheme', async () => {
    const src = buildExportSource(theme, payload, detail, {});
    const planned = buildStrictExportPlan('jetbrains-plugin', src, JETBRAINS_FIELDS, {}, {});
    const artifact = await buildJetBrainsPluginArtifact({ filenameBase: 'darcula', displayName: 'Darcula', version: '1.0.0', mode: 'fallback' }, planned);
    expect(artifact.filename).toMatch(/\.zip$/);
    const zip = await JSZip.loadAsync(artifact.blob);
    expect(zip.file('META-INF/plugin.xml')).toBeTruthy();
    expect(zip.file('colors/darcula.icls')).toBeTruthy();
  });
});
