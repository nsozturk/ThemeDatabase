import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'screenshots');
const BASE = 'http://127.0.0.1:4173';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function wait(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.ok || (res.status >= 300 && res.status < 400)) return;
    } catch {
      // ignore
    }
    await wait(250);
  }
  throw new Error(`Server did not respond: ${url}`);
}

function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    ...opts,
  });
  return child;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  // Ensure dist is fresh so screenshots match what will ship.
  await new Promise((resolve, reject) => {
    const child = run('npm', ['run', 'build']);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build failed: ${code}`))));
  });

  const preview = run('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort']);
  try {
    await waitForServer(`${BASE}/`);

    const browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: 'new',
      args: ['--no-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

      // Home
      await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.hero-picker', { timeout: 30_000 });
      await page.waitForSelector('.filters-panel', { timeout: 30_000 });
      await page.screenshot({ path: path.join(OUT_DIR, 'home.png'), fullPage: true });

      // VSIX Builder (pick a known-good themeId present in exact payload lookup).
      await page.goto(`${BASE}/#/builder/dracula-theme-6233fe1b`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.builder-v2-shell', { timeout: 30_000 });
      await page.screenshot({ path: path.join(OUT_DIR, 'vsix-builder.png'), fullPage: true });

      // Theme Pack Builder (seed a few selected themes in localStorage).
      await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
      await page.evaluate(() => {
        localStorage.setItem('tdb.selectedThemeIds', JSON.stringify([
          '2017-dark-visual-studio-c-c-4e80493e',
          'github-dark-27bccb10',
          'github-dark-default-a576fdc2',
          'github-dark-dimmed-d11f52d',
        ]));
      });
      await page.goto(`${BASE}/#/pack`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.builder-v2-shell', { timeout: 30_000 });
      await page.screenshot({ path: path.join(OUT_DIR, 'theme-pack-builder.png'), fullPage: true });
    } finally {
      await browser.close();
    }
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
