import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';

type WebviewMessage =
  | {
    type: 'installExtension';
    extensionId: string;
    themeName: string;
    installAndApply: boolean;
  }
  | {
    type: 'openExternal';
    url: string;
  };

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';
  for (let i = 0; i < 24; i += 1) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return value;
}

function sanitizeBaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return 'https://nsozturk.github.io/ThemeDatabase';
  }
  return trimmed.replace(/\/+$/, '');
}

async function installFromCatalog(
  message: Extract<WebviewMessage, { type: 'installExtension' }>,
): Promise<void> {
  const extensionId = message.extensionId.trim();
  if (!/^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i.test(extensionId)) {
    throw new Error('Invalid extension id.');
  }

  await vscode.commands.executeCommand('workbench.extensions.installExtension', extensionId);

  if (message.installAndApply && message.themeName.trim()) {
    await vscode.workspace
      .getConfiguration('workbench')
      .update('colorTheme', message.themeName.trim(), vscode.ConfigurationTarget.Global);
  }
}

function readMediaAsset(extensionUri: vscode.Uri, ...parts: string[]): string {
  const filePath = path.join(extensionUri.fsPath, ...parts);
  return fs.readFileSync(filePath, 'utf8');
}

function createHtml(
  panel: vscode.WebviewPanel,
  extensionUri: vscode.Uri,
  localDataUrl: string,
  remoteDataUrl: string,
  installAndApplyByDefault: boolean,
): string {
  const nonce = getNonce();
  const css = readMediaAsset(extensionUri, 'media', 'webview.css');
  const script = readMediaAsset(extensionUri, 'media', 'webview.js');

  const config = JSON.stringify({
    localDataUrl,
    remoteDataUrl,
    installAndApplyByDefault,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${panel.webview.cspSource} https: data:; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src ${panel.webview.cspSource} https: http:;"
  />
  <title>ThemeDatabase Explorer</title>
  <style nonce="${nonce}">${css}</style>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}">window.__THEMEDATABASE_CONFIG__=${config};window.__THEMEDATABASE_VSCODE__=acquireVsCodeApi();</script>
  <script nonce="${nonce}">${script}</script>
</body>
</html>`;
}

function post(panel: vscode.WebviewPanel, payload: Record<string, unknown>): void {
  void panel.webview.postMessage(payload);
}

export function activate(context: vscode.ExtensionContext): void {
  const command = vscode.commands.registerCommand('themedatabase.openExplorer', () => {
    const config = vscode.workspace.getConfiguration('themedatabase');
    const remoteDataUrl = sanitizeBaseUrl(config.get<string>('dataBaseUrl', 'https://nsozturk.github.io/ThemeDatabase'));
    const installAndApplyByDefault = config.get<boolean>('installAndApplyByDefault', true);

    const localDataUri = vscode.Uri.joinPath(context.extensionUri, 'data');
    const mediaUri = vscode.Uri.joinPath(context.extensionUri, 'media');

    const panel = vscode.window.createWebviewPanel(
      'themedatabase.explorer',
      'ThemeDatabase',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [localDataUri, mediaUri],
      },
    );

    const localDataUrl = panel.webview.asWebviewUri(localDataUri).toString();
    panel.webview.html = createHtml(
      panel,
      context.extensionUri,
      localDataUrl,
      remoteDataUrl,
      installAndApplyByDefault,
    );

    panel.webview.onDidReceiveMessage(async (raw: unknown) => {
      const message = raw as WebviewMessage;
      if (!message || typeof message !== 'object' || !('type' in message)) {
        return;
      }

      if (message.type === 'openExternal') {
        try {
          const uri = vscode.Uri.parse(message.url);
          await vscode.env.openExternal(uri);
        } catch {
          post(panel, { type: 'status', level: 'error', text: 'Invalid external URL.' });
        }
        return;
      }

      if (message.type === 'installExtension') {
        post(panel, {
          type: 'status',
          level: 'info',
          text: `Installing ${message.extensionId}...`,
        });

        try {
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `ThemeDatabase: Installing ${message.extensionId}`,
              cancellable: false,
            },
            async () => installFromCatalog(message),
          );

          post(panel, {
            type: 'status',
            level: 'success',
            text: message.installAndApply
              ? `Installed and applied: ${message.themeName}`
              : `Installed: ${message.extensionId}`,
          });
        } catch (error) {
          const text = error instanceof Error ? error.message : 'Install failed.';
          post(panel, { type: 'status', level: 'error', text });
        }
      }
    }, undefined, context.subscriptions);
  });

  context.subscriptions.push(command);
}

export function deactivate(): void {
  // no-op
}
