# ThemeDatabase

ThemeDatabase is a static GitHub Pages app for discovering 22K+ VS Code themes, filtering by color/token intent, and exporting selected themes as `.vsix` packages.

## Stack

- React + Vite + TypeScript
- HashRouter for GitHub Pages-safe routing
- Browser-side VSIX packaging with JSZip
- Static sharded data under `public/data`

## Key Flows

1. Home / Explorer: Darcula-inspired interactive code preview + color/token filters.
2. Theme Detail: palette breakdown, metadata, related themes.
3. VSIX Builder: package config + validation + client-side `.vsix` output.
4. Success: download and install guidance.

## Data Pipeline

Source data (from workspace root):

- `../themes_enhanced.csv`
- `../theme_previews_svg`
- `../theme_previews_png`
- `../extracted_themes`

Generate data shards:

```bash
npm run build:data
```

Sync preview assets:

```bash
npm run sync:previews
```

Full local build:

```bash
npm run build:full
```

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm run test:run
npm run smoke
```

## Deploy

GitHub Actions workflow publishes `dist/` to GitHub Pages. Ensure generated `public/data` and preview assets are present before pushing.

## SEO Notes

- SEO tags are defined in `index.html` (description, keywords, Open Graph, Twitter, JSON-LD).
- `public/robots.txt` and `public/sitemap.xml` are included for GitHub Pages indexing.
- If your GitHub Pages URL differs from `https://ns0bj.github.io/ThemeDatabase/`, update:
  - `index.html` canonical + `og:url` + `og:image`
  - `public/robots.txt` sitemap URL
  - `public/sitemap.xml` `<loc>`
