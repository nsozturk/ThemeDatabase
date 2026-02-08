import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { getSupporters, type SupportersDoc, type SupportTierId } from '@/lib/supportersClient';

const databaseSnapshot = {
  themesIndexed: 22037,
  extensionsTracked: 14063,
  publishersTracked: 11970,
  colorKeysTracked: 27535,
};

const palettePreview = [
  { hex: '#000000', count: 1496 },
  { hex: '#ffffff', count: 1206 },
  { hex: '#1e1e1e', count: 953 },
  { hex: '#272c33', count: 380 },
  { hex: '#1f1f1e', count: 285 },
  { hex: '#202121', count: 198 },
  { hex: '#212222', count: 197 },
  { hex: '#191a19', count: 190 },
  { hex: '#263238', count: 183 },
  { hex: '#171817', count: 183 },
  { hex: '#111010', count: 171 },
  { hex: '#090a0a', count: 159 },
];

export default function AboutPage() {
  const { t, formatNumber } = useI18n();
  const [supportersDoc, setSupportersDoc] = useState<SupportersDoc | null>(null);
  const [supportersError, setSupportersError] = useState(false);

  const stats = useMemo(
    () => [
      { value: '14k+', label: t('about.statExtensions') },
      { value: '3k+', label: t('about.statColorKeys') },
      { value: '150+', label: t('about.statDailyUpdates') },
      { value: '<20ms', label: t('about.statQueryTime') },
    ],
    [t],
  );

  useEffect(() => {
    let canceled = false;
    getSupporters()
      .then((doc) => {
        if (!canceled) {
          setSupportersDoc(doc);
          setSupportersError(false);
        }
      })
      .catch(() => {
        if (!canceled) {
          setSupportersError(true);
        }
      });
    return () => {
      canceled = true;
    };
  }, []);

  const tiers = useMemo(() => {
    const byId = new Map<SupportTierId, { amountUsd: number }>();
    for (const tier of supportersDoc?.tiers ?? []) {
      byId.set(tier.id, { amountUsd: tier.amountUsd });
    }

    const fmt = (id: SupportTierId, fallbackAmount: number) => {
      const amountUsd = byId.get(id)?.amountUsd ?? fallbackAmount;
      return `$${amountUsd} / month`;
    };

    return [
      {
        id: 'supporter' as const,
        price: fmt('supporter', 3),
        title: t('support.tier.supporter.name'),
        perks: [t('support.tier.supporter.perk1')],
      },
      {
        id: 'contributor' as const,
        price: fmt('contributor', 10),
        title: t('support.tier.contributor.name'),
        perks: [t('support.tier.contributor.perk1')],
      },
      {
        id: 'sponsor' as const,
        price: fmt('sponsor', 25),
        title: t('support.tier.sponsor.name'),
        perks: [t('support.tier.sponsor.perk1'), t('support.tier.sponsor.perk2')],
      },
    ];
  }, [supportersDoc, t]);

  const supportersSorted = useMemo(() => {
    const rank: Record<SupportTierId, number> = { sponsor: 3, contributor: 2, supporter: 1 };
    return (supportersDoc?.supporters ?? [])
      .slice()
      .sort((a, b) => (rank[b.tier] - rank[a.tier]) || a.name.localeCompare(b.name));
  }, [supportersDoc]);

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
              <strong>{formatNumber(databaseSnapshot.extensionsTracked)}</strong>
              <span>{t('about.extensionsTracked')}</span>
            </div>
            <div>
              <strong>{formatNumber(databaseSnapshot.colorKeysTracked)}</strong>
              <span>{t('about.colorKeysTracked')}</span>
            </div>
          </div>
        </div>

        <div className="about-v2-color-grid">
          {palettePreview.map((item) => (
            <article key={item.hex}>
              <span className="about-v2-color-swatch" style={{ background: item.hex }} aria-hidden="true" />
              <strong>{item.hex}</strong>
              <small>{formatNumber(item.count)} / {formatNumber(databaseSnapshot.themesIndexed)}</small>
            </article>
          ))}
        </div>
        <p className="about-v2-database-note">
          {formatNumber(databaseSnapshot.themesIndexed)} indexed themes across {formatNumber(databaseSnapshot.publishersTracked)} publishers.
        </p>
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
          <Link to="/license">{t('about.licenseView')}</Link>
        </div>
      </section>

      <section className="about-v2-support">
        <div className="about-v2-support-head">
          <div>
            <p className="about-v2-kicker">{t('support.kicker')}</p>
            <h2>{t('support.title')}</h2>
            <p className="about-v2-support-body">{t('support.body')}</p>
          </div>
          <div className="about-v2-support-actions">
            <a
              className="support-v2-cta"
              href={supportersDoc?.ctaUrl ?? 'https://patreon.com/'}
              target="_blank"
              rel="noreferrer nofollow"
            >
              {t('support.cta')}
            </a>
          </div>
        </div>

        <div className="support-v2-tier-grid" aria-label={t('support.tiersTitle')}>
          {tiers.map((tier) => (
            <article key={tier.id} className="support-v2-tier-card">
              <header>
                <strong>{tier.price}</strong>
                <h3>{tier.title}</h3>
              </header>
              <ul>
                {tier.perks.map((perk) => <li key={perk}>{perk}</li>)}
              </ul>
            </article>
          ))}
        </div>

        <div className="support-v2-bottom">
          <article className="support-v2-how">
            <h3>{t('support.howTitle')}</h3>
            <p>{t('support.howBody')}</p>
          </article>

          <article className="support-v2-thanks">
            <h3>{t('support.thanksTitle')}</h3>
            {supportersError ? (
              <p className="builder-v2-muted">{t('support.unavailable')}</p>
            ) : !supportersDoc ? (
              <ul className="support-v2-thanks-list is-loading" aria-live="polite">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="support-v2-skeleton" aria-hidden="true" />
                ))}
              </ul>
            ) : supportersSorted.length ? (
              <ul className="support-v2-thanks-list" aria-live="polite">
                {supportersSorted.map((entry, index) => (
                  <li key={`${entry.name}-${index}`}>
                    <span className="support-v2-name">{entry.name}</span>
                    <span className="support-v2-pill">{t(`support.tier.${entry.tier}.name`)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="builder-v2-muted">{t('support.unavailable')}</p>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
