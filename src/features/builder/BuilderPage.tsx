import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getThemeIndexRecordById } from '@/lib/dataClient';
import { setBuildArtifact } from '@/lib/buildArtifactStore';
import { buildInputSchema, buildVsixArtifact } from '@/lib/vsixBuilder';
import { getVsixPayloadByThemeId } from '@/lib/vsixDataClient';
import type { ThemeIndexRecord, VsixPayloadRecord } from '@/types/theme';

export default function BuilderPage() {
  const { themeId = '' } = useParams();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<ThemeIndexRecord | null>(null);
  const [payload, setPayload] = useState<VsixPayloadRecord | null>(null);
  const [status, setStatus] = useState<'idle' | 'validating' | 'packaging' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    publisher: 'themedatabase',
    name: 'darcula-theme-pack',
    displayName: 'ThemeDatabase Export',
    version: '1.0.0',
    description: 'Generated with ThemeDatabase VSIX Builder.',
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
          setForm((prev) => ({
            ...prev,
            displayName: `${record.themeDisplayName} (ThemeDatabase Export)`,
            name: `${record.extensionId.split('.').at(-1) ?? 'theme'}-${record.themeInternalName}`
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, '-')
              .replace(/-+/g, '-')
              .slice(0, 50),
            description: record.description || prev.description,
          }));
        }
      }
    }

    run().catch((err) => {
      console.error(err);
      if (!canceled) {
        setError('VSIX payload yüklenemedi.');
      }
    });

    return () => {
      canceled = true;
    };
  }, [themeId]);

  const validation = useMemo(() => {
    const parsed = buildInputSchema.safeParse(form);
    return parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  }, [form]);

  async function onBuild(): Promise<void> {
    if (!theme || !payload) {
      setError('Tema veya payload bulunamadı.');
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
        },
      });
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('VSIX oluşturulamadı.');
    }
  }

  if (!theme || !payload) {
    return (
      <main className="tdb-container page-block">
        <p>Builder verisi yükleniyor…</p>
        {error ? <p className="error">{error}</p> : null}
      </main>
    );
  }

  return (
    <main className="tdb-container page-block builder-page">
      <section>
        <h1>VSIX Builder</h1>
        <p>{theme.themeDisplayName} için VS Code extension paketi üret.</p>
        <p className="badge">Mode: {payload.mode === 'exact' ? 'Exact' : 'Fallback'}</p>
      </section>

      <section className="builder-grid">
        <form
          className="builder-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onBuild();
          }}
        >
          {Object.entries(form).map(([key, value]) => (
            <label key={key}>
              <span>{key}</span>
              <input
                name={key}
                autoComplete="off"
                value={value}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              />
            </label>
          ))}

          {validation.length > 0 ? (
            <ul className="error-list">
              {validation.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}

          {error ? <p className="error">{error}</p> : null}

          <button type="submit" disabled={status === 'packaging'}>
            {status === 'packaging' ? 'Packaging…' : 'Build VSIX'}
          </button>

          <Link to={`/themes/${theme.id}`}>Tema detayına dön</Link>
        </form>

        <aside className="builder-preview">
          <h2>Package Preview</h2>
          <pre>{JSON.stringify({
            name: form.name,
            displayName: form.displayName,
            version: form.version,
            publisher: form.publisher,
            mode: payload.mode,
            uiTheme: payload.uiTheme,
          }, null, 2)}</pre>
        </aside>
      </section>
    </main>
  );
}
