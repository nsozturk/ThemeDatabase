import type { TargetFieldDef } from '@/exports/catalogTypes';
import { resolveFromTokenRole, resolveFromVsCodeColorKeys } from '@/lib/resolveColor';

export const VIM_FIELDS: TargetFieldDef[] = [
  {
    key: 'Normal.bg',
    group: 'Editor',
    labelKey: 'export.field.editorBackground',
    alpha: 'forbidden',
    quickTweak: 'editorBackground',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.background']),
  },
  {
    key: 'Normal.fg',
    group: 'Editor',
    labelKey: 'export.field.editorForeground',
    alpha: 'forbidden',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.foreground']),
  },
  {
    key: 'Cursor.fg',
    group: 'Editor',
    labelKey: 'export.field.caret',
    alpha: 'forbidden',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editorCursor.foreground']),
  },
  {
    key: 'Visual.bg',
    group: 'Editor',
    labelKey: 'export.field.selectionBackground',
    alpha: 'forbidden',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.selectionBackground']),
  },
  {
    key: 'CursorLine.bg',
    group: 'Editor',
    labelKey: 'export.field.currentLine',
    alpha: 'forbidden',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.lineHighlightBackground']),
  },
  {
    key: 'Comment.fg',
    group: 'Syntax',
    labelKey: 'export.field.comment',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'comment'),
  },
  {
    key: 'String.fg',
    group: 'Syntax',
    labelKey: 'export.field.string',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'string'),
  },
  {
    key: 'Number.fg',
    group: 'Syntax',
    labelKey: 'export.field.number',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'number'),
  },
  {
    key: 'Statement.fg',
    group: 'Syntax',
    labelKey: 'export.field.keyword',
    alpha: 'forbidden',
    quickTweak: 'accentColor',
    resolve: (source) => resolveFromTokenRole(source, 'keyword'),
  },
  {
    key: 'Function.fg',
    group: 'Syntax',
    labelKey: 'export.field.function',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'function'),
  },
  {
    key: 'Identifier.fg',
    group: 'Syntax',
    labelKey: 'export.field.variable',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'variable'),
  },
  {
    key: 'Type.fg',
    group: 'Syntax',
    labelKey: 'export.field.type',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'type'),
  },
  {
    key: 'Operator.fg',
    group: 'Syntax',
    labelKey: 'export.field.operator',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'operator'),
  },
];

