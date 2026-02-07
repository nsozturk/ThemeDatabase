import { useMemo, useState, type CSSProperties } from 'react';
import { useI18n } from '@/i18n';
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

const roleOrder: PickableRole[] = [
  'background',
  'keyword',
  'function',
  'string',
  'comment',
  'number',
  'variable',
  'operator',
];

const roleLabels: Record<PickableRole, string> = {
  background: 'Background',
  keyword: 'Keyword',
  function: 'Function',
  string: 'String',
  comment: 'Comment',
  number: 'Number',
  type: 'Type',
  variable: 'Variable',
  operator: 'Operator',
};

interface SnippetToken {
  text: string;
  role?: PickableRole;
}

interface SnippetLanguage {
  id: string;
  label: string;
  lines: SnippetToken[][];
}

interface SwatchToken {
  role: PickableRole;
  label: string;
  sample: string;
}

function t(text: string, role?: PickableRole): SnippetToken {
  return role ? { text, role } : { text };
}

const fallbackSampleByRole: Record<PickableRole, string> = {
  background: '#2b2d30',
  keyword: 'const',
  function: 'loadThemeShards',
  string: '"darcula"',
  comment: '// Build VSIX for darcula-compatible themes',
  number: '5000',
  variable: 'dataset',
  operator: '=',
  type: 'ThemeRecord',
};

const sampleFileByLanguage: Record<string, string> = {
  javascript: 'index.js',
  typescript: 'index.ts',
  python: 'main.py',
  java: 'Main.java',
  csharp: 'Program.cs',
  cpp: 'main.cpp',
  c: 'main.c',
  go: 'main.go',
  rust: 'main.rs',
  php: 'index.php',
  ruby: 'main.rb',
  swift: 'main.swift',
  kotlin: 'Main.kt',
  dart: 'main.dart',
  scala: 'Main.scala',
  r: 'main.R',
  sql: 'query.sql',
  bash: 'main.sh',
  powershell: 'main.ps1',
  lua: 'main.lua',
};

function compactSample(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function displaySample(role: PickableRole, sample: string): string {
  if (role === 'comment' && sample.length > 42) {
    return `${sample.slice(0, 39)}...`;
  }
  return sample;
}

function deriveSwatches(lines: SnippetToken[][]): SwatchToken[] {
  const firstByRole = new Map<PickableRole, string>();

  for (const line of lines) {
    for (const token of line) {
      if (!token.role || token.role === 'background') {
        continue;
      }
      if (!firstByRole.has(token.role)) {
        const compact = compactSample(token.text);
        if (compact) {
          firstByRole.set(token.role, compact);
        }
      }
    }
  }

  return roleOrder
    .map((role) => ({
      role,
      label: roleLabels[role],
      sample: role === 'background'
        ? darculaPalette.background
        : (firstByRole.get(role) ?? fallbackSampleByRole[role]),
    }));
}

const snippets: SnippetLanguage[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    lines: [
      [t('// Build VSIX for darcula-compatible themes', 'comment')],
      [t('const', 'keyword'), t(' dataset', 'variable'), t(' = ', 'operator'), t('await', 'keyword'), t(' loadThemeShards', 'function'), t('();')],
      [t('const', 'keyword'), t(' pickedColor', 'variable'), t(' = ', 'operator'), t('readPickedColor', 'function'), t('(tokenRole);')],
      [t('const', 'keyword'), t(' filteredThemes', 'variable'), t(' = ', 'operator'), t('dataset', 'variable'), t('.filter((theme) => matchesThemeColor(theme, pickedColor));')],
      [t('if', 'keyword'), t(' (filteredThemes.some((theme) => theme.background === ', 'operator'), t('"darcula"', 'string'), t(')) {', 'operator')],
      [t('  await', 'keyword'), t(' buildVsix', 'function'), t('(filteredThemes[0].id, ', 'operator'), t('5000', 'number'), t(');')],
      [t('}')],
    ],
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    lines: [
      [t('// Type-safe pipeline for VSIX generation', 'comment')],
      [t('type', 'keyword'), t(' ThemeRecord', 'type'), t(' = { id: string; background: string; };')],
      [t('const', 'keyword'), t(' dataset', 'variable'), t(': ThemeRecord[] = ', 'operator'), t('await', 'keyword'), t(' loadThemeShards', 'function'), t('();')],
      [t('const', 'keyword'), t(' pickedColor', 'variable'), t(': string = ', 'operator'), t('readPickedColor', 'function'), t('(tokenRole);')],
      [t('const', 'keyword'), t(' filteredThemes', 'variable'), t(' = ', 'operator'), t('dataset', 'variable'), t('.filter((theme) => matchesThemeColor(theme, pickedColor));')],
      [t('if', 'keyword'), t(' (filteredThemes.some((theme) => theme.background === ', 'operator'), t('"darcula"', 'string'), t(')) {', 'operator')],
      [t('  await', 'keyword'), t(' buildVsix', 'function'), t('(filteredThemes[0].id, ', 'operator'), t('5000', 'number'), t(');')],
      [t('}')],
    ],
  },
  {
    id: 'python',
    label: 'Python',
    lines: [
      [t('# Python pipeline for VSIX-ready theme filtering', 'comment')],
      [t('@', 'operator'), t('dataclass', 'type')],
      [t('class', 'keyword'), t(' ThemeRecord', 'type'), t(':')],
      [t('dataset', 'variable'), t(' = ', 'operator'), t('await', 'keyword'), t(' load_theme_shards', 'function'), t('()')],
      [t('picked_color', 'variable'), t(' = ', 'operator'), t('read_picked_color', 'function'), t('(token_role)')],
      [t('filtered_themes', 'variable'), t(' = [theme for theme in dataset if matches_theme_color(theme, picked_color)]')],
      [t('if', 'keyword'), t(' any(theme["background"] == ', 'operator'), t('"darcula"', 'string'), t(' for theme in filtered_themes):')],
      [t('    await', 'keyword'), t(' build_vsix', 'function'), t('(filtered_themes[0]["id"], ', 'operator'), t('5000', 'number'), t(')')],
    ],
  },
  {
    id: 'java',
    label: 'Java',
    lines: [
      [t('// Java service pipeline for theme export', 'comment')],
      [t('@', 'operator'), t('Service', 'type')],
      [t('public', 'keyword'), t(' final class', 'keyword'), t(' ThemePipeline', 'type'), t(' {')],
      [t('  var', 'keyword'), t(' dataset', 'variable'), t(' = ', 'operator'), t('loadThemeShards', 'function'), t('();')],
      [t('  String', 'type'), t(' pickedColor', 'variable'), t(' = ', 'operator'), t('readPickedColor', 'function'), t('(tokenRole);')],
      [t('  List<ThemeRecord>', 'type'), t(' filteredThemes', 'variable'), t(' = dataset.stream().filter(theme -> matchesThemeColor(theme, pickedColor)).toList();')],
      [t('  if', 'keyword'), t(' (filteredThemes.stream().anyMatch(theme -> ', 'operator'), t('"darcula"', 'string'), t('.equals(theme.background()))) {')],
      [t('    ', 'operator'), t('buildVsix', 'function'), t('(filteredThemes.get(0).id(), ', 'operator'), t('5000', 'number'), t(');')],
      [t('  }')],
      [t('}')],
    ],
  },
  {
    id: 'csharp',
    label: 'C#',
    lines: [
      [t('// C# async pipeline for VSIX build', 'comment')],
      [t('[', 'operator'), t('ApiController', 'type'), t(']')],
      [t('public', 'keyword'), t(' sealed class', 'keyword'), t(' ThemePipeline', 'type'), t(' {')],
      [t('  var', 'keyword'), t(' dataset', 'variable'), t(' = await ', 'operator'), t('LoadThemeShardsAsync', 'function'), t('();')],
      [t('  var', 'keyword'), t(' pickedColor', 'variable'), t(' = ', 'operator'), t('ReadPickedColor', 'function'), t('(tokenRole);')],
      [t('  var', 'keyword'), t(' filteredThemes', 'variable'), t(' = dataset.Where(theme => ', 'operator'), t('MatchesThemeColor', 'function'), t('(theme, pickedColor)).ToList();')],
      [t('  if', 'keyword'), t(' (filteredThemes.Any(theme => theme.Background == ', 'operator'), t('"darcula"', 'string'), t(')) {')],
      [t('    await ', 'operator'), t('BuildVsixAsync', 'function'), t('(filteredThemes[0].Id, ', 'operator'), t('5000', 'number'), t(');')],
      [t('  }')],
      [t('}')],
    ],
  },
  {
    id: 'cpp',
    label: 'C++',
    lines: [
      [t('// C++ pipeline with struct and STL', 'comment')],
      [t('struct', 'keyword'), t(' ThemeRecord', 'type'), t(' { std::string id; std::string background; };')],
      [t('auto', 'keyword'), t(' dataset', 'variable'), t(' = ', 'operator'), t('loadThemeShards', 'function'), t('();')],
      [t('auto', 'keyword'), t(' pickedColor', 'variable'), t(' = ', 'operator'), t('readPickedColor', 'function'), t('(tokenRole);')],
      [t('auto', 'keyword'), t(' filteredThemes', 'variable'), t(' = ', 'operator'), t('filterThemesByColor', 'function'), t('(dataset, pickedColor);')],
      [t('if', 'keyword'), t(' (std::any_of(filteredThemes.begin(), filteredThemes.end(), [](const ThemeRecord& theme) { return theme.background == ', 'operator'), t('"darcula"', 'string'), t('; })) {')],
      [t('  ', 'operator'), t('buildVsix', 'function'), t('(filteredThemes.front().id, ', 'operator'), t('5000', 'number'), t(');')],
      [t('}')],
    ],
  },
  {
    id: 'c',
    label: 'C',
    lines: [
      [t('/* C pipeline with explicit memory layout */', 'comment')],
      [t('typedef', 'keyword'), t(' struct', 'keyword'), t(' ThemeRecord', 'type'), t(' { char id[128]; char background[32]; } ThemeRecord;')],
      [t('ThemeRecord*', 'type'), t(' dataset', 'variable'), t(' = ', 'operator'), t('load_theme_shards', 'function'), t('(&count);')],
      [t('char*', 'type'), t(' picked_color', 'variable'), t(' = ', 'operator'), t('read_picked_color', 'function'), t('(token_role);')],
      [t('ThemeRecord*', 'type'), t(' filtered_themes', 'variable'), t(' = ', 'operator'), t('filter_themes_by_color', 'function'), t('(dataset, count, picked_color, &filtered_count);')],
      [t('if', 'keyword'), t(' (filtered_count > ', 'operator'), t('0', 'number'), t(' && strcmp(filtered_themes[0].background, ', 'operator'), t('"darcula"', 'string'), t(') == 0) {')],
      [t('  ', 'operator'), t('build_vsix', 'function'), t('(filtered_themes[0].id, ', 'operator'), t('5000', 'number'), t(');')],
      [t('}')],
    ],
  },
  {
    id: 'go',
    label: 'Go',
    lines: [
      [t('// Go pipeline with struct + short variable syntax', 'comment')],
      [t('type', 'keyword'), t(' ThemeRecord', 'type'), t(' struct { ID string; Background string }')],
      [t('dataset', 'variable'), t(', err := ', 'operator'), t('loadThemeShards', 'function'), t('()')],
      [t('pickedColor', 'variable'), t(' := ', 'operator'), t('readPickedColor', 'function'), t('(tokenRole)')],
      [t('filteredThemes', 'variable'), t(' := ', 'operator'), t('filterThemesByColor', 'function'), t('(dataset, pickedColor)')],
      [t('if', 'keyword'), t(' hasBackground(filteredThemes, ', 'operator'), t('"darcula"', 'string'), t(') {')],
      [t('  ', 'operator'), t('buildVsix', 'function'), t('(filteredThemes[0].ID, ', 'operator'), t('5000', 'number'), t(')')],
      [t('}')],
    ],
  },
  {
    id: 'rust',
    label: 'Rust',
    lines: [
      [t('// Rust pipeline with iterator-based filtering', 'comment')],
      [t('#[', 'operator'), t('derive(Debug, Clone)', 'type'), t(']')],
      [t('struct', 'keyword'), t(' ThemeRecord', 'type'), t(' { id: String, background: String }')],
      [t('let', 'keyword'), t(' dataset', 'variable'), t(': Vec<ThemeRecord> = ', 'operator'), t('load_theme_shards', 'function'), t('().await?;')],
      [t('let', 'keyword'), t(' picked_color', 'variable'), t(' = ', 'operator'), t('read_picked_color', 'function'), t('(token_role);')],
      [t('let', 'keyword'), t(' filtered_themes', 'variable'), t(': Vec<ThemeRecord> = dataset.into_iter().filter(|theme| matches_theme_color(theme, &picked_color)).collect();')],
      [t('if', 'keyword'), t(' filtered_themes.iter().any(|theme| theme.background == ', 'operator'), t('"darcula"', 'string'), t(') {')],
      [t('  ', 'operator'), t('build_vsix', 'function'), t('(&filtered_themes[0].id, ', 'operator'), t('5000', 'number'), t(').await?;')],
      [t('}')],
    ],
  },
  {
    id: 'php',
    label: 'PHP',
    lines: [
      [t('// PHP pipeline for extension package generation', 'comment')],
      [t('#[', 'operator'), t("Route('/themes')", 'type'), t(']')],
      [t('$dataset', 'variable'), t(' = ', 'operator'), t('loadThemeShards', 'function'), t('();')],
      [t('$pickedColor', 'variable'), t(' = ', 'operator'), t('readPickedColor', 'function'), t('($tokenRole);')],
      [t('$filteredThemes', 'variable'), t(' = array_values(array_filter($dataset, fn($theme) => ', 'operator'), t('matchesThemeColor', 'function'), t('($theme, $pickedColor)));')],
      [t('if', 'keyword'), t(' (count($filteredThemes) > ', 'operator'), t('0', 'number'), t(' && $filteredThemes[0]["background"] === ', 'operator'), t('"darcula"', 'string'), t(') {')],
      [t('  ', 'operator'), t('buildVsix', 'function'), t('($filteredThemes[0]["id"], ', 'operator'), t('5000', 'number'), t(');')],
      [t('}')],
    ],
  },
  {
    id: 'ruby',
    label: 'Ruby',
    lines: [
      [t('# Ruby pipeline for ThemeDatabase', 'comment')],
      [t('class', 'keyword'), t(' ThemePipeline', 'type')],
      [t('  '), t('dataset', 'variable'), t(' = ', 'operator'), t('load_theme_shards', 'function')],
      [t('  '), t('picked_color', 'variable'), t(' = ', 'operator'), t('read_picked_color', 'function'), t('(token_role)')],
      [t('  '), t('filtered_themes', 'variable'), t(' = dataset.select { |theme| ', 'operator'), t('matches_theme_color', 'function'), t('(theme, picked_color) }')],
      [t('  '), t('if', 'keyword'), t(' filtered_themes.any? { |theme| theme[:background] == ', 'operator'), t('"darcula"', 'string'), t(' }')],
      [t('    '), t('build_vsix', 'function'), t('(filtered_themes.first[:id], ', 'operator'), t('5000', 'number'), t(')')],
      [t('  end', 'keyword')],
      [t('end', 'keyword')],
    ],
  },
  {
    id: 'swift',
    label: 'Swift',
    lines: [
      [t('// Swift pipeline with async/await export flow', 'comment')],
      [t('@', 'operator'), t('MainActor', 'type')],
      [t('struct', 'keyword'), t(' ThemePipeline', 'type'), t(' {')],
      [t('  let', 'keyword'), t(' dataset', 'variable'), t(' = try await ', 'operator'), t('loadThemeShards', 'function'), t('()')],
      [t('  let', 'keyword'), t(' pickedColor', 'variable'), t(' = ', 'operator'), t('readPickedColor', 'function'), t('(tokenRole)')],
      [t('  let', 'keyword'), t(' filteredThemes', 'variable'), t(' = dataset.filter { theme in ', 'operator'), t('matchesThemeColor', 'function'), t('(theme: theme, pickedColor: pickedColor) }')],
      [t('  if', 'keyword'), t(' let firstDarcula = filteredThemes.first(where: { $0.background == ', 'operator'), t('"darcula"', 'string'), t(' }) {')],
      [t('    try await ', 'operator'), t('buildVsix', 'function'), t('(themeId: firstDarcula.id, exactCap: ', 'operator'), t('5000', 'number'), t(')')],
      [t('  }')],
      [t('}')],
    ],
  },
  {
    id: 'kotlin',
    label: 'Kotlin',
    lines: [
      [t('// Kotlin data-class pipeline for VSIX export', 'comment')],
      [t('@', 'operator'), t('Serializable', 'type')],
      [t('data class', 'keyword'), t(' ThemeRecord', 'type'), t('(val id: String, val background: String)')],
      [t('val', 'keyword'), t(' dataset', 'variable'), t(' = ', 'operator'), t('loadThemeShards', 'function'), t('()')],
      [t('val', 'keyword'), t(' pickedColor', 'variable'), t(' = ', 'operator'), t('readPickedColor', 'function'), t('(tokenRole)')],
      [t('val', 'keyword'), t(' filteredThemes', 'variable'), t(' = dataset.filter { theme -> ', 'operator'), t('matchesThemeColor', 'function'), t('(theme, pickedColor) }')],
      [t('if', 'keyword'), t(' (filteredThemes.any { it.background == ', 'operator'), t('"darcula"', 'string'), t(' }) {')],
      [t('  ', 'operator'), t('buildVsix', 'function'), t('(filteredThemes.first().id, ', 'operator'), t('5000', 'number'), t(')')],
      [t('}')],
    ],
  },
  {
    id: 'dart',
    label: 'Dart',
    lines: [
      [t('// Dart pipeline for code-theme package build', 'comment')],
      [t('@', 'operator'), t('immutable', 'type')],
      [t('class', 'keyword'), t(' ThemeRecord', 'type'), t(' { const ThemeRecord(this.id, this.background); }')],
      [t('final', 'keyword'), t(' dataset', 'variable'), t(' = await ', 'operator'), t('loadThemeShards', 'function'), t('();')],
      [t('final', 'keyword'), t(' pickedColor', 'variable'), t(' = ', 'operator'), t('readPickedColor', 'function'), t('(tokenRole);')],
      [t('final', 'keyword'), t(' filteredThemes', 'variable'), t(' = dataset.where((theme) => ', 'operator'), t('matchesThemeColor', 'function'), t('(theme, pickedColor)).toList();')],
      [t('if', 'keyword'), t(' (filteredThemes.any((theme) => theme.background == ', 'operator'), t('"darcula"', 'string'), t(')) {')],
      [t('  await ', 'operator'), t('buildVsix', 'function'), t('(filteredThemes.first.id, ', 'operator'), t('5000', 'number'), t(');')],
      [t('}')],
    ],
  },
  {
    id: 'scala',
    label: 'Scala',
    lines: [
      [t('// Scala functional pipeline for theme filtering', 'comment')],
      [t('case class', 'keyword'), t(' ThemeRecord', 'type'), t('(id: String, background: String)')],
      [t('val', 'keyword'), t(' dataset', 'variable'), t(' = ', 'operator'), t('loadThemeShards', 'function'), t('()')],
      [t('val', 'keyword'), t(' pickedColor', 'variable'), t(' = ', 'operator'), t('readPickedColor', 'function'), t('(tokenRole)')],
      [t('val', 'keyword'), t(' filteredThemes', 'variable'), t(' = dataset.filter(theme => ', 'operator'), t('matchesThemeColor', 'function'), t('(theme, pickedColor))')],
      [t('if', 'keyword'), t(' (filteredThemes.exists(_.background == ', 'operator'), t('"darcula"', 'string'), t(')) {')],
      [t('  ', 'operator'), t('buildVsix', 'function'), t('(filteredThemes.head.id, ', 'operator'), t('5000', 'number'), t(')')],
      [t('}')],
    ],
  },
  {
    id: 'r',
    label: 'R',
    lines: [
      [t('# R pipeline for color-based theme discovery', 'comment')],
      [t('dataset', 'variable'), t(' <- ', 'operator'), t('load_theme_shards', 'function'), t('()')],
      [t('picked_color', 'variable'), t(' <- ', 'operator'), t('read_picked_color', 'function'), t('(token_role)')],
      [t('filtered_themes', 'variable'), t(' <- Filter(function(theme) ', 'operator'), t('matches_theme_color', 'function'), t('(theme, picked_color), dataset)')],
      [t('if', 'keyword'), t(' (length(filtered_themes) > ', 'operator'), t('0', 'number'), t(' && filtered_themes[[1]]$background == ', 'operator'), t('"darcula"', 'string'), t(') {')],
      [t('  ', 'operator'), t('build_vsix', 'function'), t('(filtered_themes[[1]]$id, ', 'operator'), t('5000', 'number'), t(')')],
      [t('}')],
    ],
  },
  {
    id: 'sql',
    label: 'SQL',
    lines: [
      [t('-- SQL pipeline that mirrors the same filtering flow', 'comment')],
      [t('WITH', 'keyword'), t(' filtered_themes', 'variable'), t(' AS (')],
      [t('  SELECT', 'keyword'), t(' id, background', 'variable'), t(' FROM', 'keyword'), t(' theme_index', 'type'), t(' WHERE', 'keyword'), t(' matches_theme_color', 'function'), t('(syntax_summary, ', 'operator'), t("'#cc7832'", 'string'), t('))')],
      [t('SELECT', 'keyword'), t(' build_vsix', 'function'), t('(id, ', 'operator'), t('5000', 'number'), t(')', 'operator')],
      [t('FROM', 'keyword'), t(' filtered_themes', 'variable')],
      [t('WHERE', 'keyword'), t(' background = ', 'operator'), t("'darcula'", 'string')],
      [t('LIMIT', 'keyword'), t(' 1', 'number'), t(';')],
    ],
  },
  {
    id: 'bash',
    label: 'Bash',
    lines: [
      [t('#!/usr/bin/env bash', 'comment')],
      [t('dataset', 'variable'), t('="$('), t('load_theme_shards', 'function'), t(')"')],
      [t('picked_color', 'variable'), t('="$('), t('read_picked_color', 'function'), t(' "$token_role")"')],
      [t('filtered_themes', 'variable'), t('="$('), t('filter_themes_by_color', 'function'), t(' "$dataset" "$picked_color")"')],
      [t('if', 'keyword'), t(' '), t('has_background', 'function'), t(' "$filtered_themes" ', 'operator'), t('"darcula"', 'string'), t('; then')],
      [t('  ', 'operator'), t('build_vsix', 'function'), t(' "$('), t('first_theme_id', 'function'), t(' "$filtered_themes")" ', 'operator'), t('5000', 'number')],
      [t('fi', 'keyword')],
    ],
  },
  {
    id: 'powershell',
    label: 'PowerShell',
    lines: [
      [t('# PowerShell pipeline for VSIX generation', 'comment')],
      [t('$dataset', 'variable'), t(' = ', 'operator'), t('Load-ThemeShards', 'function')],
      [t('$pickedColor', 'variable'), t(' = ', 'operator'), t('Read-PickedColor', 'function'), t(' -TokenRole $TokenRole')],
      [t('$filteredThemes', 'variable'), t(' = $dataset | Where-Object { ', 'operator'), t('Test-ThemeColor', 'function'), t(' -Theme $_ -Color $pickedColor }')],
      [t('if', 'keyword'), t(' ($filteredThemes | Where-Object { $_.Background -eq ', 'operator'), t('"darcula"', 'string'), t(' }) {')],
      [t('  ', 'operator'), t('Build-Vsix', 'function'), t(' -ThemeId $filteredThemes[0].Id -ExactCap ', 'operator'), t('5000', 'number')],
      [t('}')],
    ],
  },
  {
    id: 'lua',
    label: 'Lua',
    lines: [
      [t('-- Lua pipeline used by editor plugins', 'comment')],
      [t('local', 'keyword'), t(' dataset', 'variable'), t(' = ', 'operator'), t('load_theme_shards', 'function'), t('()')],
      [t('local', 'keyword'), t(' picked_color', 'variable'), t(' = ', 'operator'), t('read_picked_color', 'function'), t('(token_role)')],
      [t('local', 'keyword'), t(' filtered_themes', 'variable'), t(' = ', 'operator'), t('filter_themes_by_color', 'function'), t('(dataset, picked_color)')],
      [t('if', 'keyword'), t(' '), t('has_background', 'function'), t('(filtered_themes, ', 'operator'), t('"darcula"', 'string'), t(') then')],
      [t('  ', 'operator'), t('build_vsix', 'function'), t('(filtered_themes[1].id, ', 'operator'), t('5000', 'number'), t(')')],
      [t('end', 'keyword')],
    ],
  },
];

export function HeroCodePicker({ onPick }: HeroCodePickerProps) {
  const { t: i18n } = useI18n();
  const [languageId, setLanguageId] = useState(snippets[0]?.id ?? 'javascript');

  const activeSnippet = useMemo(
    () => snippets.find((item) => item.id === languageId) ?? snippets[0],
    [languageId],
  );

  const swatches = useMemo(
    () => (activeSnippet ? deriveSwatches(activeSnippet.lines) : []),
    [activeSnippet],
  );

  if (!activeSnippet) {
    return null;
  }

  const activeFileName = sampleFileByLanguage[activeSnippet.id] ?? 'main.txt';

  return (
    <section className="hero-picker" aria-label="Interactive Darcula code preview">
      <div className="hero-top">
        <div className="hero-copy">
          <h1>{i18n('hero.title')}</h1>
          <p>{i18n('hero.subtitle')}</p>
        </div>
        <label className="hero-language">
          <span>{i18n('hero.language')}</span>
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
      <div className="hero-editor" role="group" aria-label="Color pickable code sample">
        <div className="hero-editor-head">
          <div className="hero-editor-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="hero-editor-file">{activeFileName}</span>
        </div>
        <div className="hero-editor-body">
          <pre>
            <code>
              {activeSnippet.lines.map((line, lineIndex) => (
                <span key={`${activeSnippet.id}-${lineIndex}`} className="hero-line">
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
      </div>
      <div className="hero-token-grid">
        {swatches.map((token) => (
          <button
            key={`${activeSnippet.id}-${token.role}`}
            className="hero-token-card"
            onClick={() => onPick(token.role, darculaPalette[token.role])}
            style={{ '--chip-color': darculaPalette[token.role] } as CSSProperties}
            title={`${token.label} ${darculaPalette[token.role]}`}
          >
            <span className="hero-token-main">
              <span className="hero-token-dot" />
              <span>{token.label}</span>
            </span>
            <code>{displaySample(token.role, token.sample)}</code>
          </button>
        ))}
      </div>
    </section>
  );
}
