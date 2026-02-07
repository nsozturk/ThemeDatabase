import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getThemeIndexRecordById } from '@/lib/dataClient';
import { setBuildArtifact } from '@/lib/buildArtifactStore';
import { useI18n } from '@/i18n';
import { buildInputSchema, buildVsixArtifact } from '@/lib/vsixBuilder';
import { getVsixPayloadByThemeId } from '@/lib/vsixDataClient';
import type { ThemeIndexRecord, VsixPayloadRecord } from '@/types/theme';

const categoryPills = [
  { id: 'themes', key: 'builder.cat.themes', selected: true },
  { id: 'snippets', key: 'builder.cat.snippets', selected: false },
  { id: 'packs', key: 'builder.cat.packs', selected: false },
] as const;

function sanitizeExtensionName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export default function BuilderPage() {
  const { t } = useI18n();
  const { themeId = '' } = useParams();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<ThemeIndexRecord | null>(null);
  const [payload, setPayload] = useState<VsixPayloadRecord | null>(null);
  const [status, setStatus] = useState<'idle' | 'validating' | 'packaging' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const [quickTweaks, setQuickTweaks] = useState({
    editorBackground: '#282a36',
    accentColor: '#bd93f9',
  });

  const [form, setForm] = useState({
    publisher: 'themedatabase',
    name: 'darcula-theme-pack',
    displayName: 'ThemeDatabase Export',
    version: '1.0.0',
    description: t('builder.previewManifest'),
  });

  useEffect(() => {
    let canceled = false;

    async function run(): Promise<void> {
      const [record, payloadRecord] = await Promise.all([
        getThemeIndexRecordById(themeId),
        getVsixPayloadByThemeId(themeId),
      ]);

      if (!canceled) {
        setTheme(record);
        setPayload(payloadRecord);

        if (record) {
          const suggestedName = sanitizeExtensionName(
            `${record.extensionId.split('.').at(-1) ?? 'theme'}-${record.themeInternalName}`,
          );

          setForm((prev) => ({
            ...prev,
            displayName: `${record.themeDisplayName} Export`,
            name: suggestedName || prev.name,
            description: record.description || prev.description,
          }));

          setQuickTweaks({
            editorBackground: record.bg,
            accentColor: record.syntaxSummary.keyword?.hex ?? '#bd93f9',
          });
        }
      }
    }

    run().catch((err) => {
      console.error(err);
      if (!canceled) {
        setError(t('builder.payloadLoadFailed'));
      }
    });

    return () => {
      canceled = true;
    };
  }, [themeId, t]);

  const validation = useMemo(() => {
    const parsed = buildInputSchema.safeParse(form);
    return parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  }, [form]);

  const manifestPreview = useMemo(() => {
    if (!theme || !payload) {
      return '';
    }

    return JSON.stringify({
      name: form.name,
      displayName: form.displayName,
      description: form.description,
      version: form.version,
      publisher: form.publisher,
      engines: { vscode: '^1.70.0' },
      categories: ['Themes'],
      contributes: {
        themes: [
          {
            label: theme.themeDisplayName,
            uiTheme: payload.uiTheme,
            path: `./themes/${sanitizeExtensionName(form.name)}.json`,
          },
        ],
      },
    }, null, 2);
  }, [form, payload, theme]);

  async function onBuild(): Promise<void> {
    if (!theme || !payload) {
      setError(t('builder.themeOrPayloadNotFound'));
      setStatus('error');
      return;
    }

    setError('');
    setStatus('validating');

    const parsed = buildInputSchema.safeParse(form);
    if (!parsed.success) {
      setStatus('error');
      setError(parsed.error.issues.map((issue) => issue.message).join(', '));
      return;
    }

    try {
      setStatus('packaging');
      const artifact = await buildVsixArtifact(parsed.data, theme, payload);
      setBuildArtifact(artifact);
      setStatus('success');

      navigate('/vsix/success', {
        state: {
          filename: artifact.filename,
          mode: artifact.mode,
          themeName: theme.themeDisplayName,
          version: parsed.data.version,
        },
      });
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError(t('builder.vsixBuildFailed'));
    }
  }

  if (!theme || !payload) {
    return (
      <main className="tdb-container page-block">
        <p>{t('builder.loading')}</p>
        {error ? <p className="error">{error}</p> : null}
      </main>
    );
  }

  const publisherValid = /^[a-z0-9][a-z0-9-]*$/.test(form.publisher);

  return (
    <main className="tdb-container page-block builder-page builder-v2-page">
      <section className="builder-v2-shell">
        <aside className="builder-v2-preview">
          <div className="builder-v2-section-head">
            <h2>{t('builder.livePreview')}</h2>
            <span className={`builder-v2-valid-badge ${validation.length ? 'is-warn' : 'is-valid'}`}>
              {validation.length ? t('builder.needsFix') : t('builder.validJson')}
            </span>
          </div>
          <p className="builder-v2-muted">{t('builder.previewManifest')}</p>

          <div className="builder-v2-marketplace">
            <p className="builder-v2-label">{t('builder.marketplaceCard')}</p>
            <div className="builder-v2-market-card">
              <div className="builder-v2-market-icon" style={{ background: quickTweaks.accentColor }} aria-hidden="true" />
              <div>
                <h3>{form.displayName}</h3>
                <p>{form.description || t('builder.noDescription')}</p>
                <div className="builder-v2-market-meta">
                  <span>★ 0.0</span>
                  <span>↓ 0</span>
                  <span className="pill">{t('builder.themeCategory')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="builder-v2-code">
            <div className="builder-v2-code-head">
              <span>package.json</span>
              <div className="lights" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
            <pre><code>{manifestPreview}</code></pre>
          </div>
        </aside>

        <section className="builder-v2-form-area" aria-label={t('builder.configureTitle')}>
          <div className="builder-v2-form-scroll">
            <div className="builder-v2-title">
              <h1>{t('builder.configureTitle')}</h1>
              <p>{t('builder.configureSubtitle')}</p>
            </div>

            <form
              id="vsix-builder-form"
              className="builder-v2-form"
              onSubmit={(event) => {
                event.preventDefault();
                void onBuild();
              }}
            >
              <section>
                <h4>{t('builder.extensionIdentity')}</h4>
                <div className="builder-v2-grid-2">
                  <label>
                    <span>{t('builder.publisherHandle')}</span>
                    <div className="builder-v2-input-wrap">
                      <input
                        name="publisher"
                        autoComplete="off"
                        value={form.publisher}
                        onChange={(event) => setForm((prev) => ({ ...prev, publisher: sanitizeExtensionName(event.target.value) }))}
                      />
                      <i aria-hidden="true" className={publisherValid ? 'is-ok' : 'is-bad'} />
                    </div>
                    <small>{t('builder.publisherHint')}</small>
                  </label>

                  <label>
                    <span>{t('builder.version')}</span>
                    <input
                      name="version"
                      autoComplete="off"
                      value={form.version}
                      onChange={(event) => setForm((prev) => ({ ...prev, version: event.target.value.trim() }))}
                    />
                  </label>

                  <label className="full">
                    <span>{t('builder.displayName')}</span>
                    <input
                      name="displayName"
                      autoComplete="off"
                      value={form.displayName}
                      onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                    />
                  </label>

                  <label className="full">
                    <span>{t('builder.uniqueId')}</span>
                    <div className="builder-v2-prefixed-input">
                      <em>ext-</em>
                      <input
                        name="name"
                        autoComplete="off"
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: sanitizeExtensionName(event.target.value) }))}
                      />
                    </div>
                  </label>

                  <label className="full">
                    <span>{t('builder.description')}</span>
                    <input
                      name="description"
                      autoComplete="off"
                      value={form.description}
                      onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </label>
                </div>
              </section>

              <section>
                <h4>{t('builder.categories')}</h4>
                <div className="builder-v2-pills" role="list">
                  {categoryPills.map((category) => (
                    <span
                      key={category.id}
                      role="listitem"
                      className={`builder-v2-pill ${category.selected ? 'is-selected' : ''}`}
                    >
                      {t(category.key)}
                    </span>
                  ))}
                </div>
              </section>

              <section className="builder-v2-tweaks">
                <div className="builder-v2-tweaks-head">
                  <h4>{t('builder.quickTweaks')}</h4>
                  <button
                    type="button"
                    onClick={() => setQuickTweaks({
                      editorBackground: theme.bg,
                      accentColor: theme.syntaxSummary.keyword?.hex ?? '#bd93f9',
                    })}
                  >
                    {t('builder.resetDefaults')}
                  </button>
                </div>

                <div className="builder-v2-grid-2">
                  <label>
                    <span>{t('builder.editorBackground')}</span>
                    <div className="builder-v2-color-field">
                      <input
                        type="color"
                        value={quickTweaks.editorBackground}
                        onChange={(event) => setQuickTweaks((prev) => ({ ...prev, editorBackground: event.target.value }))}
                        aria-label="Editor background color"
                      />
                      <code>{quickTweaks.editorBackground}</code>
                    </div>
                  </label>

                  <label>
                    <span>{t('builder.accentColor')}</span>
                    <div className="builder-v2-color-field">
                      <input
                        type="color"
                        value={quickTweaks.accentColor}
                        onChange={(event) => setQuickTweaks((prev) => ({ ...prev, accentColor: event.target.value }))}
                        aria-label="Accent color"
                      />
                      <code>{quickTweaks.accentColor}</code>
                    </div>
                  </label>
                </div>
              </section>

              {validation.length > 0 ? (
                <ul className="error-list" aria-live="polite">
                  {validation.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}

              {error ? <p className="error" aria-live="polite">{error}</p> : null}
            </form>
          </div>

          <div className="builder-v2-action-bar">
            <Link to={`/themes/${theme.id}`}>{t('builder.backToEditor')}</Link>
            <button
              type="submit"
              form="vsix-builder-form"
              disabled={status === 'packaging'}
            >
              {status === 'packaging' ? t('builder.packaging') : t('builder.generate')}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
