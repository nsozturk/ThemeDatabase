import { describe, expect, it } from 'vitest';
import { buildVimArtifact } from '@/exports/vim/exporter';
import { buildStrictExportPlan } from '@/exports/plan';
import { VIM_FIELDS } from '@/exports/vim/catalog';
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

describe('vim exporter', () => {
  it('builds a vim colorscheme file', async () => {
    const src = buildExportSource(theme, payload, detail, {});
    const planned = buildStrictExportPlan('vim-colorscheme', src, VIM_FIELDS, {}, {});
    const artifact = await buildVimArtifact({ filenameBase: 'darcula', mode: 'fallback' }, planned);
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(artifact.blob);
    });
    expect(text).toContain('let g:colors_name');
    expect(text).toContain('hi Normal');
    expect(artifact.filename).toMatch(/\.vim$/);
  });
});
