import type { CSSProperties } from 'react';
import type { SyntaxRole } from '@/types/theme';

interface HeroCodePickerProps {
  onPick: (role: SyntaxRole | 'background', hex: string) => void;
}

const tokens: Array<{ role: SyntaxRole | 'background'; hex: string; label: string; code: string }> = [
  { role: 'background', hex: '#2b2d30', label: 'Background', code: ' ' },
  { role: 'keyword', hex: '#cc7832', label: 'Keyword', code: 'const' },
  { role: 'function', hex: '#ffc66d', label: 'Function', code: 'filterThemes' },
  { role: 'string', hex: '#6a8759', label: 'String', code: "'darcula'" },
  { role: 'comment', hex: '#808080', label: 'Comment', code: '// indexed shards' },
  { role: 'number', hex: '#6897bb', label: 'Number', code: '5000' },
  { role: 'type', hex: '#bbb529', label: 'Type', code: 'ThemeIndexRecord' },
  { role: 'variable', hex: '#a9b7c6', label: 'Variable', code: 'themeId' },
];

export function HeroCodePicker({ onPick }: HeroCodePickerProps) {
  return (
    <section className="hero-picker" aria-label="Interactive Darcula code preview">
      <div className="hero-header">
        <h1>Global Theme Database</h1>
        <p>Kod içindeki herhangi bir rengi seç ve tüm tema havuzunda filtrele.</p>
      </div>
      <div className="hero-code-wrap" role="group" aria-label="Color pickable code sample">
        <pre>
          <code>
            <span className="line">
              <button type="button" style={{ color: '#cc7832' }} onClick={() => onPick('keyword', '#cc7832')}>const</button>{' '}
              <button type="button" style={{ color: '#a9b7c6' }} onClick={() => onPick('variable', '#a9b7c6')}>dataset</button>{' '}
              <button type="button" style={{ color: '#cc7832' }} onClick={() => onPick('keyword', '#cc7832')}>=</button>{' '}
              <button type="button" style={{ color: '#ffc66d' }} onClick={() => onPick('function', '#ffc66d')}>loadShards</button>
              <span style={{ color: '#a9b7c6' }}>()</span>;
            </span>
            <span className="line">
              <button type="button" style={{ color: '#808080' }} onClick={() => onPick('comment', '#808080')}>// click token colors to filter themes</button>
            </span>
            <span className="line">
              <button type="button" style={{ color: '#cc7832' }} onClick={() => onPick('keyword', '#cc7832')}>if</button>{' '}
              <span style={{ color: '#a9b7c6' }}>(</span>
              <button type="button" style={{ color: '#a9b7c6' }} onClick={() => onPick('variable', '#a9b7c6')}>theme</button>
              <span style={{ color: '#a9b7c6' }}>.</span>
              <button type="button" style={{ color: '#a9b7c6' }} onClick={() => onPick('variable', '#a9b7c6')}>background</button>
              <span style={{ color: '#a9b7c6' }}> === </span>
              <button type="button" style={{ color: '#6a8759' }} onClick={() => onPick('string', '#6a8759')}>'darcula'</button>
              <span style={{ color: '#a9b7c6' }}>)</span>{' '}
              <span style={{ color: '#a9b7c6' }}>{'{'}</span>
            </span>
            <span className="line">
              {'  '}<button type="button" style={{ color: '#ffc66d' }} onClick={() => onPick('function', '#ffc66d')}>buildVsix</button>
              <span style={{ color: '#a9b7c6' }}>(</span>
              <button type="button" style={{ color: '#a9b7c6' }} onClick={() => onPick('variable', '#a9b7c6')}>themeId</button>
              <span style={{ color: '#a9b7c6' }}>, </span>
              <button type="button" style={{ color: '#6897bb' }} onClick={() => onPick('number', '#6897bb')}>5000</button>
              <span style={{ color: '#a9b7c6' }}>);</span>
            </span>
          </code>
        </pre>
      </div>
      <div className="hero-swatches">
        {tokens.map((token) => (
          <button
            key={token.label}
            className="swatch"
            onClick={() => onPick(token.role, token.hex)}
            style={{ '--swatch-color': token.hex } as CSSProperties}
            title={`${token.label} ${token.hex}`}
          >
            <span className="dot" />
            <span>{token.label}</span>
            <code>{token.hex}</code>
          </button>
        ))}
      </div>
    </section>
  );
}
