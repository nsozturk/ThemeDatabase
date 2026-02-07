import { useLocation, Link } from 'react-router-dom';
import { getBuildArtifact } from '@/lib/buildArtifactStore';

interface SuccessState {
  filename?: string;
  mode?: 'exact' | 'fallback';
  themeName?: string;
}

export default function SuccessPage() {
  const location = useLocation();
  const state = (location.state as SuccessState | null) ?? {};
  const artifact = getBuildArtifact();

  const filename = artifact?.filename ?? state.filename ?? 'theme.vsix';
  const mode = artifact?.mode ?? state.mode ?? 'fallback';

  function onDownload(): void {
    if (!artifact) {
      return;
    }
    const url = URL.createObjectURL(artifact.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = artifact.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="tdb-container page-block success-page">
      <h1>VSIX hazır</h1>
      <p><strong>{state.themeName ?? 'Theme'}</strong> için paket üretildi.</p>
      <p>Dosya: <code>{filename}</code></p>
      <p>Kaynak: <code>{mode}</code></p>

      <div className="success-actions">
        <button type="button" onClick={onDownload} disabled={!artifact}>Download VSIX</button>
        <Link to="/">Theme Explorer</Link>
      </div>

      <section>
        <h2>Kurulum</h2>
        <pre><code>code --install-extension {filename}</code></pre>
      </section>
    </main>
  );
}
