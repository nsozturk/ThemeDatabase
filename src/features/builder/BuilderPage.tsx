import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getThemeDetailRecordById, getThemeIndexRecordById } from '@/lib/dataClient';
import { setBuildArtifact } from '@/lib/buildArtifactStore';
import { useI18n } from '@/i18n';
import { buildInputSchema } from '@/lib/vsixBuilder';
import { getVsixPayloadByThemeId } from '@/lib/vsixDataClient';
import type { ThemeIndexRecord, VsixPayloadRecord } from '@/types/theme';
import type { ExportTarget } from '@/types/export';
import { TARGET_OPTIONS, isVsCodeTarget } from '@/exports/targets';
import { buildExportSource } from '@/lib/exportSource';
import { buildStrictExportPlan, type PlannedCatalog } from '@/exports/plan';
import { JETBRAINS_FIELDS } from '@/exports/jetbrains/catalog';
import { XCODE_FIELDS } from '@/exports/xcode/catalog';
import { VIM_FIELDS } from '@/exports/vim/catalog';
import { EMACS_FIELDS } from '@/exports/emacs/catalog';
import { buildJetBrainsIclsArtifact, buildJetBrainsPluginArtifact } from '@/exports/jetbrains/exporter';
import { buildXcodeArtifact, DEFAULT_FONT_CONFIG, type XcodeFontConfig } from '@/exports/xcode/exporter';
import { buildVimArtifact } from '@/exports/vim/exporter';
import { buildEmacsArtifact } from '@/exports/emacs/exporter';
import { buildVsCodeVsixArtifact } from '@/exports/vscode/exporter';

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

  const [exportTarget, setExportTarget] = useState<ExportTarget>('vscode-vsix');
  const [theme, setTheme] = useState<ThemeIndexRecord | null>(null);
  const [payload, setPayload] = useState<VsixPayloadRecord | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getThemeDetailRecordById>>>(null);
  const [status, setStatus] = useState<'idle' | 'validating' | 'packaging' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const [quickTweaks, setQuickTweaks] = useState({
    editorBackground: '#282a36',
    accentColor: '#bd93f9',
  });

  const [exportForm, setExportForm] = useState({
    filenameBase: 'themedatabase-export',
    displayName: 'ThemeDatabase Export',
    version: '1.0.0',
  });

  const [fieldOverrides, setFieldOverrides] = useState<Record<string, string | undefined>>({});
  const [fieldEnabled, setFieldEnabled] = useState<Record<string, boolean | undefined>>({});

  const [fontConfig, setFontConfig] = useState<XcodeFontConfig>({ ...DEFAULT_FONT_CONFIG });

  const isXcodeTarget = exportTarget === 'xcode-dvtcolortheme' || exportTarget === 'xcode-xccolortheme';

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
      const [record, payloadRecord, detailRecord] = await Promise.all([
        getThemeIndexRecordById(themeId),
        getVsixPayloadByThemeId(themeId),
        getThemeDetailRecordById(themeId),
      ]);

      if (!canceled) {
        setTheme(record);
        setPayload(payloadRecord);
        setDetail(detailRecord);

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

          setExportForm((prev) => ({
            ...prev,
            filenameBase: suggestedName || prev.filenameBase,
            displayName: `${record.themeDisplayName} Export`,
          }));
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
    if (!isVsCodeTarget(exportTarget)) {
      return [];
    }
    const parsed = buildInputSchema.safeParse(form);
    return parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  }, [exportTarget, form]);

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

  const plannedCatalog: PlannedCatalog | null = useMemo(() => {
    if (!theme || !payload) return null;
    if (isVsCodeTarget(exportTarget)) return null;

    const source = buildExportSource(theme, payload, detail ?? null, quickTweaks);
    const defs = exportTarget.startsWith('jetbrains')
      ? JETBRAINS_FIELDS
      : exportTarget === 'xcode-dvtcolortheme' || exportTarget === 'xcode-xccolortheme'
        ? XCODE_FIELDS
        : exportTarget === 'vim-colorscheme'
          ? VIM_FIELDS
          : EMACS_FIELDS;

    return buildStrictExportPlan(exportTarget, source, defs, fieldOverrides, quickTweaks);
  }, [detail, exportTarget, fieldOverrides, payload, quickTweaks, theme]);

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
            <h2>{isVsCodeTarget(exportTarget) ? t('builder.livePreview') : t('builder.exportPreview')}</h2>
            <span className={`builder-v2-valid-badge ${validation.length ? 'is-warn' : 'is-valid'}`}>
              {validation.length ? t('builder.needsFix') : t('builder.validJson')}
            </span>
          </div>
          <p className="builder-v2-muted">{isVsCodeTarget(exportTarget) ? t('builder.previewManifest') : t('builder.previewExportPlan')}</p>

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
              <span>{isVsCodeTarget(exportTarget) ? 'package.json' : 'export.plan.json'}</span>
              <div className="lights" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
            <pre><code>{isVsCodeTarget(exportTarget) ? manifestPreview : JSON.stringify(plannedCatalog?.plan ?? {}, null, 2)}</code></pre>
          </div>
        </aside>

        <section className="builder-v2-form-area" aria-label={t('builder.configureTitle')}>
          <div className="builder-v2-form-scroll">
            <div className="builder-v2-title">
              <h1>{isVsCodeTarget(exportTarget) ? t('builder.configureTitle') : t('builder.configureExportTitle')}</h1>
              <p>{isVsCodeTarget(exportTarget) ? t('builder.configureSubtitle') : t('builder.configureExportSubtitle')}</p>
            </div>

            <section className="builder-v2-target">
              <h4>{t('builder.exportTarget')}</h4>
              <div className="builder-v2-target-row">
                <select
                  value={exportTarget}
                  onChange={(event) => {
                    const next = event.target.value as ExportTarget;
                    setExportTarget(next);
                    setFieldOverrides({});
                    setFieldEnabled({});
                    setError('');
                    setStatus('idle');
                  }}
                  aria-label={t('builder.exportTarget')}
                >
                  {TARGET_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {t(opt.labelKey)}
                    </option>
                  ))}
                </select>
                {plannedCatalog ? (
                  <p className="builder-v2-muted builder-v2-coverage">
                    {t('builder.coverage', { included: plannedCatalog.plan.included.length, excluded: plannedCatalog.plan.excluded.length })}
                  </p>
                ) : null}
              </div>
            </section>

            <form
              id="vsix-builder-form"
              className="builder-v2-form"
              onSubmit={(event) => {
                event.preventDefault();
                void (async () => {
                  if (!theme || !payload) return;
                  setError('');

                  if (isVsCodeTarget(exportTarget)) {
                    setStatus('validating');
                    const parsed = buildInputSchema.safeParse(form);
                    if (!parsed.success) {
                      setStatus('error');
                      setError(parsed.error.issues.map((issue) => issue.message).join(', '));
                      return;
                    }

                    try {
                      setStatus('packaging');
                      const artifact = await buildVsCodeVsixArtifact(parsed.data, theme, payload);
                      setBuildArtifact(artifact);
                      setStatus('success');
                      navigate('/export/success', {
                        state: {
                          filename: artifact.filename,
                          mode: artifact.mode,
                          themeName: theme.themeDisplayName,
                          version: parsed.data.version,
                          target: artifact.target,
                        },
                      });
                    } catch (err) {
                      console.error(err);
                      setStatus('error');
                      setError(t('builder.vsixBuildFailed'));
                    }
                    return;
                  }

                  if (!plannedCatalog) {
                    setStatus('error');
                    setError(t('builder.exportPlanMissing'));
                    return;
                  }

                  const hasOverrideErrors = Object.values(plannedCatalog.groups)
                    .flat()
                    .some((f) => f.overrideError);
                  if (hasOverrideErrors) {
                    setStatus('error');
                    setError(t('builder.overrideFixRequired'));
                    return;
                  }

                  const enabledKeys = new Set(
                    plannedCatalog.plan.included
                      .map((f) => f.key)
                      .filter((key) => fieldEnabled[key] !== false),
                  );
                  const filteredIncluded = plannedCatalog.plan.included.filter((f) => enabledKeys.has(f.key));
                  const filteredGroups: PlannedCatalog['groups'] = {};
                  for (const [group, rows] of Object.entries(plannedCatalog.groups)) {
                    filteredGroups[group] = rows.filter((row) => enabledKeys.has(row.key));
                  }
                  const filtered: PlannedCatalog = {
                    plan: { ...plannedCatalog.plan, included: filteredIncluded },
                    groups: filteredGroups,
                  };

                  try {
                    setStatus('packaging');
                    const mode = payload.mode;
                    const base = exportForm.filenameBase || 'export';

                    const artifact = exportTarget === 'jetbrains-plugin'
                      ? await buildJetBrainsPluginArtifact({ filenameBase: base, displayName: exportForm.displayName, version: exportForm.version, mode }, filtered)
                      : exportTarget === 'jetbrains-icls'
                        ? await buildJetBrainsIclsArtifact({ filenameBase: base, displayName: exportForm.displayName, version: exportForm.version, mode }, filtered)
                        : exportTarget === 'xcode-dvtcolortheme' || exportTarget === 'xcode-xccolortheme'
                          ? await buildXcodeArtifact({ filenameBase: base, mode, format: exportTarget === 'xcode-xccolortheme' ? 'xc' : 'dvt', fontConfig }, filtered)
                          : exportTarget === 'vim-colorscheme'
                            ? await buildVimArtifact({ filenameBase: base, mode }, filtered)
                            : await buildEmacsArtifact({ filenameBase: base, displayName: exportForm.displayName, mode }, filtered);

                    setBuildArtifact(artifact);
                    setStatus('success');
                    navigate('/export/success', {
                      state: {
                        filename: artifact.filename,
                        mode: artifact.mode,
                        themeName: theme.themeDisplayName,
                        version: exportForm.version,
                        target: artifact.target,
                      },
                    });
                  } catch (err) {
                    console.error(err);
                    setStatus('error');
                    setError(t('builder.exportBuildFailed'));
                  }
                })();
              }}
            >
              {!isVsCodeTarget(exportTarget) ? (
                <section>
                  <h4>{t('builder.exportIdentity')}</h4>
                  <div className="builder-v2-grid-2">
                    <label className="full">
                      <span>{t('builder.exportDisplayName')}</span>
                      <input
                        value={exportForm.displayName}
                        onChange={(event) => setExportForm((prev) => ({ ...prev, displayName: event.target.value }))}
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      <span>{t('builder.exportFilename')}</span>
                      <input
                        value={exportForm.filenameBase}
                        onChange={(event) => setExportForm((prev) => ({ ...prev, filenameBase: sanitizeExtensionName(event.target.value) }))}
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      <span>{t('builder.version')}</span>
                      <input
                        value={exportForm.version}
                        onChange={(event) => setExportForm((prev) => ({ ...prev, version: event.target.value.trim() }))}
                        autoComplete="off"
                      />
                    </label>
                  </div>
                </section>
              ) : null}

              {isVsCodeTarget(exportTarget) ? (
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
              ) : null}

              {!isVsCodeTarget(exportTarget) && plannedCatalog ? (
                <section className="builder-v2-fields">
                  <h4>{t('builder.exportFields')}</h4>
                  <div className="builder-v2-field-groups">
                    {Object.entries(plannedCatalog.groups).map(([group, rows]) => (
                      <details key={group} open>
                        <summary>
                          <span>{t(`builder.group.${group.toLowerCase()}`)}</span>
                          <em>{rows.length}</em>
                        </summary>
                        <div className="builder-v2-field-list">
                          {rows.map((row) => (
                            <div key={row.key} className={`builder-v2-field-row ${row.overrideError ? 'is-error' : ''}`}>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={fieldEnabled[row.key] !== false}
                                  onChange={(event) => setFieldEnabled((prev) => ({ ...prev, [row.key]: event.target.checked }))}
                                  aria-label={t('builder.fieldToggle', { key: row.key })}
                                />
                                <span className="builder-v2-field-name">{t(row.labelKey)}</span>
                                <code className="builder-v2-field-key">{row.key}</code>
                              </label>

                              <div className="builder-v2-field-right">
                                <span className="builder-v2-field-swatch" style={{ background: row.value.startsWith('#') ? row.value : undefined }} aria-hidden="true" />
                                <input
                                  className="builder-v2-field-override"
                                  value={fieldOverrides[row.key] ?? ''}
                                  placeholder={row.value}
                                  onChange={(event) => setFieldOverrides((prev) => ({ ...prev, [row.key]: event.target.value || undefined }))}
                                  disabled={fieldEnabled[row.key] === false}
                                  aria-label={t('builder.fieldOverride', { key: row.key })}
                                />
                                <button
                                  type="button"
                                  className="builder-v2-field-reset"
                                  onClick={() => setFieldOverrides((prev) => ({ ...prev, [row.key]: undefined }))}
                                  disabled={!fieldOverrides[row.key]}
                                >
                                  {t('builder.resetField')}
                                </button>
                              </div>

                              <div className="builder-v2-field-meta">
                                <span className={`builder-v2-field-badge ${row.overridden ? 'is-override' : ''}`}>
                                  {row.overridden ? t('builder.overridden') : t('builder.mapped')}
                                </span>
                                <span className="builder-v2-field-source">{t('builder.source')}: <code>{row.source}</code></span>
                                {row.overrideError ? (
                                  <span className="builder-v2-field-error">{row.overrideError === 'alpha' ? t('builder.alphaNotSupported') : t('builder.invalidColor')}</span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              ) : null}

              {isVsCodeTarget(exportTarget) ? (
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
              ) : null}

              {isXcodeTarget ? (
                <section className="builder-v2-font-config">
                  <h4>{t('builder.fontConfig')}</h4>
                  <div className="builder-v2-grid-2">
                    <label>
                      <span>{t('builder.fontFamily')}</span>
                      <select
                        value={fontConfig.fontFamily}
                        onChange={(event) => {
                          const family = event.target.value;
                          const boldMap: Record<string, string> = {
                            'SFMono-Regular': 'SFMono-Bold',
                            'Menlo-Regular': 'Menlo-Bold',
                            'JetBrainsMono-Regular': 'JetBrainsMono-Bold',
                            'FiraCode-Regular': 'FiraCode-Bold',
                            'SourceCodePro-Regular': 'SourceCodePro-Bold',
                            'Courier': 'Courier-Bold',
                          };
                          setFontConfig((prev) => ({
                            ...prev,
                            fontFamily: family,
                            boldFamily: boldMap[family] ?? family.replace('-Regular', '-Bold'),
                          }));
                        }}
                        aria-label={t('builder.fontFamily')}
                      >
                        <option value="SFMono-Regular">SF Mono</option>
                        <option value="Menlo-Regular">Menlo</option>
                        <option value="JetBrainsMono-Regular">JetBrains Mono</option>
                        <option value="FiraCode-Regular">Fira Code</option>
                        <option value="SourceCodePro-Regular">Source Code Pro</option>
                        <option value="Courier">Courier</option>
                      </select>
                    </label>
                    <label>
                      <span>{t('builder.fontSize')}</span>
                      <input
                        type="number"
                        min={8}
                        max={32}
                        value={fontConfig.fontSize}
                        onChange={(event) => setFontConfig((prev) => ({ ...prev, fontSize: Number(event.target.value) || 13 }))}
                        aria-label={t('builder.fontSize')}
                      />
                    </label>
                  </div>
                </section>
              ) : null}

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
              {status === 'packaging' ? t('builder.packaging') : isVsCodeTarget(exportTarget) ? t('builder.generate') : t('builder.generateExport')}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
