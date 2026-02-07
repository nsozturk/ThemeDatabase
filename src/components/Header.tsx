import { Link } from 'react-router-dom';
import { LOCALE_OPTIONS, useI18n, type Locale } from '@/i18n';

export function Header() {
  const { locale, setLocale, t } = useI18n();

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
      </div>
    </header>
  );
}
