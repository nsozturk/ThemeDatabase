interface LoadingBarProps {
  loaded: number;
  total: number;
}

export function LoadingBar({ loaded, total }: LoadingBarProps) {
  const ratio = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;

  return (
    <div className="loading-bar" aria-live="polite">
      <div className="loading-track">
        <div className="loading-fill" style={{ width: `${ratio}%` }} />
      </div>
      <span>
        Shard yükleme: {loaded}/{total} ({ratio}%)
      </span>
    </div>
  );
}
