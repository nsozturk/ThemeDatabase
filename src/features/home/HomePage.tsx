import { startTransition, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiltersPanel } from '@/components/FiltersPanel';
import { HeroCodePicker } from '@/components/HeroCodePicker';
import { HomeFeaturePreview } from '@/components/HomeFeaturePreview';
import { LoadingBar } from '@/components/LoadingBar';
import { ThemeCard } from '@/components/ThemeCard';
import { VirtualThemeCollection } from '@/components/VirtualThemeCollection';
import { getIndexManifest, loadAllIndexRecords } from '@/lib/dataClient';
import { applyThemeFilters } from '@/lib/filterThemes';
import { useI18n } from '@/i18n';
import { defaultFilters, readFiltersFromSearch, writeFiltersToSearch } from '@/lib/query';
import { useSelectedThemes } from '@/lib/useSelectedThemes';
import type { ThemeFilters, ThemeIndexRecord } from '@/types/theme';

export default function HomePage() {
  const { t, formatNumber } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ThemeFilters>(() => readFiltersFromSearch(searchParams));
  const [records, setRecords] = useState<ThemeIndexRecord[]>([]);
  const [loadedShards, setLoadedShards] = useState(0);
  const [totalShards, setTotalShards] = useState(0);
  const [loading, setLoading] = useState(true);

  const selected = useSelectedThemes();

  useEffect(() => {
    let canceled = false;

    async function run(): Promise<void> {
      setLoading(true);
      const manifest = await getIndexManifest();
      if (!canceled) {
        setTotalShards(manifest.shardCount);
      }

      const loaded = await loadAllIndexRecords((loadedCount, totalCount) => {
        if (!canceled) {
          setLoadedShards(loadedCount);
          setTotalShards(totalCount);
        }
      });

      if (!canceled) {
        setRecords(loaded);
        setLoading(false);
      }
    }

    run().catch((error) => {
      console.error(error);
      if (!canceled) {
        setLoading(false);
      }
    });

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const next = writeFiltersToSearch(filters);
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  const filtered = useMemo(() => applyThemeFilters(records, filters), [records, filters]);
  const recordById = useMemo(() => new Map(records.map((r) => [r.id, r])), [records]);
  const selectedRecords = useMemo(
    () => selected.selectedIds.map((id) => recordById.get(id)).filter(Boolean) as ThemeIndexRecord[],
    [recordById, selected.selectedIds],
  );
  const selectedSlots = useMemo(() => {
    if (selectedRecords.length === 0) return [] as Array<ThemeIndexRecord | null>;
    if (filters.view !== 'grid') return selectedRecords;
    const pad = (4 - (selectedRecords.length % 4)) % 4;
    return [...selectedRecords, ...Array.from({ length: pad }, () => null)];
  }, [filters.view, selectedRecords]);
  const filteredWithoutSelected = useMemo(
    () => filtered.filter((r) => !selected.selectedSet.has(r.id)),
    [filtered, selected.selectedSet],
  );

  return (
    <main className="tdb-container tdb-main">
      <HomeFeaturePreview selectedThemeId={selected.selectedIds[0]} />

      <HeroCodePicker
        onPick={(role, hex) => {
          startTransition(() => {
            setFilters((prev) => ({
              ...prev,
              token: role === 'background' ? 'background' : role,
              hex,
            }));
          });
        }}
      />

      <FiltersPanel
        filters={filters}
        total={records.length}
        filtered={filtered.length}
        onChange={(next) => {
          startTransition(() => setFilters(next));
        }}
      />

      {loading ? (
        <LoadingBar loaded={loadedShards} total={totalShards} />
      ) : (
        <>
          <div className="results-info">
            <div className="results-copy">
              <h2>{t('home.explorer')}</h2>
              <p>
                {t('home.filterResult', { count: formatNumber(filtered.length) })}
              </p>
            </div>
            <div className="results-actions">
              <span className="selected-badge" aria-live="polite">
                {t('home.selected', { count: selected.selectedIds.length, max: selected.maxSelected })}
              </span>
              <button
                type="button"
                className="pack-cta"
                onClick={() => navigate('/pack')}
                disabled={selected.selectedIds.length === 0}
              >
                {t('home.openPackBuilder')}
              </button>
              <button type="button" onClick={() => setFilters(defaultFilters)}>{t('home.resetFilters')}</button>
            </div>
          </div>

          {selectedRecords.length ? (
            <section className="selected-strip" aria-label={t('home.selectedSection')}>
              <div className="selected-head">
                <div>
                  <h3>{t('home.selectedSection')}</h3>
                  {selected.selectedIds.length >= selected.maxSelected ? (
                    <p>{t('pack.limitReached', { max: selected.maxSelected })}</p>
                  ) : null}
                </div>
                <button type="button" className="selected-clear" onClick={() => selected.clear()}>
                  {t('home.clearSelected')}
                </button>
              </div>
              <div className={`selected-grid ${filters.view}`}>
                {selectedSlots.map((theme, idx) => (
                  theme ? (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      view={filters.view}
                      selected
                      selectionDisabled={!selected.canSelectMore}
                      onToggleSelected={(id) => selected.toggle(id)}
                    />
                  ) : (
                    <div
                      key={`slot-${idx}`}
                      className="selected-placeholder"
                      aria-hidden="true"
                    />
                  )
                ))}
              </div>
            </section>
          ) : null}

          <VirtualThemeCollection
            items={filteredWithoutSelected}
            view={filters.view}
            selectedSet={selected.selectedSet}
            selectionDisabled={!selected.canSelectMore}
            onToggleSelected={(id) => selected.toggle(id)}
          />
        </>
      )}
    </main>
  );
}
