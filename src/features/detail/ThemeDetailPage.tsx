import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getThemeDetailRecordById, getThemeIndexRecordById } from '@/lib/dataClient';
import { useI18n } from '@/i18n';
import type { ThemeDetailRecord, ThemeIndexRecord } from '@/types/theme';

function formatLabel(value: string): string {
  return value
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function ThemeDetailPage() {
  const { t } = useI18n();
  const { themeId = '' } = useParams();
  const [theme, setTheme] = useState<ThemeIndexRecord | null>(null);
  const [detail, setDetail] = useState<ThemeDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;

    async function run(): Promise<void> {
      setLoading(true);
      const [indexRecord, detailRecord] = await Promise.all([
        getThemeIndexRecordById(themeId),
        getThemeDetailRecordById(themeId),
      ]);

      if (!canceled) {
        setTheme(indexRecord);
        setDetail(detailRecord);
        setLoading(false);
      }
    }

    run().catch((error) => {
      console.error(error);
      if (!canceled) {
        setLoading(false);
      }
    });

    return () => {
      canceled = true;
    };
  }, [themeId]);

  if (loading) {
    return <main className="tdb-container page-block">{t('detail.loading')}</main>;
  }

  if (!theme || !detail) {
    return (
      <main className="tdb-container page-block">
        <p>{t('detail.notFound')}</p>
        <Link to="/">{t('detail.backToList')}</Link>
      </main>
    );
  }

  const tokenRows = detail.tokenPalette.slice().sort((a, b) => a.role.localeCompare(b.role));
  const editorRows = Object.entries(detail.editorColors).sort(([a], [b]) => a.localeCompare(b));

  return (
    <main className="tdb-container page-block detail-v2-page">
      <section className="detail-v2-hero" style={{ '--theme-bg': theme.bg } as CSSProperties}>
        <div className="detail-v2-copy">
          <div className="detail-v2-badges">
            <span>{formatLabel(theme.bgCategory)} Theme</span>
          </div>
          <h1>{theme.themeDisplayName}</h1>
          <p className="detail-v2-meta">{theme.publisher} · {theme.extensionName}</p>
          <p>{detail.description || theme.description}</p>
          <div className="detail-v2-actions">
            <Link to={`/builder/${theme.id}`}>{t('detail.exportVsix')}</Link>
            <a href={theme.marketplaceUrl} target="_blank" rel="noreferrer">{t('detail.marketplace')}</a>
          </div>
        </div>

        <div className="detail-v2-preview-shell">
          <header>
            <div className="lights" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span>{theme.themeInternalName || theme.themeDisplayName}</span>
          </header>

          <div className="detail-v2-preview-frame">
            {theme.previewSvg || theme.previewPng ? (
              <img
                src={theme.previewSvg ?? theme.previewPng}
                alt={`${theme.themeDisplayName} preview`}
                width={960}
                height={600}
                loading="lazy"
              />
            ) : (
              <div style={{ background: theme.bg }} />
            )}
          </div>

          <footer>
            <span>{t('detail.previewStatus')}</span>
            <span>{t('detail.previewLabel')}</span>
          </footer>
        </div>
      </section>

      <section className="detail-v2-grid">
        <article className="detail-v2-card">
          <h2>{t('detail.tokenPalette')}</h2>
          <ul>
            {tokenRows.map((item) => (
              <li key={item.role}>
                <span>{formatLabel(item.role)}</span>
                <code>{item.hex}</code>
                <span className="dot" style={{ background: item.hex }} />
              </li>
            ))}
          </ul>
        </article>

        <article className="detail-v2-card">
          <h2>{t('detail.editorColors')}</h2>
          <ul>
            {editorRows.map(([key, value]) => (
              <li key={key}>
                <span>{key}</span>
                <code>{value}</code>
                <span className="dot" style={{ background: value }} />
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="detail-v2-card detail-v2-similar">
        <h2>{t('detail.similarThemes')}</h2>
        <div className="similar-links">
          {detail.similarThemeIds.slice(0, 8).map((id) => (
            <Link key={id} to={`/themes/${id}`}>{id.split('__').slice(-1)[0]}</Link>
          ))}
        </div>
      </section>
    </main>
  );
}
