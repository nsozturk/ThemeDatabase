import type { TargetFieldDef } from '@/exports/catalogTypes';
import { resolveFromTokenRole, resolveFromVsCodeColorKeys } from '@/lib/resolveColor';

// Xcode Font & Color Themes store syntax colors under `DVTSourceTextSyntaxColors` dict using `xcode.syntax.*` keys.
// We represent nested plist keys with `TopLevelKey/NestedKey` to allow the exporter to build nested dicts.
export const XCODE_FIELDS: TargetFieldDef[] = [
  // Editor
  {
    key: 'DVTSourceTextBackground',
    group: 'Editor',
    labelKey: 'export.field.editorBackground',
    alpha: 'allowed',
    quickTweak: 'editorBackground',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.background']),
  },
  {
    key: 'DVTSourceTextInsertionPointColor',
    group: 'Editor',
    labelKey: 'export.field.caret',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editorCursor.foreground']),
  },
  {
    key: 'DVTSourceTextSelectionColor',
    group: 'Editor',
    labelKey: 'export.field.selectionBackground',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.selectionBackground']),
  },
  {
    key: 'DVTSourceTextCurrentLineHighlightColor',
    group: 'Editor',
    labelKey: 'export.field.currentLine',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.lineHighlightBackground']),
  },
  {
    key: 'DVTSourceTextInvisiblesColor',
    group: 'Editor',
    labelKey: 'export.field.invisibles',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editorWhitespace.foreground']),
  },

  // Syntax colors: `DVTSourceTextSyntaxColors` dict
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.plain',
    group: 'Syntax',
    labelKey: 'export.field.editorForeground',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.foreground']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.comment',
    group: 'Syntax',
    labelKey: 'export.field.comment',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'comment'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.comment.doc',
    group: 'Syntax',
    labelKey: 'export.field.commentDoc',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'comment'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.comment.doc.keyword',
    group: 'Syntax',
    labelKey: 'export.field.commentDocKeyword',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'comment'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.string',
    group: 'Syntax',
    labelKey: 'export.field.string',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'string'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.keyword',
    group: 'Syntax',
    labelKey: 'export.field.keyword',
    alpha: 'allowed',
    quickTweak: 'accentColor',
    resolve: (source) => resolveFromTokenRole(source, 'keyword'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.number',
    group: 'Syntax',
    labelKey: 'export.field.number',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'number'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.function',
    group: 'Syntax',
    labelKey: 'export.field.function',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'function'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.function.system',
    group: 'Syntax',
    labelKey: 'export.field.functionSystem',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'function'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.variable',
    group: 'Syntax',
    labelKey: 'export.field.variable',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'variable'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.variable.system',
    group: 'Syntax',
    labelKey: 'export.field.variableSystem',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'variable'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.type',
    group: 'Syntax',
    labelKey: 'export.field.type',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'type'),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.type.system',
    group: 'Syntax',
    labelKey: 'export.field.typeSystem',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'type'),
  },
];

