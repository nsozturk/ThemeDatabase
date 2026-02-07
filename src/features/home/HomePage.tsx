import { startTransition, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiltersPanel } from '@/components/FiltersPanel';
import { HeroCodePicker } from '@/components/HeroCodePicker';
import { LoadingBar } from '@/components/LoadingBar';
import { VirtualThemeCollection } from '@/components/VirtualThemeCollection';
import { getIndexManifest, loadAllIndexRecords } from '@/lib/dataClient';
import { applyThemeFilters } from '@/lib/filterThemes';
import { useI18n } from '@/i18n';
import { defaultFilters, readFiltersFromSearch, writeFiltersToSearch } from '@/lib/query';
import type { ThemeFilters, ThemeIndexRecord } from '@/types/theme';

export default function HomePage() {
  const { t, formatNumber } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ThemeFilters>(() => readFiltersFromSearch(searchParams));
  const [records, setRecords] = useState<ThemeIndexRecord[]>([]);
  const [loadedShards, setLoadedShards] = useState(0);
  const [totalShards, setTotalShards] = useState(0);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="tdb-container tdb-main">
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
            <h2>{t('home.explorer')}</h2>
            <p>
              {t('home.filterResult', { count: formatNumber(filtered.length) })}
            </p>
            <button type="button" onClick={() => setFilters(defaultFilters)}>{t('home.resetFilters')}</button>
          </div>
          <VirtualThemeCollection items={filtered} view={filters.view} />
        </>
      )}
    </main>
  );
}
