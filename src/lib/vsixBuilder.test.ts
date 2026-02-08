import JSZip from 'jszip';
import { buildInputSchema, buildVsixArtifact, buildVsixPackArtifact } from '@/lib/vsixBuilder';
import type { ThemeIndexRecord, VsixPayloadRecord } from '@/types/theme';

const record: ThemeIndexRecord = {
  id: 'theme-1',
  extensionId: 'publisher.ext',
  extensionName: 'Theme Pack',
  publisher: 'Publisher',
  themeInternalName: 'darcula',
  themeDisplayName: 'Darcula',
  description: 'desc',
  bg: '#2b2d30',
  badge: '#4a88ff',
  bgCategory: 'dark',
  syntaxSummary: {},
  previewSvg: '',
  marketplaceUrl: 'https://example.com',
  themeUrl: 'https://example.com',
  labVectors: [0, 0, 0],
};

const payload: VsixPayloadRecord = {
  themeId: 'theme-1',
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

describe('vsix builder', () => {
  it('validates input schema', () => {
    expect(() => buildInputSchema.parse({
      publisher: 'theme-db',
      name: 'darcula-pack',
      displayName: 'Darcula Pack',
      version: '1.0.0',
      description: 'Generated package',
    })).not.toThrow();
  });

  it('builds a vsix artifact', async () => {
    const artifact = await buildVsixArtifact({
      publisher: 'theme-db',
      name: 'darcula-pack',
      displayName: 'Darcula Pack',
      version: '1.0.0',
      description: 'Generated package',
    }, record, payload);

    expect(artifact.filename).toContain('.vsix');
    expect(artifact.blob.size).toBeGreaterThan(0);

    const zip = await JSZip.loadAsync(artifact.blob);
    const pkg = await zip.file('extension/package.json')?.async('string');
    expect(pkg).toContain('darcula-pack');
    expect(zip.file('extension/themes/darcula-pack.json')).toBeTruthy();
    expect(zip.file('extension.vsixmanifest')).toBeTruthy();
    expect(zip.file('[Content_Types].xml')).toBeTruthy();
  });

  it('builds a multi-theme vsix pack', async () => {
    const record2: ThemeIndexRecord = {
      ...record,
      id: 'theme-2',
      themeInternalName: 'nebula',
      themeDisplayName: 'Nebula',
    };

    const payload2: VsixPayloadRecord = {
      ...payload,
      themeId: 'theme-2',
      mode: 'exact',
      themeJson: {
        ...payload.themeJson,
        name: 'Nebula',
        colors: {
          'editor.background': '#111827',
        },
      },
    };

    const artifact = await buildVsixPackArtifact({
      publisher: 'theme-db',
      name: 'multi-pack',
      displayName: 'Multi Pack',
      version: '1.0.0',
      description: 'Generated package',
    }, [
      { record, payload },
      { record: record2, payload: payload2 },
    ]);

    const zip = await JSZip.loadAsync(artifact.blob);
    const pkg = await zip.file('extension/package.json')?.async('string');
    expect(pkg).toContain('multi-pack');
    expect(zip.file('extension.vsixmanifest')).toBeTruthy();

    const files = Object.keys(zip.files).filter((name) => name.startsWith('extension/themes/') && name.endsWith('.json'));
    expect(files.length).toBe(2);
  });
});
