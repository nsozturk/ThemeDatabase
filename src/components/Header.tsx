import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="tdb-header">
      <div className="tdb-container tdb-header-inner">
        <Link to="/" className="tdb-brand" aria-label="ThemeDatabase home">
          <span className="tdb-brand-mark" />
          <div>
            <strong>ThemeDatabase</strong>
            <small>Global VS Code Theme Explorer</small>
          </div>
        </Link>
        <nav className="tdb-nav" aria-label="Main">
          <Link to="/">Themes</Link>
          <span aria-hidden="true">•</span>
          <span className="muted">Community</span>
          <span aria-hidden="true">•</span>
          <span className="muted">Docs</span>
        </nav>
      </div>
    </header>
  );
}
