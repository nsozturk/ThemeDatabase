import { describe, expect, it } from 'vitest';
import { buildExportSource } from '@/lib/exportSource';
import { buildStrictExportPlan } from '@/exports/plan';
import { VIM_FIELDS } from '@/exports/vim/catalog';
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
  tokenPalette: [
    { role: 'comment', hex: '#6a9955', category: 'green' },
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

describe('buildStrictExportPlan', () => {
  it('only includes fields that can be resolved from source', () => {
    const source = buildExportSource(theme, payload, detail, {});
    const planned = buildStrictExportPlan('vim-colorscheme', source, VIM_FIELDS, {}, {});
    const keys = planned.plan.included.map((f) => f.key);
    expect(keys).toContain('Normal.bg');
    expect(keys).toContain('Normal.fg');
    expect(keys).toContain('Comment.fg');

    // selection background not present => strict excludes Visual.bg
    expect(keys).not.toContain('Visual.bg');
    expect(planned.plan.excluded.some((x) => x.key === 'Visual.bg')).toBe(true);
  });
});

