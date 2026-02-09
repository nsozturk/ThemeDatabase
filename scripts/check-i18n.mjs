import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

function extractUsedKeys(files) {
  const re = /\bt\(\s*'([a-z0-9_.-]+)'\s*[),]/gi;
  const keys = new Set();
  for (const f of files) {
    if (f.endsWith(path.join('src', 'i18n', 'index.tsx'))) continue;
    const txt = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(txt))) {
      const k = m[1];
      if (k.includes('.')) keys.add(k);
    }
  }
  return keys;
}

function extractMessageKeys(i18nSource, name) {
  const reBlock = new RegExp(`const\\s+${name}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`);
  const m = i18nSource.match(reBlock);
  if (!m) throw new Error(`Could not locate ${name}`);
  const block = m[1];
  const reKey = /\n\s*'([^']+)'\s*:/g;
  const keys = new Set();
  let km;
  while ((km = reKey.exec(block))) keys.add(km[1]);
  return keys;
}

function extractLocalePack(i18nSource, locale) {
  const start = i18nSource.indexOf(`${locale}: {`);
  if (start < 0) return { keys: new Set(), includesEn: false };
  // Very small heuristic: find the next "\n  }" at the same indent level as the locale object end.
  const slice = i18nSource.slice(start);
  const end = slice.indexOf('\n  },');
  const block = end > 0 ? slice.slice(0, end) : slice;
  const reKey = /\n\s*'([^']+)'\s*:/g;
  const keys = new Set();
  let km;
  while ((km = reKey.exec(block))) keys.add(km[1]);
  const includesEn = /\.\.\.\s*EN_MESSAGES/.test(block);
  return { keys, includesEn };
}

const root = process.cwd();
const srcDir = path.join(root, 'src');
const files = walk(srcDir);
const usedKeys = extractUsedKeys(files);

const i18nPath = path.join(srcDir, 'i18n', 'index.tsx');
const i18nSource = fs.readFileSync(i18nPath, 'utf8');

const enKeys = extractMessageKeys(i18nSource, 'EN_MESSAGES');
const trPack = extractLocalePack(i18nSource, 'tr');

const missingInEn = [...usedKeys].filter((k) => !enKeys.has(k)).sort();
if (missingInEn.length) {
  console.error('[i18n] Missing EN keys:', missingInEn.length);
  for (const k of missingInEn) console.error(' -', k);
  process.exitCode = 1;
} else {
  console.log('[i18n] EN keys OK:', usedKeys.size, 'used');
}

const trCovered = [...usedKeys].filter((k) => trPack.keys.has(k)).length;
const trRatio = usedKeys.size ? Math.round((trCovered / usedKeys.size) * 100) : 100;
console.log(`[i18n] TR overrides: ${trCovered}/${usedKeys.size} (${trRatio}%)`);

const locales = ['tr', 'de', 'fr', 'zh', 'ja', 'ko', 'ar', 'es', 'pt', 'hi'];
for (const loc of locales) {
  const pack = extractLocalePack(i18nSource, loc);
  const covered = pack.includesEn ? usedKeys.size : [...usedKeys].filter((k) => pack.keys.has(k)).length;
  const pct = usedKeys.size ? Math.round((covered / usedKeys.size) * 100) : 100;
  const overrides = [...usedKeys].filter((k) => pack.keys.has(k)).length;
  console.log(`[i18n] ${loc}: ${covered}/${usedKeys.size} (${pct}%) overrides=${overrides}`);
}
