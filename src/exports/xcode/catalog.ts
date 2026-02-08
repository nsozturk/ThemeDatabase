import type { TargetFieldDef } from '@/exports/catalogTypes';
import { resolveFromTokenRole, resolveFromVsCodeColorKeys } from '@/lib/resolveColor';

export const XCODE_FIELDS: TargetFieldDef[] = [
  {
    key: 'DVTSourceTextBackgroundColor',
    group: 'Editor',
    labelKey: 'export.field.editorBackground',
    alpha: 'allowed',
    quickTweak: 'editorBackground',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.background']),
  },
  {
    key: 'DVTSourceTextPlainTextColor',
    group: 'Editor',
    labelKey: 'export.field.editorForeground',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.foreground']),
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
    key: 'DVTSourceTextCommentColor',
    group: 'Syntax',
    labelKey: 'export.field.comment',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'comment'),
  },
  {
    key: 'DVTSourceTextStringColor',
    group: 'Syntax',
    labelKey: 'export.field.string',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'string'),
  },
  {
    key: 'DVTSourceTextKeywordColor',
    group: 'Syntax',
    labelKey: 'export.field.keyword',
    alpha: 'allowed',
    quickTweak: 'accentColor',
    resolve: (source) => resolveFromTokenRole(source, 'keyword'),
  },
  {
    key: 'DVTSourceTextNumberColor',
    group: 'Syntax',
    labelKey: 'export.field.number',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'number'),
  },
  {
    key: 'DVTSourceTextIdentifierColor',
    group: 'Syntax',
    labelKey: 'export.field.variable',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'variable'),
  },
  {
    key: 'DVTSourceTextFunctionColor',
    group: 'Syntax',
    labelKey: 'export.field.function',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'function'),
  },
  {
    key: 'DVTSourceTextTypeColor',
    group: 'Syntax',
    labelKey: 'export.field.type',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'type'),
  },
  {
    key: 'DVTSourceTextOperatorColor',
    group: 'Syntax',
    labelKey: 'export.field.operator',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRole(source, 'operator'),
  },
];

