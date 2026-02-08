import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n';

type MethodId = 'patreon' | 'github-sponsors' | 'buymeacoffee' | 'paypal';

interface SupportMethod {
  id: MethodId;
  label: string;
  url?: string;
  disabledHint?: string;
}

interface SupportTier {
  id: string;
  label: string;
  amountUsd: number;
}

function inferMethodFromUrl(url: string): MethodId {
  const lower = url.toLowerCase();
  if (lower.includes('buymeacoffee.com')) return 'buymeacoffee';
  if (lower.includes('github.com/sponsors')) return 'github-sponsors';
  if (lower.includes('paypal.me') || lower.includes('paypal.com')) return 'paypal';
  return 'patreon';
}

function Icon({ id }: { id: MethodId }) {
  switch (id) {
    case 'patreon':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M14.8 3.5a7.2 7.2 0 0 0-7.2 7.2 7.2 7.2 0 1 0 7.2-7.2Z" />
          <path fill="currentColor" d="M4 3.5h3.2v17H4z" />
        </svg>
      );
    case 'github-sponsors':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 21s-7-4.6-9.4-8.6C.8 9 .9 5.8 3.3 4.3 5.1 3.1 7.4 3.4 9 5c1.6-1.6 3.9-1.9 5.7-.7 2.4 1.5 2.5 4.7.7 8.1C19 16.4 12 21 12 21Z"
          />
        </svg>
      );
    case 'buymeacoffee':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6 8h11a2 2 0 0 1 2 2v1.3a4.7 4.7 0 0 1-4.7 4.7H10.8A4.8 4.8 0 0 1 6 11.2V8Z"
          />
          <path fill="currentColor" d="M6 18h11v2H6z" />
          <path
            fill="currentColor"
            d="M19 10h.6a2.4 2.4 0 0 1 0 4.8H18.2A6.2 6.2 0 0 0 19 11.2V10Z"
          />
        </svg>
      );
    case 'paypal':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 20H4.8a1 1 0 0 1-1-1.2l2-12.5A3 3 0 0 1 8.8 4H15a5 5 0 0 1 0 10h-3.1l-.6 3.7A3 3 0 0 1 8.4 20H7Z"
          />
        </svg>
      );
  }
}

function isValidAmount(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 && value <= 9999;
}

export function SupportPopover({
  supportUrl,
  tiers,
  methods,
  variant = 'desktop',
}: {
  supportUrl: string;
  tiers: SupportTier[];
  methods?: Array<Pick<SupportMethod, 'id' | 'label' | 'url'>>;
  variant?: 'desktop' | 'mobile';
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const rootRef = useRef<HTMLDivElement | null>(null);

  const resolvedMethods: SupportMethod[] = useMemo(() => {
    const inferredId = inferMethodFromUrl(supportUrl);
    const inferredLabel =
      inferredId === 'buymeacoffee'
        ? 'Buy Me a Coffee'
        : inferredId === 'github-sponsors'
          ? 'GitHub Sponsors'
          : inferredId === 'paypal'
            ? 'PayPal'
            : 'Patreon';

    const configured = methods?.length ? methods : [{ id: inferredId, label: inferredLabel, url: supportUrl }];
    const byId = new Map(configured.map((m) => [m.id, m]));

    const defaults: SupportMethod[] = [
      {
        id: 'patreon',
        label: 'Patreon',
        url: byId.get('patreon')?.url,
      },
      {
        id: 'github-sponsors',
        label: 'GitHub Sponsors',
        url: byId.get('github-sponsors')?.url,
        disabledHint: t('supportPopover.needsUrl'),
      },
      {
        id: 'buymeacoffee',
        label: 'Buy Me a Coffee',
        url: byId.get('buymeacoffee')?.url ?? (inferredId === 'buymeacoffee' ? supportUrl : undefined),
        disabledHint: t('supportPopover.needsUrl'),
      },
      {
        id: 'paypal',
        label: 'PayPal',
        url: byId.get('paypal')?.url,
        disabledHint: t('supportPopover.needsUrl'),
      },
    ];

    const normalized = defaults.map((m) => ({
      ...m,
      url: typeof m.url === 'string' && m.url.startsWith('http') ? m.url : undefined,
    }));
    // Only show enabled methods for now (user requested single active link).
    return normalized.filter((m) => Boolean(m.url));
  }, [methods, supportUrl, t]);

  const defaultAmount = tiers[0]?.amountUsd ?? 3;
  const [selectedAmount, setSelectedAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<string>(String(defaultAmount));
  const [selectedMethodId, setSelectedMethodId] = useState<MethodId>(() => inferMethodFromUrl(supportUrl));

  useEffect(() => {
    setSelectedAmount(defaultAmount);
    setCustomAmount(String(defaultAmount));
  }, [defaultAmount]);

  useEffect(() => {
    const firstEnabled = resolvedMethods[0]?.id;
    if (!firstEnabled) return;
    const stillValid = resolvedMethods.some((m) => m.id === selectedMethodId);
    if (!stillValid) setSelectedMethodId(firstEnabled);
  }, [resolvedMethods, selectedMethodId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (event.target instanceof Node && !el.contains(event.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const selectedMethod = resolvedMethods.find((m) => m.id === selectedMethodId) ?? resolvedMethods[0];
  const selectedUrl = selectedMethod?.url ?? supportUrl;

  const effectiveAmount = isValidAmount(customAmount) ? Number(customAmount.trim()) : selectedAmount;
  const canSend = Boolean(selectedUrl) && Number.isFinite(effectiveAmount) && effectiveAmount > 0;
  const roundedAmount = Math.round(effectiveAmount);

  const continueUrl = useMemo(() => {
    if (!selectedUrl) return '';
    if (selectedMethodId !== 'buymeacoffee') return selectedUrl;
    try {
      const url = new URL(selectedUrl);
      url.searchParams.set('amount', String(roundedAmount));
      return url.toString();
    } catch {
      return selectedUrl;
    }
  }, [roundedAmount, selectedMethodId, selectedUrl]);

  const onPickTierAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(String(amount));
  };

  return (
    <div ref={rootRef} className={`support-popover support-popover--${variant}`}>
      <button
        type="button"
        className={variant === 'desktop' ? 'tdb-support-btn' : 'tdb-support-mobile'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {t('header.navSupport')}
      </button>

      {open && (
        <div className="support-popover-panel" role="dialog" aria-label={t('supportPopover.title')}>
          <div className="support-popover-head">
            <div>
              <strong>{t('supportPopover.title')}</strong>
              <p>{t('supportPopover.subtitle')}</p>
            </div>
            <button type="button" className="support-popover-close" onClick={() => setOpen(false)} aria-label={t('filters.close')}>
              ×
            </button>
          </div>

          <div className="support-popover-section">
            <div className="support-popover-label">{t('supportPopover.methods')}</div>
            <div className="support-popover-methods">
              {resolvedMethods.map((method) => {
                const selected = method.id === selectedMethodId;
                return (
                  <button
                    key={method.id}
                    type="button"
                    className={`support-method ${selected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedMethodId(method.id)}
                    title={method.label}
                  >
                    <span className="support-method-icon" aria-hidden="true"><Icon id={method.id} /></span>
                    <span className="support-method-label">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="support-popover-section">
            <div className="support-popover-label">{t('supportPopover.amount')}</div>
            <div className="support-popover-amounts">
              {tiers.slice(0, 3).map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  className={`support-amount ${selectedAmount === tier.amountUsd ? 'is-selected' : ''}`}
                  onClick={() => onPickTierAmount(tier.amountUsd)}
                >
                  <span className="support-amount-price">${tier.amountUsd}</span>
                  <span className="support-amount-name">{tier.label}</span>
                </button>
              ))}
              <label className="support-custom">
                <span className="support-custom-label">{t('supportPopover.custom')}</span>
                <span className="support-custom-input">
                  <span aria-hidden="true">$</span>
                  <input
                    value={customAmount}
                    inputMode="decimal"
                    onChange={(e) => setCustomAmount(e.target.value)}
                    aria-label={t('supportPopover.custom')}
                    placeholder={String(defaultAmount)}
                  />
                </span>
              </label>
            </div>
          </div>

          <div className="support-popover-actions">
            <a
              className={`support-send ${canSend ? '' : 'is-disabled'}`}
              href={canSend ? continueUrl : undefined}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => {
                setOpen(false);
                if (selectedMethodId !== 'buymeacoffee') return;
                // Buy Me a Coffee doesn't reliably support deep-linking amount via URL; copy as a helper.
                void navigator.clipboard.writeText(String(roundedAmount))
                  .then(() => {
                    setCopyState('copied');
                    window.setTimeout(() => setCopyState('idle'), 2000);
                  })
                  .catch(() => {
                    setCopyState('error');
                    window.setTimeout(() => setCopyState('idle'), 2000);
                  });
              }}
              aria-disabled={!canSend}
            >
              {t('supportPopover.send', { amount: String(roundedAmount) })}
            </a>
            <p className="support-popover-footnote">
              {copyState === 'copied'
                ? t('supportPopover.copiedAmount')
                : copyState === 'error'
                  ? t('supportPopover.copyFailed')
                  : t('supportPopover.note')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
