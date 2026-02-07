import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';

const FALLBACK_MIT_TEXT = `MIT License

Copyright (c) 2026 ns0bj

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export default function LicensePage() {
  const { t } = useI18n();
  const [licenseText, setLicenseText] = useState(FALLBACK_MIT_TEXT);
  const [copied, setCopied] = useState(false);

  const allows = useMemo(
    () => [
      t('license.allowCommercial'),
      t('license.allowModify'),
      t('license.allowDistribute'),
      t('license.allowPrivate'),
    ],
    [t],
  );

  useEffect(() => {
    let canceled = false;

    async function run(): Promise<void> {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}LICENSE`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          return;
        }

        const text = await res.text();
        if (canceled) {
          return;
        }

        const normalized = text.trim();
        if (normalized.includes('Permission is hereby granted')) {
          setLicenseText(normalized);
        }
      } catch {
        // Keep fallback text on network/path mismatch.
      }
    }

    run().catch(() => undefined);

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timer);
  }, [copied]);

  const onCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(licenseText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="tdb-container page-block license-v2-page">
      <section className="license-v2-hero">
        <span className="license-v2-badge">{t('about.licenseBadge')}</span>
        <p className="about-v2-kicker">{t('license.kicker')}</p>
        <h1>{t('license.title')}</h1>
        <p>{t('license.subtitle')}</p>
        <div className="license-v2-actions">
          <Link to="/about">{t('license.backAbout')}</Link>
          <button type="button" onClick={() => void onCopy()}>
            {copied ? t('license.copied') : t('license.copy')}
          </button>
        </div>
      </section>

      <section className="license-v2-grid">
        <article className="license-v2-card">
          <h2>{t('license.allowsTitle')}</h2>
          <ul>
            {allows.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="license-v2-card">
          <h2>{t('license.conditionsTitle')}</h2>
          <p>{t('license.conditionNotice')}</p>
          <p>{t('license.conditionInclude')}</p>
        </article>

        <article className="license-v2-card">
          <h2>{t('license.disclaimerTitle')}</h2>
          <p>{t('license.disclaimerBody')}</p>
        </article>
      </section>

      <section className="license-v2-fulltext" aria-label={t('license.fullTextTitle')}>
        <h2>{t('license.fullTextTitle')}</h2>
        <pre>
          <code>{licenseText}</code>
        </pre>
      </section>
    </main>
  );
}
