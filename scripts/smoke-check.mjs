import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const indexHtml = path.resolve(distDir, 'index.html');
const noJekyll = path.resolve(distDir, '.nojekyll');

if (!fs.existsSync(indexHtml)) {
  throw new Error('Smoke check failed: dist/index.html missing');
}

if (!fs.existsSync(noJekyll)) {
  throw new Error('Smoke check failed: dist/.nojekyll missing');
}

const html = fs.readFileSync(indexHtml, 'utf8');
if (!html.includes('ThemeDatabase')) {
  throw new Error('Smoke check failed: expected app title missing in dist HTML');
}

console.log('Smoke check passed.');
