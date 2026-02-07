import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ThemeIndexRecord } from '@/types/theme';

interface ThemeCardProps {
  theme: ThemeIndexRecord;
  view: 'grid' | 'list';
}

function Preview({ theme }: { theme: ThemeIndexRecord }) {
  const initial = theme.previewSvg ?? theme.previewPng ?? '';
  const [currentSrc, setCurrentSrc] = useState(initial);
  const [failed, setFailed] = useState(!initial);

  if (failed) {
    return <div className="preview-fallback" style={{ background: theme.bg }} />;
  }

  return (
    <img
      src={currentSrc}
      alt={`${theme.themeDisplayName} preview`}
      className="preview-image"
      width={640}
      height={360}
      loading="lazy"
      onError={() => {
        if (theme.previewPng && currentSrc !== theme.previewPng) {
          setCurrentSrc(theme.previewPng);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

export function ThemeCard({ theme, view }: ThemeCardProps) {
  return (
    <article className={`theme-card ${view}`}>
      <div className="preview-wrap">
        <Preview key={theme.id} theme={theme} />
      </div>
      <div className="theme-meta">
        <h3>{theme.themeDisplayName}</h3>
        <p>{theme.publisher} · {theme.extensionName}</p>
        <div className="theme-tags">
          <span className="chip" style={{ background: theme.bg }}>{theme.bg}</span>
          <span className="chip" style={{ background: theme.badge }}>{theme.bgCategory}</span>
          {Object.entries(theme.syntaxSummary).slice(0, 3).map(([role, value]) => (
            <span key={role} className="chip token" style={{ borderColor: value?.hex ?? '#5f6a7d' }}>
              {role}
            </span>
          ))}
        </div>
        <div className="theme-actions">
          <Link to={`/themes/${theme.id}`}>Detay</Link>
          <Link to={`/builder/${theme.id}`}>VSIX Builder</Link>
        </div>
      </div>
    </article>
  );
}
