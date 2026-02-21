# ThemeDatabase Extension

ThemeDatabase brings the 22K+ global VS Code theme catalog into a Webview explorer inside VS Code.

## Features

- Filter by:
  - Dark/light and background category
  - Average hue bucket
  - Style tags (`pastel`, `vivid`, `muted`, `neon`, `monochrome`, `earthy`)
  - Contrast / saturation / brightness bands
  - Token role + HEX match with tolerance
- Install extension on demand from the catalog item.
- Optionally apply the selected theme immediately after install.
- Local offline catalog + fallback payloads bundled in the VSIX.
- Exact payload quality can be upgraded on demand when online.

## Commands

- `ThemeDatabase: Open Explorer`

## Settings

- `themedatabase.dataBaseUrl`: dataset base URL
- `themedatabase.installAndApplyByDefault`: install+apply toggle default

## Packaging

```bash
npm install
npm run build:data
npm run package
```

The output `.vsix` can be uploaded to the VS Code Marketplace.
