import { useEffect, useMemo, useRef, useState } from 'react';
import type { ThemeIndexRecord } from '@/types/theme';
import { ThemeCard } from '@/components/ThemeCard';

interface VirtualThemeCollectionProps {
  items: ThemeIndexRecord[];
  view: 'grid' | 'list';
  selectedSet: Set<string>;
  selectionDisabled: boolean;
  onToggleSelected: (id: string) => void;
}

const overscan = 3;

export function VirtualThemeCollection({ items, view, selectedSet, selectionDisabled, onToggleSelected }: VirtualThemeCollectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(680);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setHeight(Math.max(420, entry.contentRect.height));
      setWidth(entry.contentRect.width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const columns = view === 'grid' ? Math.max(1, Math.floor(width / 320)) : 1;
  const rowHeight = view === 'grid' ? 312 : 168;

  const rows = useMemo(() => {
    const chunks: ThemeIndexRecord[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      chunks.push(items.slice(i, i + columns));
    }
    return chunks;
  }, [items, columns]);

  const totalHeight = rows.length * rowHeight;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(rows.length, Math.ceil((scrollTop + height) / rowHeight) + overscan);
  const visibleRows = rows.slice(start, end);

  return (
    <div
      ref={containerRef}
      className="virtual-wrap"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      role="region"
      aria-label="Filtered themes"
      tabIndex={0}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleRows.map((row, idx) => {
          const rowIndex = start + idx;
          return (
            <div
              key={rowIndex}
              className={`virtual-row ${view}`}
              style={{
                position: 'absolute',
                top: rowIndex * rowHeight,
                height: rowHeight,
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {row.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  view={view}
                  selected={selectedSet.has(theme.id)}
                  selectionDisabled={selectionDisabled}
                  onToggleSelected={onToggleSelected}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
