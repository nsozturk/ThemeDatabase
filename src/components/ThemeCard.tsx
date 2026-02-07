import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import type { ThemeIndexRecord } from '@/types/theme';

interface ThemeCardProps {
  theme: ThemeIndexRecord;
  view: 'grid' | 'list';
}

function Preview({ theme, unavailableLabel }: { theme: ThemeIndexRecord; unavailableLabel: string }) {
  const initial = theme.previewSvg ?? theme.previewPng ?? '';
  const [currentSrc, setCurrentSrc] = useState(initial);
  const [failed, setFailed] = useState(!initial);

  if (failed) {
    return (
      <div className="preview-fallback" style={{ background: theme.bg }}>
        <div className="preview-fallback-skeleton" aria-hidden="true" />
        <div className="preview-fallback-overlay">
          <span>{unavailableLabel}</span>
        </div>
      </div>
    );
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
  const { t } = useI18n();
  const navigate = useNavigate();

  const goToDetail = (): void => {
    navigate(`/themes/${theme.id}`);
  };

  const ignoreCardNavigation = (target: EventTarget | null): boolean => {
    const element = target as HTMLElement | null;
    return Boolean(element?.closest('a, button, input, select, textarea'));
  };

  const onCardClick = (event: MouseEvent<HTMLElement>): void => {
    if (ignoreCardNavigation(event.target)) {
      return;
    }
    goToDetail();
  };

  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (ignoreCardNavigation(event.target)) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToDetail();
    }
  };

  return (
    <article
      className={`theme-card is-clickable ${view}`}
      role="link"
      tabIndex={0}
      aria-label={t('card.openDetail', { name: theme.themeDisplayName })}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
    >
      <div className="preview-wrap">
        <Preview key={theme.id} theme={theme} unavailableLabel={t('card.previewUnavailable')} />
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
          <Link to={`/themes/${theme.id}`}>{t('card.details')}</Link>
          <Link to={`/builder/${theme.id}`}>{t('card.vsixBuilder')}</Link>
        </div>
      </div>
    </article>
  );
}
