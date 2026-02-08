import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LOCALE_OPTIONS, useI18n, type Locale } from '@/i18n';
import { getSupporters } from '@/lib/supportersClient';
import { SupportPopover } from '@/components/SupportPopover';

export function Header() {
  const { locale, setLocale, t } = useI18n();
  const [supportUrl, setSupportUrl] = useState('https://patreon.com/');
  const [supportTiers, setSupportTiers] = useState<Array<{ id: string; label: string; amountUsd: number }>>([]);

  useEffect(() => {
    let canceled = false;
    getSupporters()
      .then((doc) => {
        if (!canceled) {
          setSupportUrl(doc.ctaUrl);
          setSupportTiers(doc.tiers ?? []);
        }
      })
      .catch(() => {
        // Keep a safe fallback; do not block rendering.
      });
    return () => {
      canceled = true;
    };
  }, []);

  return (
    <header className="tdb-header">
      <div className="tdb-container tdb-header-inner">
        <Link to="/" className="tdb-brand" aria-label="ThemeDatabase home">
          <span className="tdb-brand-mark" />
          <div>
            <strong>ThemeDatabase</strong>
            <small>{t('header.brandSubtitle')}</small>
          </div>
        </Link>
        <p className="tdb-header-motto">{t('header.motto')}</p>
        <nav className="tdb-nav" aria-label={t('header.navMain')}>
          <Link to="/">{t('header.navThemes')}</Link>
          <span aria-hidden="true">•</span>
          <Link to="/about">{t('header.navAbout')}</Link>
          <span aria-hidden="true">•</span>
          <SupportPopover supportUrl={supportUrl} tiers={supportTiers} variant="desktop" />
          <label className="tdb-lang-switch">
            <span>{t('header.language')}</span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
              aria-label={t('header.language')}
            >
              {LOCALE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </nav>
        <div className="tdb-actions-mobile">
          <label className="tdb-lang-mobile">
            <span>{t('header.language')}</span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
              aria-label={t('header.language')}
            >
              {LOCALE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <SupportPopover supportUrl={supportUrl} tiers={supportTiers} variant="mobile" />
        </div>
      </div>
    </header>
  );
}
