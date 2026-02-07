import { useEffect, useMemo, useRef, useState } from 'react';
import type { ThemeFilters, SyntaxRole } from '@/types/theme';

interface FiltersPanelProps {
  filters: ThemeFilters;
  total: number;
  filtered: number;
  onChange: (next: ThemeFilters) => void;
}

const tokenOptions: Array<{ value: ThemeFilters['token']; label: string }> = [
  { value: 'any', label: 'Any Token' },
  { value: 'background', label: 'Background' },
  { value: 'keyword', label: 'Keyword' },
  { value: 'string', label: 'String' },
  { value: 'comment', label: 'Comment' },
  { value: 'function', label: 'Function' },
  { value: 'variable', label: 'Variable' },
  { value: 'number', label: 'Number' },
  { value: 'type', label: 'Type' },
  { value: 'operator', label: 'Operator' },
];

const bgOptions = ['all', 'dark', 'light', 'blue', 'purple', 'green', 'orange', 'gray', 'mixed'];

const presetColorGroups: Array<{ category: string; colors: Array<{ label: string; hex: string }> }> = [
  {
    category: 'Darcula Çekirdeği',
    colors: [
      { label: 'Background', hex: '#2b2d30' },
      { label: 'Keyword', hex: '#cc7832' },
      { label: 'Function', hex: '#ffc66d' },
      { label: 'String', hex: '#6a8759' },
      { label: 'Comment', hex: '#808080' },
      { label: 'Number', hex: '#6897bb' },
    ],
  },
  {
    category: 'Sıcak Tonlar',
    colors: [
      { label: 'Amber', hex: '#ffb347' },
      { label: 'Coral', hex: '#ff7661' },
      { label: 'Rose', hex: '#ff5f8f' },
      { label: 'Brick', hex: '#c25b56' },
      { label: 'Gold', hex: '#d6b54b' },
      { label: 'Copper', hex: '#b87333' },
    ],
  },
  {
    category: 'Soğuk Tonlar',
    colors: [
      { label: 'Ocean', hex: '#4a88ff' },
      { label: 'Cyan', hex: '#48c9d6' },
      { label: 'Mint', hex: '#58d6a2' },
      { label: 'Teal', hex: '#2ca58d' },
      { label: 'Violet', hex: '#9876aa' },
      { label: 'Indigo', hex: '#5b6ee1' },
    ],
  },
  {
    category: 'Nötr Tonlar',
    colors: [
      { label: 'Snow', hex: '#f5f7fa' },
      { label: 'Cloud', hex: '#c9d1d9' },
      { label: 'Slate', hex: '#7a869a' },
      { label: 'Steel', hex: '#5b6575' },
      { label: 'Graphite', hex: '#3b4048' },
      { label: 'Black', hex: '#111315' },
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
    <section className="filters-panel" aria-label="Theme filters">
      <div className="search-col">
        <label htmlFor="theme-search">Ara</label>
        <input
          id="theme-search"
          name="theme-search"
          autoComplete="off"
          value={filters.q}
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
          placeholder="Tema, yayıncı, açıklama…"
        />
      </div>

      <div>
        <label htmlFor="bg-filter">Arkaplan Kategorisi</label>
        <select
          id="bg-filter"
          value={filters.bg}
          onChange={(event) => onChange({ ...filters, bg: event.target.value })}
        >
          {bgOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="token-filter">Token Rolü</label>
        <select
          id="token-filter"
          value={filters.token}
          onChange={(event) => onChange({ ...filters, token: event.target.value as SyntaxRole | 'any' | 'background' })}
        >
          {tokenOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="hex-filter">HEX</label>
        <div className="hex-filter-wrap" ref={paletteRef}>
          <button
            type="button"
            className="hex-trigger"
            aria-label="Renk paletini aç"
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
            <div className="hex-popover" role="dialog" aria-label="HEX color palette">
              <div className="hex-popover-header">
                <strong>Renk Paleti</strong>
                <button type="button" onClick={() => setPaletteOpen(false)}>Kapat</button>
              </div>

              <div className="hex-custom-picker">
                <span>Özel Renk</span>
                <input
                  type="color"
                  value={activeColor}
                  onChange={(event) => applyHex(event.target.value)}
                  aria-label="Özel renk seç"
                />
                <code>{activeColor}</code>
              </div>

              <div className="hex-preset-groups">
                {presetColorGroups.map((group) => (
                  <section key={group.category}>
                    <h4>{group.category}</h4>
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
        <label htmlFor="tolerance-filter">Tolerance {filters.tolerance}</label>
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
        <label htmlFor="sort-filter">Sıralama</label>
        <select
          id="sort-filter"
          value={filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value as ThemeFilters['sort'] })}
        >
          <option value="name">İsim</option>
          <option value="publisher">Publisher</option>
          <option value="background">Arkaplan</option>
        </select>
      </div>

      <div>
        <label htmlFor="view-filter">Görünüm</label>
        <select
          id="view-filter"
          value={filters.view}
          onChange={(event) => onChange({ ...filters, view: event.target.value as ThemeFilters['view'] })}
        >
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </select>
      </div>

      <div className="filter-stats" aria-live="polite">
        <strong>{filtered.toLocaleString('tr-TR')}</strong> / {total.toLocaleString('tr-TR')} tema
      </div>
    </section>
  );
}
