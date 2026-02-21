#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(EXT_ROOT, '..');
const PUBLIC_DATA_ROOT = path.resolve(PROJECT_ROOT, 'public', 'data');

const OUT_ROOT = path.resolve(EXT_ROOT, 'vsix');
const BUILD_DIR = path.resolve(OUT_ROOT, 'themedatabase-all-in-one-build');
const EXTENSION_NAME = 'themedatabase-all-themes';
const EXTENSION_DISPLAY_NAME = 'ThemeDatabase All Themes';
const VERSION = '1.0.1';
const OUTPUT_VSIX = path.resolve(OUT_ROOT, `${EXTENSION_NAME}-${VERSION}.vsix`);
const OUTPUT_REPORT = path.resolve(OUT_ROOT, `${EXTENSION_NAME}-${VERSION}-report.json`);

const ICON_PNG = path.resolve(EXT_ROOT, 'themeDatabaseIcon.png');
const ICON_SVG = path.resolve(EXT_ROOT, 'themeDatabaseIcon.svg');
const LICENSE_FILE = path.resolve(EXT_ROOT, 'LICENSE');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 120 });
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function writeJson(filePath, data) {
  writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function safeSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

function safeThemeFilename(name) {
  return `${name.replace(/[^a-z0-9-]/g, '-')}.json`;
}

function loadIndexMap() {
  const manifest = readJson(path.resolve(PUBLIC_DATA_ROOT, 'index', 'manifest.json'));
  const map = new Map();

  for (let i = 0; i < manifest.shardCount; i += 1) {
    const shardPath = path.resolve(PUBLIC_DATA_ROOT, 'index', 'shards', `index-${String(i).padStart(3, '0')}.json`);
    const shard = readJson(shardPath);
    for (const record of shard) {
      map.set(record.id, record);
    }
  }

  return map;
}

function loadExactMap() {
  const manifest = readJson(path.resolve(PUBLIC_DATA_ROOT, 'vsix', 'manifest.json'));
  const map = new Map();

  for (let i = 0; i < manifest.exactShardCount; i += 1) {
    const shardPath = path.resolve(PUBLIC_DATA_ROOT, 'vsix', 'exact-shards', `exact-${String(i).padStart(3, '0')}.json`);
    const shard = readJson(shardPath);
    for (const item of shard) {
      map.set(item.themeId, item);
    }
  }

  return map;
}

function buildReadme(totalThemes, exactCount) {
  return `# ThemeDatabase All Themes

**One theme database to rule them all.**

This extension bundles the complete ThemeDatabase set so you can browse and switch themes directly from VS Code's built-in theme picker without extra downloads.

## Features

- Full catalog included: **${totalThemes.toLocaleString()} themes**
- Highest quality where available: **${exactCount.toLocaleString()} exact theme payloads**
- Remaining themes use optimized fallback payloads for full coverage and manageable package size
- Single-file distribution for easy backup, sharing, and offline installation
- Works with VS Code theme picker out of the box
- Marketplace-ready metadata and assets (icon, categories, links, changelog)

## Why this extension

ThemeDatabase All Themes is made for developers who want maximum theme variety in one installation:

- No extra fetch/install step per theme
- Fast switching via built-in \`Preferences: Color Theme\`
- Offline-friendly setup after a single VSIX install

## Screenshots

### Theme Explorer

![Theme explorer](https://github.com/nsozturk/ThemeDatabase/raw/main/docs/screenshots/home.png)

### VSIX Builder Workflow

![VSIX builder](https://github.com/nsozturk/ThemeDatabase/raw/main/docs/screenshots/vsix-builder.png)

## Details

- Publisher: \`ns0bj\`
- Package type: VS Code color themes extension
- Supported VS Code: \`^1.70.0\`
- Format: single \`.vsix\`
- Source: https://github.com/nsozturk/ThemeDatabase
- Website: https://nsozturk.github.io/ThemeDatabase/

## Install from Marketplace

1. Open Extensions in VS Code
2. Search for **ThemeDatabase All Themes**
3. Click **Install**
4. Open command palette and run **Preferences: Color Theme**
5. Pick any included ThemeDatabase theme

## Install from VSIX

1. Open VS Code
2. Open Extensions view
3. Click the \`...\` menu in the top-right
4. Select **Install from VSIX...**
5. Pick \`${EXTENSION_NAME}-${VERSION}.vsix\`

## Notes

- This package focuses on broad theme coverage in one installable artifact.
- If you prefer lower disk usage with on-demand loading, use the main ThemeDatabase explorer extension variant.
- Need support or want to contribute? Open an issue:
  https://github.com/nsozturk/ThemeDatabase/issues
`;
}

function buildChangelog(totalThemes, exactCount, fallbackCount) {
  return `# Changelog

## ${VERSION}

- Tagline added: "One theme database to rule them all."
- Marketplace metadata update for icon and overview visibility
- Extension identity finalized as \`${EXTENSION_NAME}\`
- Included ${totalThemes.toLocaleString()} total themes in a single package
- Exact payloads: ${exactCount.toLocaleString()}
- Fallback payloads: ${fallbackCount.toLocaleString()}
`;
}

function runVscePackage(workDir, outputVsix) {
  const result = spawnSync(
    'npx',
    [
      '@vscode/vsce',
      'package',
      '--no-dependencies',
      '--out',
      outputVsix,
    ],
    {
      cwd: workDir,
      stdio: 'inherit',
      shell: false,
    },
  );

  if (result.status !== 0) {
    throw new Error(`vsce package failed with exit code ${result.status}`);
  }
}

function main() {
  ensureDir(OUT_ROOT);
  cleanDir(BUILD_DIR);

  const indexMap = loadIndexMap();
  const exactMap = loadExactMap();
  const fallback = readJson(path.resolve(PUBLIC_DATA_ROOT, 'vsix', 'fallback.json'));

  const themesDir = path.resolve(BUILD_DIR, 'themes');
  ensureDir(themesDir);

  const usedSlugs = new Set();
  const contributesThemes = [];
  let exactUsed = 0;
  let fallbackUsed = 0;

  for (let i = 0; i < fallback.length; i += 1) {
    const baseItem = fallback[i];
    const exact = exactMap.get(baseItem.themeId);
    const selected = exact || baseItem;
    if (exact) exactUsed += 1;
    else fallbackUsed += 1;

    const record = indexMap.get(baseItem.themeId);
    const label = record?.themeDisplayName || selected.themeJson?.name || baseItem.themeId;

    const rawBase = safeSlug(`tdb-all-${record?.themeInternalName || baseItem.themeId || i}`) || `tdb-all-${i}`;
    let slug = rawBase;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${rawBase}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);

    const filename = safeThemeFilename(slug);
    const relPath = `./themes/${filename}`;

    writeFile(path.resolve(themesDir, filename), JSON.stringify(selected.themeJson));
    contributesThemes.push({
      label,
      uiTheme: selected.uiTheme || 'vs-dark',
      path: relPath,
    });

    if ((i + 1) % 2500 === 0) {
      process.stdout.write(`\r[build] themes: ${i + 1}/${fallback.length}`);
    }
  }
  process.stdout.write(`\r[build] themes: ${fallback.length}/${fallback.length}\n`);

  const pkg = {
    name: EXTENSION_NAME,
    displayName: EXTENSION_DISPLAY_NAME,
    description: `One theme database to rule them all. All ${fallback.length.toLocaleString()} ThemeDatabase themes in one VSIX package.`,
    version: VERSION,
    publisher: 'ns0bj',
    icon: 'themeDatabaseIcon.png',
    preview: false,
    markdown: 'github',
    qna: 'marketplace',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'https://github.com/nsozturk/ThemeDatabase.git',
    },
    bugs: {
      url: 'https://github.com/nsozturk/ThemeDatabase/issues',
    },
    homepage: 'https://nsozturk.github.io/ThemeDatabase',
    engines: {
      vscode: '^1.70.0',
    },
    categories: ['Themes', 'Other'],
    keywords: [
      'themes',
      'vscode-theme',
      'theme-database',
      'one-theme-database-to-rule-them-all',
      'dark-theme',
      'light-theme',
      'pastel-theme',
      'all-in-one',
    ],
    galleryBanner: {
      color: '#0f1020',
      theme: 'dark',
    },
    contributes: {
      themes: contributesThemes,
    },
  };

  writeJson(path.resolve(BUILD_DIR, 'package.json'), pkg);
  writeFile(path.resolve(BUILD_DIR, 'README.md'), buildReadme(fallback.length, exactUsed));
  writeFile(path.resolve(BUILD_DIR, 'CHANGELOG.md'), buildChangelog(fallback.length, exactUsed, fallbackUsed));
  writeFile(path.resolve(BUILD_DIR, '.vscodeignore'), '*.vsix\n.vscode/**\n');

  if (fs.existsSync(LICENSE_FILE)) {
    fs.copyFileSync(LICENSE_FILE, path.resolve(BUILD_DIR, 'LICENSE'));
  }
  if (fs.existsSync(ICON_PNG)) {
    fs.copyFileSync(ICON_PNG, path.resolve(BUILD_DIR, 'themeDatabaseIcon.png'));
  }
  if (fs.existsSync(ICON_SVG)) {
    fs.copyFileSync(ICON_SVG, path.resolve(BUILD_DIR, 'themeDatabaseIcon.svg'));
  }

  if (fs.existsSync(OUTPUT_VSIX)) {
    fs.unlinkSync(OUTPUT_VSIX);
  }

  runVscePackage(BUILD_DIR, OUTPUT_VSIX);

  const sizeBytes = fs.statSync(OUTPUT_VSIX).size;
  const report = {
    generatedAt: new Date().toISOString(),
    output: OUTPUT_VSIX,
    extensionName: EXTENSION_NAME,
    version: VERSION,
    sizeBytes,
    sizeMB: Number((sizeBytes / 1024 / 1024).toFixed(2)),
    totalThemes: fallback.length,
    exactUsed,
    fallbackUsed,
    iconPngIncluded: fs.existsSync(path.resolve(BUILD_DIR, 'themeDatabaseIcon.png')),
    iconSvgIncluded: fs.existsSync(path.resolve(BUILD_DIR, 'themeDatabaseIcon.svg')),
    publishable: true,
  };
  writeJson(OUTPUT_REPORT, report);
  console.log(JSON.stringify(report, null, 2));
}

main();
