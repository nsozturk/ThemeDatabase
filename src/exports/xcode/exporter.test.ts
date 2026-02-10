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
      'editor.selectionBackground': '#214283',
      'editor.lineHighlightBackground': '#313335',
      'editorWhitespace.foreground': '#505050',
      'terminal.foreground': '#cccccc',
      'terminal.background': '#1e1e1e',
      'terminalCursor.foreground': '#ffffff',
      'terminal.selectionBackground': '#264f78',
      'debugConsole.infoForeground': '#b5cea8',
      'debugIcon.breakpointForeground': '#e51400',
      'editorOverviewRuler.modifiedForeground': '#1b81a8',
      'editorOverviewRuler.errorForeground': '#f44747',
      'editorOverviewRuler.warningForeground': '#cca700',
      'editorOverviewRuler.findMatchForeground': '#f0f0f0',
      'editorError.foreground': '#f44747',
      'editorWarning.foreground': '#cca700',
    },
    tokenColors: [
      { scope: 'comment', settings: { foreground: '#6a9955' } },
      { scope: 'string', settings: { foreground: '#ce9178' } },
      { scope: 'keyword', settings: { foreground: '#569cd6' } },
      { scope: 'entity.name.function', settings: { foreground: '#dcdcaa' } },
      { scope: 'variable', settings: { foreground: '#9cdcfe' } },
      { scope: 'constant.numeric', settings: { foreground: '#b5cea8' } },
      { scope: 'entity.name.type', settings: { foreground: '#4ec9b0' } },
      { scope: 'keyword.operator', settings: { foreground: '#d4d4d4' } },
      { scope: 'entity.other.attribute-name', settings: { foreground: '#9cdcfe' } },
      { scope: 'constant.character.escape', settings: { foreground: '#d7ba7d' } },
      { scope: 'meta.preprocessor', settings: { foreground: '#c586c0' } },
      { scope: 'string.regexp', settings: { foreground: '#d16969' } },
      { scope: 'support.class', settings: { foreground: '#4ec9b0' } },
      { scope: 'constant.language', settings: { foreground: '#569cd6' } },
      { scope: 'markup.underline.link', settings: { foreground: '#3794ff' } },
    ],
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

async function blobToText(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe('xcode exporter', () => {
  it('builds a dvtcolortheme plist', async () => {
    const src = buildExportSource(theme, payload, detail, {});
    const planned = buildStrictExportPlan('xcode-dvtcolortheme', src, XCODE_FIELDS, {}, {});
    const artifact = await buildXcodeArtifact({ filenameBase: 'darcula', mode: 'fallback', format: 'dvt' }, planned);
    expect(artifact.filename).toMatch(/\.dvtcolortheme$/);
    const text = await blobToText(artifact.blob);
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
    const text = await blobToText(artifact.blob);
    expect(text).toContain('DVTFontAndColorVersion');
    expect(text).toContain('DVTSourceTextSyntaxColors');
  });

  it('includes all new syntax, console, scrollbar, and markup fields', async () => {
    const src = buildExportSource(theme, payload, detail, {});
    const planned = buildStrictExportPlan('xcode-dvtcolortheme', src, XCODE_FIELDS, {}, {});
    const artifact = await buildXcodeArtifact({ filenameBase: 'darcula', mode: 'fallback', format: 'dvt' }, planned);
    const text = await blobToText(artifact.blob);

    // New syntax fields
    expect(text).toContain('xcode.syntax.attribute');
    expect(text).toContain('xcode.syntax.character');
    expect(text).toContain('xcode.syntax.preprocessor');
    expect(text).toContain('xcode.syntax.url');
    expect(text).toContain('xcode.syntax.mark');
    expect(text).toContain('xcode.syntax.identifier.class');
    expect(text).toContain('xcode.syntax.identifier.class.system');
    expect(text).toContain('xcode.syntax.identifier.constant');
    expect(text).toContain('xcode.syntax.identifier.constant.system');
    expect(text).toContain('xcode.syntax.identifier.macro');
    expect(text).toContain('xcode.syntax.identifier.macro.system');
    expect(text).toContain('xcode.syntax.declaration.type');
    expect(text).toContain('xcode.syntax.declaration.other');
    expect(text).toContain('xcode.syntax.regex');

    // Console fields
    expect(text).toContain('DVTConsoleTextColor');
    expect(text).toContain('DVTConsoleTextBackgroundColor');
    expect(text).toContain('DVTConsoleTextInsertionPointColor');
    expect(text).toContain('DVTDebugConsoleTextColor');

    // Scrollbar fields
    expect(text).toContain('DVTScrollbarMarkerBreakpointColor');
    expect(text).toContain('DVTScrollbarMarkerErrorColor');
    expect(text).toContain('DVTScrollbarMarkerWarningColor');

    // Markup fields
    expect(text).toContain('DVTMarkupTextNormalColor');
    expect(text).toContain('DVTMarkupTextPrimaryHeadingColor');
    expect(text).toContain('DVTMarkupTextCodeColor');
    expect(text).toContain('DVTMarkupTextLinkColor');
  });

  it('generates font entries in plist', async () => {
    const src = buildExportSource(theme, payload, detail, {});
    const planned = buildStrictExportPlan('xcode-dvtcolortheme', src, XCODE_FIELDS, {}, {});
    const artifact = await buildXcodeArtifact({
      filenameBase: 'darcula',
      mode: 'fallback',
      format: 'dvt',
      fontConfig: { fontFamily: 'Menlo-Regular', boldFamily: 'Menlo-Bold', fontSize: 14 },
    }, planned);
    const text = await blobToText(artifact.blob);

    // DVTSourceTextSyntaxFonts dict should exist with font entries
    expect(text).toContain('DVTSourceTextSyntaxFonts');
    expect(text).toContain('Menlo-Regular - 14.0');
    expect(text).toContain('Menlo-Bold - 14.0');

    // Console font
    expect(text).toContain('DVTConsoleTextFont');

    // Markup fonts
    expect(text).toContain('DVTMarkupTextCodeFont');
    expect(text).toContain('DVTMarkupTextPrimaryHeadingFont');
    // Primary heading should be larger (fontSize + 6)
    expect(text).toContain('Menlo-Bold - 20.0');
  });

  it('uses default SFMono font when no config provided', async () => {
    const src = buildExportSource(theme, payload, detail, {});
    const planned = buildStrictExportPlan('xcode-dvtcolortheme', src, XCODE_FIELDS, {}, {});
    const artifact = await buildXcodeArtifact({ filenameBase: 'darcula', mode: 'fallback', format: 'dvt' }, planned);
    const text = await blobToText(artifact.blob);

    expect(text).toContain('SFMono-Regular - 13.0');
    expect(text).toContain('SFMono-Bold - 13.0');
  });
});
