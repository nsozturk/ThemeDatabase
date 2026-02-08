import { describe, expect, it } from 'vitest';
import { buildExportSource } from '@/lib/exportSource';
import { resolveFromTokenRole, resolveFromVsCodeColorKeys } from '@/lib/resolveColor';
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
    },
    tokenColors: [],
  },
};

const detail: ThemeDetailRecord = {
  id: 't1',
  description: '',
  tokenPalette: [
    { role: 'comment', hex: '#6a9955', category: 'green' },
    { role: 'string', hex: '#ce9178', category: 'orange' },
  ],
  editorColors: {
    'editor.foreground': '#eeeeee',
  },
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

describe('resolveColor', () => {
  it('resolves from themeJson.colors first, then detail editorColors', () => {
    const source = buildExportSource(theme, payload, detail, {});
    const bg = resolveFromVsCodeColorKeys(source, ['editor.background']);
    expect(bg?.raw).toBe('#2b2d30');

    const fg = resolveFromVsCodeColorKeys(source, ['editor.foreground']);
    expect(fg?.raw).toBe('#eeeeee');
  });

  it('resolves token role from detail palette when tokenColors are missing', () => {
    const source = buildExportSource(theme, payload, detail, {});
    const comment = resolveFromTokenRole(source, 'comment');
    expect(comment?.raw).toBe('#6a9955');
  });
});

