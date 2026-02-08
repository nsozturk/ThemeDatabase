import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';

const STORAGE_KEY = 'tdb.dismissed.homeFeaturePreview.v1';

export function HomeFeaturePreview({ selectedThemeId }: { selectedThemeId?: string }) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Keep state in sync if user clears storage in another tab.
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        setDismissed(event.newValue === '1');
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const builderHref = useMemo(() => {
    return selectedThemeId ? `/builder/${selectedThemeId}` : '';
  }, [selectedThemeId]);

  if (dismissed) return null;

  return (
    <section className="home-feature-preview" aria-label="Feature preview">
      <button
        type="button"
        className="home-feature-preview__close"
        aria-label={t('homePreview.close')}
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem(STORAGE_KEY, '1');
          } catch {
            // ignore
          }
        }}
      >
        <span aria-hidden="true">×</span>
      </button>

      <div className="home-feature-preview__cols">
        <div className="home-feature-preview__col">
          <h2 className="home-feature-preview__title">{t('homePreview.pack.title')}</h2>
          <p className="home-feature-preview__body">{t('homePreview.pack.body')}</p>
          <p className="home-feature-preview__meta">{t('homePreview.pack.meta')}</p>
          <Link className="home-feature-preview__cta" to="/pack">
            {t('homePreview.pack.cta')}
          </Link>
        </div>

        <div className="home-feature-preview__divider" aria-hidden="true" />

        <div className="home-feature-preview__col">
          <h2 className="home-feature-preview__title">{t('homePreview.export.title')}</h2>
          <p className="home-feature-preview__body">{t('homePreview.export.body')}</p>
          <p className="home-feature-preview__meta">{t('homePreview.export.meta')}</p>
          {selectedThemeId ? (
            <Link className="home-feature-preview__cta" to={builderHref}>
              {t('homePreview.export.cta')}
            </Link>
          ) : (
            <span className="home-feature-preview__hint">{t('homePreview.export.ctaDisabledHint')}</span>
          )}
        </div>
      </div>
    </section>
  );
}

