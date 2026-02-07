import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBuildArtifact } from '@/lib/buildArtifactStore';
import { useI18n } from '@/i18n';

interface SuccessState {
  filename?: string;
  mode?: 'exact' | 'fallback';
  themeName?: string;
  version?: string;
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
  const version = state.version ?? parseVersionFromFilename(filename);
  const sizeMb = artifact ? `${(artifact.blob.size / (1024 * 1024)).toFixed(1)} MB` : '-- MB';

  const installCommand = `code --install-extension ${filename}`;

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

  const steps = [
    {
      title: t('success.step1Title'),
      detail: t('success.step1Detail'),
    },
    {
      title: t('success.step2Title'),
      detail: t('success.step2Detail'),
    },
    {
      title: t('success.step3Title'),
      detail: t('success.step3Detail'),
    },
    {
      title: t('success.step4Title'),
      detail: t('success.step4Detail'),
    },
  ];

  return (
    <main className="tdb-container page-block success-page success-v2-page">
      <section className="success-v2-shell">
        <div className="success-v2-primary">
          <article className="success-v2-hero glass-panel-like">
            <div className="success-v2-check" aria-hidden="true">✓</div>
            <h1>{t('success.title')}</h1>
            <p>
              {t('success.generatedFor', { name: state.themeName ?? 'Theme' })}
            </p>

            <button type="button" onClick={onDownload} disabled={!artifact}>
              {t('success.download')}
            </button>

            <small>{t('success.versionSize', { version, size: sizeMb })}</small>
            <small>{t('success.source', { mode })}</small>
          </article>

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
          <a href="https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix" target="_blank" rel="noreferrer">{t('success.viewDocs')}</a>
        </div>
      </section>
    </main>
  );
}
