import { useMemo, useState, type CSSProperties } from 'react';
import type { SyntaxRole } from '@/types/theme';

type PickableRole = SyntaxRole | 'background';

interface HeroCodePickerProps {
  onPick: (role: PickableRole, hex: string) => void;
}

const darculaPalette: Record<PickableRole, string> = {
  background: '#2b2d30',
  comment: '#808080',
  string: '#6a8759',
  keyword: '#cc7832',
  function: '#ffc66d',
  variable: '#a9b7c6',
  number: '#6897bb',
  type: '#bbb529',
  operator: '#9876aa',
};

interface SnippetToken {
  text: string;
  role?: PickableRole;
}

interface SnippetLanguage {
  id: string;
  label: string;
  lines: SnippetToken[][];
  swatches: Array<{ role: PickableRole; label: string; code: string }>;
}

const snippets: SnippetLanguage[] = [
  {
    id: 'typescript',
    label: 'TypeScript',
    lines: [
      [
        { text: 'const', role: 'keyword' }, { text: ' ' }, { text: 'dataset', role: 'variable' }, { text: ' ' },
        { text: '=', role: 'operator' }, { text: ' ' }, { text: 'loadShards', role: 'function' }, { text: '();' },
      ],
      [{ text: '// click token colors to filter themes', role: 'comment' }],
      [
        { text: 'if', role: 'keyword' }, { text: ' (theme.background === ' }, { text: "'darcula'", role: 'string' }, { text: ') {' },
      ],
      [
        { text: '  ' }, { text: 'buildVsix', role: 'function' }, { text: '(' }, { text: 'themeId', role: 'variable' },
        { text: ', ' }, { text: '5000', role: 'number' }, { text: ');' },
      ],
      [{ text: '}' }],
    ],
    swatches: [
      { role: 'background', label: 'Background', code: '#2b2d30' },
      { role: 'keyword', label: 'Keyword', code: 'const' },
      { role: 'function', label: 'Function', code: 'buildVsix' },
      { role: 'string', label: 'String', code: "'darcula'" },
      { role: 'comment', label: 'Comment', code: '// ...' },
      { role: 'number', label: 'Number', code: '5000' },
      { role: 'type', label: 'Type', code: 'ThemeIndexRecord' },
      { role: 'variable', label: 'Variable', code: 'themeId' },
      { role: 'operator', label: 'Operator', code: '=' },
    ],
  },
  {
    id: 'java',
    label: 'Java',
    lines: [
      [{ text: '@', role: 'operator' }, { text: 'RestController', role: 'type' }],
      [
        { text: 'public', role: 'keyword' }, { text: ' ' }, { text: 'class', role: 'keyword' }, { text: ' ' },
        { text: 'ThemeExplorer', role: 'type' }, { text: ' {' },
      ],
      [
        { text: '  @', role: 'operator' }, { text: 'GetMapping', role: 'type' }, { text: '(' }, { text: '"/themes"', role: 'string' }, { text: ')' },
      ],
      [
        { text: '  ' }, { text: 'if', role: 'keyword' }, { text: ' (theme.getBackground().equals(' },
        { text: '"darcula"', role: 'string' }, { text: ')) {' },
      ],
      [
        { text: '    ' }, { text: 'buildVsix', role: 'function' }, { text: '(' }, { text: 'themeId', role: 'variable' },
        { text: ', ' }, { text: '5000', role: 'number' }, { text: ');' },
      ],
      [{ text: '  }' }],
      [{ text: '}' }],
    ],
    swatches: [
      { role: 'background', label: 'Background', code: '#2b2d30' },
      { role: 'keyword', label: 'Keyword', code: 'class' },
      { role: 'type', label: 'Type', code: 'ThemeExplorer' },
      { role: 'operator', label: 'Annotation', code: '@GetMapping' },
      { role: 'string', label: 'String', code: '"darcula"' },
      { role: 'function', label: 'Function', code: 'buildVsix' },
      { role: 'variable', label: 'Variable', code: 'themeId' },
      { role: 'number', label: 'Number', code: '5000' },
    ],
  },
  {
    id: 'python',
    label: 'Python',
    lines: [
      [{ text: 'dataset', role: 'variable' }, { text: ' ' }, { text: '=', role: 'operator' }, { text: ' ' }, { text: 'load_shards', role: 'function' }, { text: '()' }],
      [{ text: '# click token colors to filter themes', role: 'comment' }],
      [
        { text: 'if', role: 'keyword' }, { text: ' theme["background"] == ' }, { text: '"darcula"', role: 'string' }, { text: ':' },
      ],
      [
        { text: '    ' }, { text: 'build_vsix', role: 'function' }, { text: '(' }, { text: 'theme_id', role: 'variable' },
        { text: ', ' }, { text: '5000', role: 'number' }, { text: ')' },
      ],
    ],
    swatches: [
      { role: 'background', label: 'Background', code: '#2b2d30' },
      { role: 'keyword', label: 'Keyword', code: 'if' },
      { role: 'function', label: 'Function', code: 'build_vsix' },
      { role: 'comment', label: 'Comment', code: '# ...' },
      { role: 'string', label: 'String', code: '"darcula"' },
      { role: 'variable', label: 'Variable', code: 'theme_id' },
      { role: 'number', label: 'Number', code: '5000' },
      { role: 'operator', label: 'Operator', code: '==' },
    ],
  },
];

export function HeroCodePicker({ onPick }: HeroCodePickerProps) {
  const [languageId, setLanguageId] = useState(snippets[0]?.id ?? 'typescript');

  const activeSnippet = useMemo(
    () => snippets.find((item) => item.id === languageId) ?? snippets[0],
    [languageId],
  );

  if (!activeSnippet) {
    return null;
  }

  return (
    <section className="hero-picker" aria-label="Interactive Darcula code preview">
      <div className="hero-header">
        <div className="hero-header-copy">
          <h1>Global Theme Database</h1>
          <p>Kod içindeki herhangi bir rengi seç ve tüm tema havuzunda filtrele.</p>
        </div>
        <label className="hero-language">
          <span>Örnek Programlama Dili</span>
          <select
            value={activeSnippet.id}
            onChange={(event) => setLanguageId(event.target.value)}
          >
            {snippets.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="hero-code-wrap" role="group" aria-label="Color pickable code sample">
        <pre>
          <code>
            {activeSnippet.lines.map((line, lineIndex) => (
              <span key={`${activeSnippet.id}-${lineIndex}`} className="line">
                {line.map((token, tokenIndex) => {
                  if (token.role) {
                    const role = token.role;
                    return (
                      <button
                        key={`${activeSnippet.id}-${lineIndex}-${tokenIndex}`}
                        type="button"
                        style={{ color: darculaPalette[role] }}
                        onClick={() => onPick(role, darculaPalette[role])}
                      >
                        {token.text}
                      </button>
                    );
                  }

                  return (
                    <span key={`${activeSnippet.id}-${lineIndex}-${tokenIndex}`} style={{ color: darculaPalette.variable }}>
                      {token.text}
                    </span>
                  );
                })}
              </span>
            ))}
          </code>
        </pre>
      </div>
      <div className="hero-swatches">
        {activeSnippet.swatches.map((token) => (
          <button
            key={`${activeSnippet.id}-${token.label}`}
            className="swatch"
            onClick={() => onPick(token.role, darculaPalette[token.role])}
            style={{ '--swatch-color': darculaPalette[token.role] } as CSSProperties}
            title={`${token.label} ${darculaPalette[token.role]}`}
          >
            <span className="dot" />
            <span>{token.label}</span>
            <code>{darculaPalette[token.role]}</code>
          </button>
        ))}
      </div>
    </section>
  );
}
