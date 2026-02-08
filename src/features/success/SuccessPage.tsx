import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBuildArtifact } from '@/lib/buildArtifactStore';
import { useI18n } from '@/i18n';
import type { ExportTarget } from '@/types/export';

interface SuccessState {
  filename?: string;
  mode?: 'exact' | 'fallback';
  themeName?: string;
  version?: string;
  target?: ExportTarget;
}

function parseVersionFromFilename(filename: string): string {
  const match = filename.match(/-(\d+\.\d+\.\d+)\.vsix$/i);
  return match?.[1] ?? '1.0.0';
}

export default function SuccessPage() {
  const { t } = useI18n();
  const location = useLocation();
  const state = (location.state as SuccessState | null) ?? {};
  const artifact = getBuildArtifact();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const filename = artifact?.filename ?? state.filename ?? 'theme.vsix';
  const mode = artifact?.mode ?? state.mode ?? 'fallback';
  const target: ExportTarget = artifact?.target ?? state.target ?? 'vscode-vsix';
  const version = state.version ?? parseVersionFromFilename(filename);
  const sizeMb = artifact ? `${(artifact.blob.size / (1024 * 1024)).toFixed(1)} MB` : '-- MB';

  const installCommand = target === 'vscode-vsix' ? `code --install-extension ${filename}` : '';

  function onDownload(): void {
    if (!artifact) {
      return;
    }

    const url = URL.createObjectURL(artifact.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = artifact.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function onCopyCommand(): Promise<void> {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch (error) {
      console.error(error);
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 1800);
    }
  }

  const steps = (() => {
    if (target === 'vscode-vsix') {
      return [
        { title: t('success.step1Title'), detail: t('success.step1Detail') },
        { title: t('success.step2Title'), detail: t('success.step2Detail') },
        { title: t('success.step3Title'), detail: t('success.step3Detail') },
        { title: t('success.step4Title'), detail: t('success.step4Detail') },
      ];
    }

    if (target === 'jetbrains-plugin') {
      return [
        { title: t('success.jetbrains.step1Title'), detail: t('success.jetbrains.step1Detail') },
        { title: t('success.jetbrains.step2Title'), detail: t('success.jetbrains.step2Detail') },
        { title: t('success.jetbrains.step3Title'), detail: t('success.jetbrains.step3Detail') },
        { title: t('success.jetbrains.step4Title'), detail: t('success.jetbrains.step4Detail') },
      ];
    }

    if (target === 'jetbrains-icls') {
      return [
        { title: t('success.jetbrainsIcls.step1Title'), detail: t('success.jetbrainsIcls.step1Detail') },
        { title: t('success.jetbrainsIcls.step2Title'), detail: t('success.jetbrainsIcls.step2Detail') },
        { title: t('success.jetbrainsIcls.step3Title'), detail: t('success.jetbrainsIcls.step3Detail') },
      ];
    }

    if (target === 'xcode-dvtcolortheme') {
      return [
        { title: t('success.xcode.step1Title'), detail: t('success.xcode.step1Detail') },
        { title: t('success.xcode.step2Title'), detail: t('success.xcode.step2Detail') },
        { title: t('success.xcode.step3Title'), detail: t('success.xcode.step3Detail') },
      ];
    }

    if (target === 'vim-colorscheme') {
      return [
        { title: t('success.vim.step1Title'), detail: t('success.vim.step1Detail') },
        { title: t('success.vim.step2Title'), detail: t('success.vim.step2Detail') },
        { title: t('success.vim.step3Title'), detail: t('success.vim.step3Detail') },
      ];
    }

    return [
      { title: t('success.emacs.step1Title'), detail: t('success.emacs.step1Detail') },
      { title: t('success.emacs.step2Title'), detail: t('success.emacs.step2Detail') },
      { title: t('success.emacs.step3Title'), detail: t('success.emacs.step3Detail') },
    ];
  })();

  return (
    <main className="tdb-container page-block success-page success-v2-page">
      <section className="success-v2-shell">
        <div className="success-v2-primary">
          <article className="success-v2-hero glass-panel-like">
            <div className="success-v2-check" aria-hidden="true">✓</div>
            <h1>{target === 'vscode-vsix' ? t('success.title') : t('success.exportReady')}</h1>
            <p>
              {t('success.generatedFor', { name: state.themeName ?? 'Theme' })}
            </p>

            <button type="button" onClick={onDownload} disabled={!artifact}>
              {target === 'vscode-vsix' ? t('success.download') : t('success.downloadFile')}
            </button>

            <small>{t('success.versionSize', { version, size: sizeMb })}</small>
            <small>{t('success.source', { mode })} · {t(`success.target.${target}`)}</small>
          </article>

          {target === 'vscode-vsix' ? (
            <article className="success-v2-terminal glass-panel-like">
              <div className="success-v2-terminal-head">
                <h2>{t('success.installCli')}</h2>
                <span>{t('success.optional')}</span>
              </div>
              <div className="success-v2-terminal-box">
                <code>{installCommand}</code>
                <button type="button" onClick={() => { void onCopyCommand(); }}>
                  {copyState === 'copied' ? t('success.copied') : copyState === 'error' ? t('success.error') : t('success.copy')}
                </button>
              </div>
            </article>
          ) : null}
        </div>

        <aside className="success-v2-guide glass-panel-like">
          <div className="success-v2-guide-head">
            <h2>{t('success.installGuide')}</h2>
            <p>{t('success.installGuideSubtitle')}</p>
          </div>

          <ol>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span>{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="success-v2-visual-hint" aria-hidden="true">
            <div>
              <strong>{t('success.visualHint')}</strong>
              <p>{t('success.visualHintDesc')}</p>
            </div>
          </div>
        </aside>

        <div className="success-v2-footer-actions">
          <Link to="/">{t('success.backToExplorer')}</Link>
          {target === 'vscode-vsix' ? (
            <a href="https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix" target="_blank" rel="noreferrer">{t('success.viewDocs')}</a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
