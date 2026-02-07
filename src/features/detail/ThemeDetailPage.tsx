import type { CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getThemeDetailRecordById, getThemeIndexRecordById } from '@/lib/dataClient';
import { useI18n } from '@/i18n';
import type { ThemeDetailRecord, ThemeIndexRecord } from '@/types/theme';

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

  return (
    <main className="tdb-container page-block detail-page">
      <section className="detail-hero" style={{ '--theme-bg': theme.bg } as CSSProperties}>
        <div>
          <h1>{theme.themeDisplayName}</h1>
          <p>{theme.publisher} · {theme.extensionName}</p>
          <p>{detail.description || theme.description}</p>
          <div className="detail-actions">
            <Link to={`/builder/${theme.id}`}>{t('detail.exportVsix')}</Link>
            <a href={theme.marketplaceUrl} target="_blank" rel="noreferrer">{t('detail.marketplace')}</a>
          </div>
        </div>
        <div className="detail-preview">
          {theme.previewSvg || theme.previewPng ? (
            <img
              src={theme.previewSvg ?? theme.previewPng}
              alt={`${theme.themeDisplayName} preview`}
              width={800}
              height={500}
              loading="lazy"
            />
          ) : (
            <div style={{ background: theme.bg }} />
          )}
        </div>
      </section>

      <section className="detail-grid">
        <article>
          <h2>{t('detail.tokenPalette')}</h2>
          <ul>
            {detail.tokenPalette.map((item) => (
              <li key={item.role}>
                <span>{item.role}</span>
                <code>{item.hex}</code>
                <span className="dot" style={{ background: item.hex }} />
              </li>
            ))}
          </ul>
        </article>

        <article>
          <h2>{t('detail.editorColors')}</h2>
          <ul>
            {Object.entries(detail.editorColors).map(([key, value]) => (
              <li key={key}>
                <span>{key}</span>
                <code>{value}</code>
                <span className="dot" style={{ background: value }} />
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section>
        <h2>{t('detail.similarThemes')}</h2>
        <div className="similar-links">
          {detail.similarThemeIds.slice(0, 8).map((id) => (
            <Link key={id} to={`/themes/${id}`}>{id}</Link>
          ))}
        </div>
      </section>
    </main>
  );
}
