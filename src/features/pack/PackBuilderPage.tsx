import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useSelectedThemes } from '@/lib/useSelectedThemes';
import { getThemeIndexRecordById } from '@/lib/dataClient';
import { getVsixPayloadByThemeId } from '@/lib/vsixDataClient';
import { buildInputSchema, buildVsixPackArtifact } from '@/lib/vsixBuilder';
import { setBuildArtifact } from '@/lib/buildArtifactStore';
import type { ThemeIndexRecord, VsixPayloadRecord } from '@/types/theme';

type PackItem = { record: ThemeIndexRecord; payload: VsixPayloadRecord };

function sanitizeBase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export default function PackBuilderPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const selected = useSelectedThemes();
  const { selectedIds, maxSelected, remove } = selected;

  const [items, setItems] = useState<PackItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'packaging' | 'error'>('idle');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    publisher: 'themedatabase',
    name: 'selected-theme-pack',
    displayName: 'Theme Pack',
    version: '1.0.0',
    description: 'Selected themes exported from ThemeDatabase.',
  });

  useEffect(() => {
    let canceled = false;

    async function run(): Promise<void> {
      setStatus('loading');
      setError('');
      const ids = selectedIds.slice(0, maxSelected);
      const loaded = await Promise.all(ids.map(async (id) => {
        const [record, payload] = await Promise.all([
          getThemeIndexRecordById(id),
          getVsixPayloadByThemeId(id),
        ]);
        if (!record || !payload) {
          return null;
        }
        return { record, payload } satisfies PackItem;
      }));

      if (canceled) return;

      const ok = loaded.filter(Boolean) as PackItem[];
      setItems(ok);

      const okIds = new Set(ok.map((x) => x.record.id));
      for (const id of ids) {
        if (!okIds.has(id)) {
          remove(id);
        }
      }

      if (ok.length === 0) {
        setStatus('idle');
        return;
      }

      setForm((prev) => {
        const first = ok[0]?.record;
        const suggested = first ? sanitizeBase(`${first.extensionId.split('.').at(-1) ?? 'themes'}-pack`) : prev.name;
        return {
          ...prev,
          name: suggested || prev.name,
          displayName: t('pack.title'),
        };
      });
      setStatus('idle');
    }

    run().catch((err) => {
      console.error(err);
      if (!canceled) {
        setError(String(err));
        setStatus('error');
      }
    });

    return () => {
      canceled = true;
    };
  }, [maxSelected, remove, selectedIds, t]);

  const validationErrors = useMemo(() => {
    const parsed = buildInputSchema.safeParse(form);
    return parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  }, [form]);

  const publisherValid = useMemo(() => /^[a-z0-9][a-z0-9-]*$/.test(form.publisher), [form.publisher]);

  const manifestPreview = useMemo(() => {
    if (!items.length) return '';
    return JSON.stringify({
      name: form.name,
      displayName: form.displayName,
      description: form.description,
      version: form.version,
      publisher: form.publisher,
      engines: { vscode: '^1.70.0' },
      categories: ['Themes'],
      contributes: {
        themes: items.map((item) => ({
          label: item.record.themeDisplayName,
          uiTheme: item.payload.uiTheme,
          path: `./themes/${sanitizeBase(`${form.name}-${item.record.themeInternalName || item.record.id}`)}.json`,
        })),
      },
    }, null, 2);
  }, [form, items]);

  const containsFallback = items.some((x) => x.payload.mode !== 'exact');

  async function onBuild(): Promise<void> {
    try {
      if (!items.length) return;
      setStatus('packaging');
      setError('');
      const artifact = await buildVsixPackArtifact(form, items);
      setBuildArtifact(artifact);
      navigate('/vsix/success', { state: { themeName: t('pack.title') } });
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setError(t('builder.vsixBuildFailed'));
      setStatus('error');
    }
  }

  if (selected.selectedIds.length === 0) {
    return (
      <main className="tdb-container page-block pack-v2-page">
        <section className="pack-empty glass-panel-like">
          <h1>{t('pack.emptyTitle')}</h1>
          <p>{t('pack.emptyBody')}</p>
          <Link to="/">{t('pack.back')}</Link>
        </section>
      </main>
    );
  }

  if (status === 'loading') {
    return (
      <main className="tdb-container page-block pack-v2-page">
        <section className="pack-empty glass-panel-like">
          <h1>{t('pack.title')}</h1>
          <p>{t('pack.loading')}</p>
          <Link to="/">{t('pack.back')}</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="tdb-container page-block builder-page builder-v2-page pack-v2-page">
      <section className="builder-v2-shell">
        <aside className="builder-v2-preview">
          <div className="builder-v2-section-head">
            <h2>{t('builder.exportPreview')}</h2>
            <span className={`builder-v2-valid-badge ${validationErrors.length ? 'is-warn' : 'is-valid'}`}>
              {validationErrors.length ? t('builder.needsFix') : t('builder.validJson')}
            </span>
          </div>
          <p className="builder-v2-muted">
            {containsFallback ? `${t('success.source', { mode: 'fallback' })}` : `${t('success.source', { mode: 'exact' })}`}
            {' · '}
            {t('pack.included', { count: items.length })}
          </p>

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

          <div className="pack-included">
            <p className="builder-v2-label">{t('pack.includedTitle')}</p>
            <ul>
              {items.map((item) => (
                <li key={item.record.id}>
                  <span>{item.record.themeDisplayName}</span>
                  <span className={`pill ${item.payload.mode === 'exact' ? 'is-exact' : 'is-fallback'}`}>
                    {item.payload.mode}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="builder-v2-form-area" aria-label={t('pack.title')}>
          <div className="builder-v2-form-scroll">
            <div className="builder-v2-title">
              <h1>{t('pack.title')}</h1>
              <p>{t('pack.subtitle')}</p>
            </div>

            <form
              id="pack-builder-form"
              className="builder-v2-form"
              onSubmit={(event) => {
                event.preventDefault();
                void onBuild();
              }}
            >
              <section>
                <h4>{t('pack.identityTitle')}</h4>
                <div className="builder-v2-grid-2">
                  <label>
                    <span>{t('pack.field.publisher')}</span>
                    <div className="builder-v2-input-wrap">
                      <input
                        name="publisher"
                        autoComplete="off"
                        value={form.publisher}
                        onChange={(e) => setForm({ ...form, publisher: sanitizeBase(e.target.value) || e.target.value })}
                      />
                      <i aria-hidden="true" className={publisherValid ? 'is-ok' : 'is-bad'} />
                    </div>
                  </label>

                  <label>
                    <span>{t('pack.field.version')}</span>
                    <input
                      name="version"
                      autoComplete="off"
                      value={form.version}
                      onChange={(e) => setForm({ ...form, version: e.target.value.trim() })}
                    />
                  </label>

                  <label className="full">
                    <span>{t('pack.field.displayName')}</span>
                    <input
                      name="displayName"
                      autoComplete="off"
                      value={form.displayName}
                      onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    />
                  </label>

                  <label className="full">
                    <span>{t('pack.field.name')}</span>
                    <input
                      name="name"
                      autoComplete="off"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: sanitizeBase(e.target.value) || e.target.value })}
                    />
                  </label>

                  <label className="full">
                    <span>{t('pack.field.description')}</span>
                    <input
                      name="description"
                      autoComplete="off"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </label>
                </div>
              </section>
            </form>

            {validationErrors.length ? (
              <ul className="error-list" aria-live="polite">
                {validationErrors.slice(0, 5).map((msg) => <li key={msg}>{msg}</li>)}
              </ul>
            ) : null}

            {error ? <p className="error">{error}</p> : null}

            <div className="pack-selected-list">
              <div className="pack-selected-head">
                <h2>{t('pack.selectedTitle')}</h2>
                <button type="button" className="selected-clear" onClick={() => selected.clear()}>{t('home.clearSelected')}</button>
              </div>
              <ul>
                {items.map((item) => (
                  <li key={item.record.id}>
                    <div>
                      <strong>{item.record.themeDisplayName}</strong>
                      <small>{item.record.publisher} · {item.record.extensionName}</small>
                    </div>
                    <button type="button" onClick={() => selected.remove(item.record.id)} aria-label={t('card.deselect', { name: item.record.themeDisplayName })}>
                      {t('filters.close')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="builder-v2-action-bar">
              <Link to="/">{t('success.backToExplorer')}</Link>
              <button
                type="button"
                onClick={() => { void onBuild(); }}
                disabled={status === 'packaging' || validationErrors.length > 0 || items.length === 0}
              >
                {status === 'packaging' ? t('builder.packaging') : t('pack.generate')}
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
