import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import type { ThemeFilters, SyntaxRole } from '@/types/theme';

interface FiltersPanelProps {
  filters: ThemeFilters;
  total: number;
  filtered: number;
  onChange: (next: ThemeFilters) => void;
}

const tokenOptions: Array<{ value: ThemeFilters['token']; key: string }> = [
  { value: 'any', key: 'filters.token.any' },
  { value: 'background', key: 'filters.token.background' },
  { value: 'keyword', key: 'filters.token.keyword' },
  { value: 'string', key: 'filters.token.string' },
  { value: 'comment', key: 'filters.token.comment' },
  { value: 'function', key: 'filters.token.function' },
  { value: 'variable', key: 'filters.token.variable' },
  { value: 'number', key: 'filters.token.number' },
  { value: 'type', key: 'filters.token.type' },
  { value: 'operator', key: 'filters.token.operator' },
];

const bgOptions = ['all', 'dark', 'light', 'blue', 'purple', 'green', 'orange', 'gray', 'mixed'];

const presetColorGroups: Array<{ categoryKey: string; colors: Array<{ label: string; hex: string }> }> = [
  {
    categoryKey: 'filters.palette.warm',
    colors: [
      { label: 'Red', hex: '#ef4444' },
      { label: 'Orange', hex: '#f97316' },
      { label: 'Yellow', hex: '#eab308' },
    ],
  },
  {
    categoryKey: 'filters.palette.cool',
    colors: [
      { label: 'Green', hex: '#22c55e' },
      { label: 'Teal', hex: '#14b8a6' },
      { label: 'Cyan', hex: '#06b6d4' },
    ],
  },
  {
    categoryKey: 'filters.palette.deep',
    colors: [
      { label: 'Blue', hex: '#3b82f6' },
      { label: 'Indigo', hex: '#6366f1' },
      { label: 'Purple', hex: '#a855f7' },
    ],
  },
  {
    categoryKey: 'filters.palette.neutral',
    colors: [
      { label: 'Pink', hex: '#ec4899' },
      { label: 'Slate', hex: '#64748b' },
      { label: 'Black', hex: '#111827' },
    ],
  },
];

function normalizeSixDigitHex(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const safe = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(safe)) {
    return '';
  }
  return safe.toLowerCase();
}

export function FiltersPanel({ filters, total, filtered, onChange }: FiltersPanelProps) {
  const { t, formatNumber } = useI18n();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement | null>(null);
  const normalizedHex = useMemo(() => normalizeSixDigitHex(filters.hex), [filters.hex]);
  const activeColor = normalizedHex || '#cc7832';

  useEffect(() => {
    if (!paletteOpen) {
      return;
    }

    function onDocumentPointerDown(event: PointerEvent): void {
      const target = event.target as Node | null;
      if (!target || !paletteRef.current) {
        return;
      }
      if (!paletteRef.current.contains(target)) {
        setPaletteOpen(false);
      }
    }

    function onDocumentKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setPaletteOpen(false);
      }
    }

    document.addEventListener('pointerdown', onDocumentPointerDown);
    document.addEventListener('keydown', onDocumentKeydown);
    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
      document.removeEventListener('keydown', onDocumentKeydown);
    };
  }, [paletteOpen]);

  const applyHex = (hex: string): void => {
    onChange({ ...filters, hex: normalizeSixDigitHex(hex) || hex });
  };

  return (
    <section className="filters-panel" aria-label={t('filters.ariaLabel')}>
      <div className="search-col">
        <label htmlFor="theme-search">{t('filters.search')}</label>
        <input
          id="theme-search"
          name="theme-search"
          autoComplete="off"
          value={filters.q}
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
          placeholder={t('filters.searchPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="bg-filter">{t('filters.bgCategory')}</label>
        <select
          id="bg-filter"
          value={filters.bg}
          onChange={(event) => onChange({ ...filters, bg: event.target.value })}
        >
          {bgOptions.map((item) => (
            <option key={item} value={item}>{t(`filters.bg.${item}`)}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="token-filter">{t('filters.tokenRole')}</label>
        <select
          id="token-filter"
          value={filters.token}
          onChange={(event) => onChange({ ...filters, token: event.target.value as SyntaxRole | 'any' | 'background' })}
        >
          {tokenOptions.map((item) => (
            <option key={item.value} value={item.value}>{t(item.key)}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="hex-filter">{t('filters.hex')}</label>
        <div className="hex-filter-wrap" ref={paletteRef}>
          <button
            type="button"
            className="hex-trigger"
            aria-label={t('filters.openPalette')}
            aria-haspopup="dialog"
            aria-expanded={paletteOpen}
            onClick={() => setPaletteOpen((prev) => !prev)}
          >
            <span className="hex-trigger-swatch" style={{ background: activeColor }} />
          </button>
          <input
            id="hex-filter"
            name="hex-filter"
            autoComplete="off"
            value={filters.hex}
            onChange={(event) => onChange({ ...filters, hex: event.target.value })}
            placeholder="#cc7832"
          />
          {paletteOpen ? (
            <div className="hex-popover" role="dialog" aria-label={t('filters.paletteTitle')}>
              <div className="hex-popover-header">
                <strong>{t('filters.paletteTitle')}</strong>
                <button type="button" onClick={() => setPaletteOpen(false)}>{t('filters.close')}</button>
              </div>

              <div className="hex-custom-picker">
                <span>{t('filters.customColor')}</span>
                <input
                  type="color"
                  value={activeColor}
                  onChange={(event) => applyHex(event.target.value)}
                  aria-label={t('filters.customColorAria')}
                />
                <code>{activeColor}</code>
              </div>

              <div className="hex-preset-groups">
                {presetColorGroups.map((group) => (
                  <section key={group.categoryKey}>
                    <h4>{t(group.categoryKey)}</h4>
                    <div className="hex-preset-grid">
                      {group.colors.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          className={`hex-preset ${normalizedHex === color.hex ? 'active' : ''}`}
                          onClick={() => applyHex(color.hex)}
                          title={`${color.label} ${color.hex}`}
                        >
                          <span className="dot" style={{ background: color.hex }} />
                          <span>{color.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="tolerance-filter">{t('filters.tolerance', { value: filters.tolerance })}</label>
        <input
          id="tolerance-filter"
          name="tolerance-filter"
          type="range"
          min={0}
          max={100}
          value={filters.tolerance}
          onChange={(event) => onChange({ ...filters, tolerance: Number(event.target.value) })}
        />
      </div>

      <div>
        <label htmlFor="sort-filter">{t('filters.sort')}</label>
        <select
          id="sort-filter"
          value={filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value as ThemeFilters['sort'] })}
        >
          <option value="name">{t('filters.sort.name')}</option>
          <option value="publisher">{t('filters.sort.publisher')}</option>
          <option value="background">{t('filters.sort.background')}</option>
        </select>
      </div>

      <div>
        <label htmlFor="view-filter">{t('filters.view')}</label>
        <select
          id="view-filter"
          value={filters.view}
          onChange={(event) => onChange({ ...filters, view: event.target.value as ThemeFilters['view'] })}
        >
          <option value="grid">{t('filters.view.grid')}</option>
          <option value="list">{t('filters.view.list')}</option>
        </select>
      </div>

      <div className="filter-stats" aria-live="polite">
        {t('filters.stats', { filtered: formatNumber(filtered), total: formatNumber(total) })}
      </div>
    </section>
  );
}
