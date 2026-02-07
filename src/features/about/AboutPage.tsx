import { useMemo } from 'react';
import { useI18n } from '@/i18n';

const palettePreview = ['#2d2d2d', '#1e1e1e', '#000000', '#f8f8f8', '#333333', '#22212c', '#282a36', '#191622', '#263238', '#292d3e', '#23241f', '#fefefe'];

export default function AboutPage() {
  const { t, formatNumber } = useI18n();

  const stats = useMemo(
    () => [
      { value: '14k+', label: t('about.statExtensions') },
      { value: '3k+', label: t('about.statColorKeys') },
      { value: '150+', label: t('about.statDailyUpdates') },
      { value: '<20ms', label: t('about.statQueryTime') },
    ],
    [t],
  );

  const engineCards = useMemo(
    () => [
      {
        icon: 'functions',
        title: t('about.engineDeltaTitle'),
        detail: t('about.engineDeltaBody'),
      },
      {
        icon: 'visibility',
        title: t('about.enginePerceptualTitle'),
        detail: t('about.enginePerceptualBody'),
      },
    ],
    [t],
  );

  const performanceCards = useMemo(
    () => [
      {
        icon: 'memory',
        title: t('about.perfClientTitle'),
        detail: t('about.perfClientBody'),
      },
      {
        icon: 'dns',
        title: t('about.perfShardTitle'),
        detail: t('about.perfShardBody'),
      },
      {
        icon: 'view_in_ar',
        title: t('about.perfVirtualizedTitle'),
        detail: t('about.perfVirtualizedBody'),
      },
    ],
    [t],
  );

  const licenseHref = `${import.meta.env.BASE_URL}LICENSE`;

  return (
    <main className="tdb-container page-block about-v2-page">
      <section className="about-v2-hero">
        <div className="about-v2-hero-badge">{t('about.liveBadge')}</div>
        <h1>
          <span>{t('about.heroCount')}</span>
        </h1>
        <p>{t('about.heroSubtitle')}</p>

        <div className="about-v2-stat-grid">
          {stats.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="about-v2-algorithm">
        <div>
          <p className="about-v2-kicker">{t('about.algorithmKicker')}</p>
          <h2>{t('about.algorithmTitle')}</h2>
          <p>{t('about.algorithmBody')}</p>

          <div className="about-v2-feature-list">
            {engineCards.map((item) => (
              <article key={item.title}>
                <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="about-v2-blueprint" aria-label="HSL blueprint">
          <div className="about-v2-node about-v2-node-top">{t('about.blueprintInput')}</div>
          <div className="about-v2-node-grid">
            <div><small>HUE</small><strong>278°</strong></div>
            <div><small>SAT</small><strong>89%</strong></div>
            <div><small>LUM</small><strong>55%</strong></div>
          </div>
          <div className="about-v2-node about-v2-node-bottom">{t('about.blueprintMatch')}</div>
        </aside>
      </section>

      <section className="about-v2-database">
        <div className="about-v2-database-head">
          <div>
            <p className="about-v2-kicker">{t('about.databaseKicker')}</p>
            <h2>{t('about.databaseTitle')}</h2>
          </div>
          <div className="about-v2-database-metrics">
            <div>
              <strong>{formatNumber(14203)}</strong>
              <span>{t('about.extensionsTracked')}</span>
            </div>
            <div>
              <strong>{formatNumber(3129)}</strong>
              <span>{t('about.colorKeysTracked')}</span>
            </div>
          </div>
        </div>

        <div className="about-v2-color-grid">
          {palettePreview.map((hex) => (
            <article key={hex}>
              <span className="material-symbols-outlined" aria-hidden="true">dataset</span>
              <small>{hex}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="about-v2-engine">
        <div className="about-v2-engine-head">
          <p className="about-v2-kicker">{t('about.performanceKicker')}</p>
          <h2>{t('about.performanceTitle')}</h2>
          <p>{t('about.performanceBody')}</p>
        </div>

        <div className="about-v2-engine-grid">
          {performanceCards.map((item) => (
            <article key={item.title}>
              <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-v2-license">
        <div>
          <p className="about-v2-kicker">{t('about.licenseKicker')}</p>
          <h2>{t('about.licenseTitle')}</h2>
          <p>{t('about.licenseBody')}</p>
        </div>
        <div className="about-v2-license-actions">
          <span>{t('about.licenseBadge')}</span>
          <a href={licenseHref} target="_blank" rel="noreferrer">{t('about.licenseView')}</a>
        </div>
      </section>
    </main>
  );
}
