/* global window, document */
(function main() {
  const vscode = window.__THEMEDATABASE_VSCODE__;
  const config = window.__THEMEDATABASE_CONFIG__ || {};
  const persistedState = (vscode.getState && vscode.getState()) || {};

  const state = {
    records: [],
    filtered: [],
    visibleCount: 200,
    loading: true,
    filters: {
      q: '',
      bg: 'all',
      token: 'any',
      hex: '',
      tolerance: 28,
      style: 'all',
      hue: 'all',
      contrast: 'all',
      saturation: 'all',
      brightness: 'all',
      sort: 'name',
    },
    exact: {
      localIds: new Set(),
      remoteLookup: null,
      remoteReady: false,
      upgradedIds: new Set(Array.isArray(persistedState.upgradedThemeIds) ? persistedState.upgradedThemeIds : []),
      shardCache: new Map(),
    },
  };

  const appearanceCache = new Map();
  let statusState = { level: 'info', text: 'Loading local catalog…' };

  function saveState() {
    if (!vscode.setState) return;
    vscode.setState({
      upgradedThemeIds: Array.from(state.exact.upgradedIds),
    });
  }

  function escapeHtml(input) {
    return String(input ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function joinUrl(base, p) {
    const left = String(base || '').replace(/\/+$/, '');
    const right = String(p || '').replace(/^\/+/, '');
    return `${left}/${right}`;
  }

  function normalizeHex(input) {
    const trimmed = String(input || '').trim();
    if (!trimmed) return '';
    const raw = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
    }
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
    if (/^#[0-9a-fA-F]{8}$/.test(raw)) return `#${raw.slice(1, 7).toLowerCase()}`;
    return '';
  }

  function hexToRgb(hex) {
    const n = normalizeHex(hex);
    if (!n) return null;
    const safe = n.slice(1);
    return {
      r: Number.parseInt(safe.slice(0, 2), 16),
      g: Number.parseInt(safe.slice(2, 4), 16),
      b: Number.parseInt(safe.slice(4, 6), 16),
    };
  }

  function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === rn) h = ((gn - bn) / delta) % 6;
      else if (max === gn) h = ((bn - rn) / delta) + 2;
      else h = ((rn - gn) / delta) + 4;
      h *= 60;
      if (h < 0) h += 360;
    }

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs((2 * l) - 1));
    return { h, s, l };
  }

  function hueDistance(a, b) {
    const raw = Math.abs(a - b);
    return Math.min(raw, 360 - raw);
  }

  function relativeLuminance(r, g, b) {
    const toLinear = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return (0.2126 * toLinear(r)) + (0.7152 * toLinear(g)) + (0.0722 * toLinear(b));
  }

  function contrastRatio(a, b) {
    const l1 = relativeLuminance(a.r, a.g, a.b);
    const l2 = relativeLuminance(b.r, b.g, b.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function scoreToBand(score) {
    if (score < 34) return 'low';
    if (score < 67) return 'medium';
    return 'high';
  }

  function hueBucket(hue, saturation) {
    if (saturation < 0.14) return 'neutral';
    if (hue < 15 || hue >= 345) return 'red';
    if (hue < 45) return 'orange';
    if (hue < 70) return 'yellow';
    if (hue < 165) return 'green';
    if (hue < 195) return 'cyan';
    if (hue < 255) return 'blue';
    if (hue < 290) return 'purple';
    return 'pink';
  }

  function circularSpreadDegrees(hues) {
    if (!hues.length) return 0;
    const sums = hues.reduce((acc, h) => {
      const rad = (h * Math.PI) / 180;
      return { sin: acc.sin + Math.sin(rad), cos: acc.cos + Math.cos(rad) };
    }, { sin: 0, cos: 0 });

    const n = hues.length;
    const r = Math.sqrt((sums.cos / n) ** 2 + (sums.sin / n) ** 2);
    return (1 - Math.max(0, Math.min(1, r))) * 180;
  }

  function averageHexFromColors(colors) {
    const rgbs = colors.map(hexToRgb).filter(Boolean);
    if (!rgbs.length) return '#20242b';
    const sums = rgbs.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 });
    const avg = {
      r: Math.round(sums.r / rgbs.length),
      g: Math.round(sums.g / rgbs.length),
      b: Math.round(sums.b / rgbs.length),
    };
    return `#${avg.r.toString(16).padStart(2, '0')}${avg.g.toString(16).padStart(2, '0')}${avg.b.toString(16).padStart(2, '0')}`;
  }

  function getSyntaxColors(record) {
    return Object.values(record.syntaxSummary || {})
      .map((entry) => normalizeHex(entry && entry.hex))
      .filter(Boolean);
  }

  function deriveAppearance(record) {
    const bg = normalizeHex(record.bg) || '#20242b';
    const badge = normalizeHex(record.badge);
    const syntax = getSyntaxColors(record);
    const weighted = [bg, bg, ...syntax];
    if (badge) weighted.push(badge);

    const avgHex = averageHexFromColors(weighted);
    const avgRgb = hexToRgb(avgHex) || { r: 32, g: 36, b: 43 };
    const avgHsl = rgbToHsl(avgRgb.r, avgRgb.g, avgRgb.b);

    const bgRgb = hexToRgb(bg) || { r: 32, g: 36, b: 43 };
    const contrastValues = syntax
      .map((hex) => hexToRgb(hex))
      .filter(Boolean)
      .map((rgb) => contrastRatio(bgRgb, rgb));

    const avgContrast = contrastValues.length
      ? contrastValues.reduce((sum, value) => sum + value, 0) / contrastValues.length
      : 1;

    const contrastScore = Math.round(Math.max(0, Math.min(100, ((avgContrast - 1) / 20) * 100)));
    const saturationScore = Math.round(Math.max(0, Math.min(100, avgHsl.s * 100)));
    const brightnessScore = Math.round(Math.max(0, Math.min(100, avgHsl.l * 100)));
    const hue = hueBucket(avgHsl.h, avgHsl.s);

    const hueSpread = circularSpreadDegrees(
      syntax
        .map((hex) => hexToRgb(hex))
        .filter(Boolean)
        .map((rgb) => rgbToHsl(rgb.r, rgb.g, rgb.b))
        .filter((hsl) => hsl.s >= 0.12)
        .map((hsl) => hsl.h),
    );

    const styleTags = [];
    if (saturationScore <= 45 && brightnessScore >= 62) styleTags.push('pastel');
    if (saturationScore >= 62) styleTags.push('vivid');
    if (saturationScore >= 20 && saturationScore <= 55 && contrastScore >= 18 && contrastScore <= 72) styleTags.push('muted');
    if (saturationScore >= 70 && contrastScore >= 68) styleTags.push('neon');
    if (hueSpread <= 14 || saturationScore <= 10) styleTags.push('monochrome');
    if ((hue === 'orange' || hue === 'yellow' || hue === 'green') && saturationScore <= 60 && brightnessScore <= 65) styleTags.push('earthy');

    return {
      avgHex,
      hueBucket: hue,
      styleTags: [...new Set(styleTags)],
      contrastBand: scoreToBand(contrastScore),
      saturationBand: scoreToBand(saturationScore),
      brightnessBand: scoreToBand(brightnessScore),
    };
  }

  function appearanceFor(record) {
    const hit = appearanceCache.get(record.id);
    if (hit) return hit;

    const candidate = {
      avgHex: normalizeHex(record.avgHex),
      hueBucket: record.hueBucket,
      styleTags: Array.isArray(record.styleTags) ? record.styleTags : [],
      contrastBand: record.contrastBand,
      saturationBand: record.saturationBand,
      brightnessBand: record.brightnessBand,
    };

    if (
      candidate.avgHex
      && candidate.hueBucket
      && candidate.styleTags.length
      && candidate.contrastBand
      && candidate.saturationBand
      && candidate.brightnessBand
    ) {
      appearanceCache.set(record.id, candidate);
      return candidate;
    }

    const computed = deriveAppearance(record);
    appearanceCache.set(record.id, computed);
    return computed;
  }

  function canPassSaturationGuard(targetHex, candidateHex, tolerance) {
    const targetRgb = hexToRgb(targetHex);
    const candidateRgb = hexToRgb(candidateHex);
    if (!targetRgb || !candidateRgb) return false;

    const target = rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b);
    const candidate = rgbToHsl(candidateRgb.r, candidateRgb.g, candidateRgb.b);

    if (target.s >= 0.28 && candidate.s <= 0.16) return false;
    if (target.s >= 0.28 && candidate.s >= 0.2) {
      const maxHueDrift = 10 + (Math.max(0, Math.min(100, tolerance)) / 100) * 58;
      if (hueDistance(target.h, candidate.h) > maxHueDrift) return false;
    }
    return true;
  }

  function pivotRgb(v) {
    const c = v / 255;
    return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
  }

  function pivotXyz(v) {
    return v > 0.008856 ? v ** (1 / 3) : (7.787 * v) + (16 / 116);
  }

  function hexToLab(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return [0, 0, 0];

    const rl = pivotRgb(rgb.r);
    const gl = pivotRgb(rgb.g);
    const bl = pivotRgb(rgb.b);

    const x = ((rl * 0.4124) + (gl * 0.3576) + (bl * 0.1805)) / 0.95047;
    const y = ((rl * 0.2126) + (gl * 0.7152) + (bl * 0.0722)) / 1;
    const z = ((rl * 0.0193) + (gl * 0.1192) + (bl * 0.9505)) / 1.08883;

    const fx = pivotXyz(x);
    const fy = pivotXyz(y);
    const fz = pivotXyz(z);

    return [(116 * fy) - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  function deltaE(a, b) {
    const dl = a[0] - b[0];
    const da = a[1] - b[1];
    const db = a[2] - b[2];
    return Math.sqrt((dl * dl) + (da * da) + (db * db));
  }

  function toleranceToDelta(tolerance) {
    const clamped = Math.max(0, Math.min(100, Number(tolerance) || 0));
    return ((clamped / 100) ** 1.25) * 65;
  }

  function candidateHexesForRole(record, role) {
    if (role === 'background') return [record.bg];
    if (role === 'average') return [appearanceFor(record).avgHex];

    const syntax = getSyntaxColors(record);
    if (role === 'any') return [...syntax, record.bg];

    const entry = record.syntaxSummary && record.syntaxSummary[role];
    return entry && entry.hex ? [entry.hex] : [];
  }

  function recordMatchesColor(record, targetHex, role, tolerance) {
    const normalizedTarget = normalizeHex(targetHex);
    if (!normalizedTarget) return true;

    const candidates = candidateHexesForRole(record, role);
    if (!candidates.length) return false;

    const targetLab = hexToLab(normalizedTarget);
    const maxDistance = toleranceToDelta(tolerance);

    return candidates.some((hex) => {
      const normalized = normalizeHex(hex);
      if (!normalized) return false;
      if (!canPassSaturationGuard(normalizedTarget, normalized, tolerance)) return false;
      return deltaE(targetLab, hexToLab(normalized)) <= maxDistance;
    });
  }

  function qualityFor(record) {
    if (state.exact.upgradedIds.has(record.id)) return 'exact';
    if (record.quality === 'exact') return 'exact';
    if (state.exact.localIds.has(record.id) || record.quality === 'upgradable') return 'upgradable';
    if (state.exact.remoteLookup && state.exact.remoteLookup[record.id]) return 'upgradable';
    return 'fallback';
  }

  function setStatus(level, text) {
    statusState = { level, text };
    const statusEl = document.getElementById('status');
    if (!statusEl) return;
    statusEl.setAttribute('data-level', level);
    statusEl.textContent = text;
  }

  function renderSelect(name, options) {
    return `<select id="${escapeHtml(name)}">${options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select>`;
  }

  function renderApp() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="shell">
        <section class="panel hero">
          <h1>ThemeDatabase Explorer</h1>
          <p>All themes are available offline in catalog mode. Exact quality upgrades are fetched only when needed.</p>
          <div id="status" class="status" data-level="${escapeHtml(statusState.level)}">${escapeHtml(statusState.text)}</div>
        </section>

        <section class="panel toolbar">
          <div class="filters">
            <div class="field" style="grid-column: span 2">
              <label for="q">Search</label>
              <input id="q" type="search" placeholder="Theme, publisher, description…" />
            </div>
            <div class="field"><label for="bg">Background</label>${renderSelect('bg', ['all', 'dark', 'light', 'blue', 'purple', 'green', 'orange', 'gray', 'mixed'])}</div>
            <div class="field"><label for="token">Token</label>${renderSelect('token', ['any', 'background', 'average', 'keyword', 'string', 'comment', 'function', 'variable', 'number', 'type', 'operator'])}</div>
            <div class="field"><label for="style">Style</label>${renderSelect('style', ['all', 'pastel', 'vivid', 'muted', 'neon', 'monochrome', 'earthy'])}</div>
            <div class="field"><label for="hue">Hue</label>${renderSelect('hue', ['all', 'neutral', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink'])}</div>
            <div class="field"><label for="contrast">Contrast</label>${renderSelect('contrast', ['all', 'low', 'medium', 'high'])}</div>
            <div class="field"><label for="saturation">Saturation</label>${renderSelect('saturation', ['all', 'low', 'medium', 'high'])}</div>
            <div class="field"><label for="brightness">Brightness</label>${renderSelect('brightness', ['all', 'low', 'medium', 'high'])}</div>
            <div class="field"><label for="hex">HEX</label><input id="hex" type="text" placeholder="#cc7832" /></div>
            <div class="field"><label for="tolerance">Tolerance</label><input id="tolerance" type="range" min="0" max="100" value="28" /></div>
            <div class="field"><label for="sort">Sort</label>${renderSelect('sort', ['name', 'publisher', 'background'])}</div>
          </div>

          <div class="controls-row">
            <label class="toggle">
              <input id="installAndApply" type="checkbox" ${config.installAndApplyByDefault ? 'checked' : ''} />
              Install + apply theme
            </label>
            <button id="reset" class="btn btn-secondary" type="button">Reset filters</button>
          </div>
        </section>

        <section class="panel">
          <div class="list-head">
            <div>
              <h2>Catalog</h2>
              <p id="stats">0 / 0 themes</p>
            </div>
            <div id="exactInfo" class="pill">exact lookup: loading</div>
          </div>
          <div id="cards" class="cards"></div>
          <div id="empty" class="empty" hidden>No themes match this filter.</div>
          <div id="loadMoreWrap" class="load-more-wrap" hidden>
            <button id="loadMore" class="btn btn-secondary" type="button">Load more</button>
          </div>
        </section>
      </div>
    `;
  }

  function setControlsFromState() {
    for (const [key, value] of Object.entries(state.filters)) {
      const el = document.getElementById(key);
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
        el.value = String(value);
      }
    }
  }

  function bindControls() {
    const ids = ['q', 'bg', 'token', 'style', 'hue', 'contrast', 'saturation', 'brightness', 'hex', 'sort'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const handler = () => {
        state.filters[id] = el.value;
        state.visibleCount = 200;
        applyFilters();
      };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    }

    const tolerance = document.getElementById('tolerance');
    if (tolerance) {
      tolerance.addEventListener('input', () => {
        state.filters.tolerance = Number(tolerance.value) || 0;
        state.visibleCount = 200;
        applyFilters();
      });
    }

    const reset = document.getElementById('reset');
    if (reset) {
      reset.addEventListener('click', () => {
        state.filters = {
          q: '',
          bg: 'all',
          token: 'any',
          hex: '',
          tolerance: 28,
          style: 'all',
          hue: 'all',
          contrast: 'all',
          saturation: 'all',
          brightness: 'all',
          sort: 'name',
        };
        state.visibleCount = 200;
        setControlsFromState();
        applyFilters();
      });
    }

    const loadMore = document.getElementById('loadMore');
    if (loadMore) {
      loadMore.addEventListener('click', () => {
        state.visibleCount += 200;
        renderResults();
      });
    }

    const cards = document.getElementById('cards');
    if (cards) {
      cards.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const button = target.closest('button[data-action]');
        if (!(button instanceof HTMLButtonElement)) return;

        const action = button.dataset.action;
        if (action === 'install') {
          const extensionId = button.dataset.extensionId || '';
          const themeName = button.dataset.themeName || '';
          const installAndApplyEl = document.getElementById('installAndApply');
          const installAndApply = Boolean(installAndApplyEl && installAndApplyEl.checked);

          vscode.postMessage({
            type: 'installExtension',
            extensionId,
            themeName,
            installAndApply,
          });
          setStatus('info', `Installing ${extensionId}...`);
          return;
        }

        if (action === 'marketplace') {
          const url = button.dataset.url || '';
          if (url) {
            vscode.postMessage({ type: 'openExternal', url });
          }
          return;
        }

        if (action === 'upgrade') {
          const themeId = button.dataset.themeId || '';
          upgradeExact(themeId).catch((error) => {
            const text = error instanceof Error ? error.message : 'Exact upgrade failed.';
            setStatus('error', text);
          });
        }
      });
    }
  }

  function applyFilters() {
    const filters = state.filters;
    const q = String(filters.q || '').trim().toLowerCase();

    const out = state.records.filter((record) => {
      if (q) {
        const text = `${record.themeDisplayName} ${record.extensionName} ${record.publisher} ${record.description}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      if (filters.bg !== 'all' && record.bgCategory !== filters.bg) return false;

      const appearance = appearanceFor(record);
      if (filters.style !== 'all' && !appearance.styleTags.includes(filters.style)) return false;
      if (filters.hue !== 'all' && appearance.hueBucket !== filters.hue) return false;
      if (filters.contrast !== 'all' && appearance.contrastBand !== filters.contrast) return false;
      if (filters.saturation !== 'all' && appearance.saturationBand !== filters.saturation) return false;
      if (filters.brightness !== 'all' && appearance.brightnessBand !== filters.brightness) return false;

      if (filters.hex && !recordMatchesColor(record, filters.hex, filters.token, Number(filters.tolerance) || 0)) return false;
      return true;
    });

    out.sort((a, b) => {
      if (filters.sort === 'publisher') return String(a.publisher || '').localeCompare(String(b.publisher || ''));
      if (filters.sort === 'background') return String(a.bg || '').localeCompare(String(b.bg || ''));
      return String(a.themeDisplayName || '').localeCompare(String(b.themeDisplayName || ''));
    });

    state.filtered = out;
    renderResults();
  }

  function renderResults() {
    const stats = document.getElementById('stats');
    const cards = document.getElementById('cards');
    const empty = document.getElementById('empty');
    const loadMoreWrap = document.getElementById('loadMoreWrap');
    const exactInfo = document.getElementById('exactInfo');

    if (!stats || !cards || !empty || !loadMoreWrap || !exactInfo) return;

    stats.textContent = `${state.filtered.length.toLocaleString()} / ${state.records.length.toLocaleString()} themes`;
    exactInfo.textContent = state.exact.remoteReady ? 'exact lookup: ready' : 'exact lookup: loading';

    if (!state.filtered.length) {
      cards.innerHTML = '';
      empty.hidden = false;
      loadMoreWrap.hidden = true;
      return;
    }

    empty.hidden = true;
    const visible = state.filtered.slice(0, state.visibleCount);

    cards.innerHTML = visible.map((record) => {
      const appearance = appearanceFor(record);
      const tags = appearance.styleTags.slice(0, 3);
      const quality = qualityFor(record);
      const qualityClass = quality === 'exact' ? 'is-exact' : quality === 'upgradable' ? 'is-upgradable' : 'is-fallback';

      return `
        <article class="card">
          <div class="card-head">
            <div>
              <h3 class="card-title">${escapeHtml(record.themeDisplayName)}</h3>
              <p class="card-pub">${escapeHtml(record.publisher)} · ${escapeHtml(record.extensionName)}</p>
            </div>
            <div class="swatch" style="background:${escapeHtml(normalizeHex(record.bg) || '#20242b')}"></div>
          </div>

          <div class="meta">
            <span class="pill">${escapeHtml(record.bgCategory || 'unknown')}</span>
            <span class="pill">${escapeHtml(appearance.hueBucket)}</span>
            <span class="pill ${qualityClass}">${escapeHtml(quality)}</span>
            ${tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join('')}
          </div>

          <div class="card-actions">
            <button
              class="btn"
              type="button"
              data-action="install"
              data-extension-id="${escapeHtml(record.extensionId || '')}"
              data-theme-name="${escapeHtml(record.themeDisplayName || '')}"
            >
              Install
            </button>

            <button
              class="btn btn-secondary"
              type="button"
              data-action="marketplace"
              data-url="${escapeHtml(record.marketplaceUrl || '')}"
            >
              Marketplace
            </button>

            ${quality === 'upgradable' ? `
              <button
                class="btn btn-secondary"
                type="button"
                data-action="upgrade"
                data-theme-id="${escapeHtml(record.id || '')}"
              >
                Upgrade exact
              </button>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');

    loadMoreWrap.hidden = visible.length >= state.filtered.length;
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed request: ${url}`);
    }
    return response.json();
  }

  async function loadLocalCatalog() {
    state.loading = true;
    const localBase = String(config.localDataUrl || '').trim();
    if (!localBase) {
      throw new Error('Local data URL missing.');
    }

    setStatus('info', 'Loading local catalog manifest…');
    const manifest = await fetchJson(joinUrl(localBase, 'catalog/manifest.json'));
    const shardCount = Number(manifest.shardCount || 0);
    if (!shardCount) {
      throw new Error('Invalid local catalog manifest.');
    }

    setStatus('info', `Loading local catalog shards… 0/${shardCount}`);
    const records = [];
    let cursor = 0;
    let loaded = 0;

    const worker = async () => {
      while (cursor < shardCount) {
        const index = cursor;
        cursor += 1;

        const shardPath = `catalog/shards/catalog-${String(index).padStart(3, '0')}.json`;
        const shard = await fetchJson(joinUrl(localBase, shardPath));
        records.push(...shard);
        loaded += 1;
        setStatus('info', `Loading local catalog shards… ${loaded}/${shardCount}`);
      }
    };

    const concurrency = Math.min(6, shardCount);
    await Promise.all(Array.from({ length: concurrency }, worker));

    state.records = records;
    state.loading = false;
    setStatus('success', `Local catalog ready: ${records.length.toLocaleString()} themes`);
    applyFilters();

    const exactManifest = await fetchJson(joinUrl(localBase, 'payload/exact/manifest.json'));
    const exactIds = Array.isArray(exactManifest.themeIds) ? exactManifest.themeIds : [];
    state.exact.localIds = new Set(exactIds);
    renderResults();
  }

  async function loadRemoteExactLookup() {
    const remoteBase = String(config.remoteDataUrl || '').trim();
    if (!remoteBase) {
      state.exact.remoteReady = true;
      renderResults();
      return;
    }

    try {
      const manifest = await fetchJson(joinUrl(remoteBase, 'data/vsix/manifest.json'));
      state.exact.remoteLookup = manifest.exactLookup || {};
      state.exact.remoteReady = true;
      setStatus('success', `Exact lookup ready: ${Object.keys(state.exact.remoteLookup).length.toLocaleString()} ids`);
      renderResults();
    } catch {
      state.exact.remoteLookup = null;
      state.exact.remoteReady = true;
      setStatus('info', 'Running with local fallback quality only.');
      renderResults();
    }
  }

  async function upgradeExact(themeId) {
    if (!themeId) return;
    if (state.exact.upgradedIds.has(themeId)) {
      setStatus('info', 'Exact payload already cached for this theme.');
      return;
    }

    const lookup = state.exact.remoteLookup;
    if (!lookup) {
      throw new Error('Exact lookup is not available.');
    }

    const location = lookup[themeId];
    if (!location) {
      throw new Error('No exact payload available for this theme.');
    }

    const shardId = Number(location.shard);
    const offset = Number(location.offset);
    const remoteBase = String(config.remoteDataUrl || '').trim();
    if (!remoteBase) {
      throw new Error('Remote base URL missing for exact upgrade.');
    }

    setStatus('info', `Downloading exact shard ${String(shardId).padStart(3, '0')}…`);

    let shard = state.exact.shardCache.get(shardId);
    if (!shard) {
      const shardPath = `data/vsix/exact-shards/exact-${String(shardId).padStart(3, '0')}.json`;
      shard = await fetchJson(joinUrl(remoteBase, shardPath));
      state.exact.shardCache.set(shardId, shard);
    }

    const item = shard[offset] || shard.find((entry) => entry.themeId === themeId);
    if (!item) {
      throw new Error('Exact payload not found in shard.');
    }

    state.exact.upgradedIds.add(themeId);
    saveState();
    setStatus('success', `Exact payload cached for ${themeId}`);
    renderResults();
  }

  window.addEventListener('message', (event) => {
    const msg = event.data || {};
    if (msg.type === 'status' && typeof msg.text === 'string') {
      setStatus(msg.level || 'info', msg.text);
    }
  });

  renderApp();
  bindControls();
  setControlsFromState();
  applyFilters();

  loadLocalCatalog()
    .then(() => loadRemoteExactLookup())
    .catch((error) => {
      const text = error instanceof Error ? error.message : 'Catalog load failed.';
      setStatus('error', text);
    });
}());
