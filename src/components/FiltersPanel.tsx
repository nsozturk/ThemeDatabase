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

export function FiltersPanel({ filters, total, filtered, onChange }: FiltersPanelProps) {
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
        <input
          id="hex-filter"
          name="hex-filter"
          autoComplete="off"
          value={filters.hex}
          onChange={(event) => onChange({ ...filters, hex: event.target.value })}
          placeholder="#cc7832"
        />
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
