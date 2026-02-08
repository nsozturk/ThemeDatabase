import type { TargetFieldDef } from '@/exports/catalogTypes';
import { resolveFromTokenRole, resolveFromVsCodeColorKeys } from '@/lib/resolveColor';

export const EMACS_FIELDS: TargetFieldDef[] = [
  {
    key: 'default.bg',
    group: 'Editor',
    labelKey: 'export.field.editorBackground',
    alpha: 'forbidden',
    quickTweak: 'editorBackground',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.background']),
  },
  {
    key: 'default.fg',
    group: 'Editor',
    labelKey: 'export.field.editorForeground',
    alpha: 'forbidden',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.foreground']),
  },
  {
    key: 'cursor.bg',
    group: 'Editor',
    labelKey: 'export.field.caret',
    alpha: 'forbidden',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editorCursor.foreground']),
  },
  {
    key: 'region.bg',
    group: 'Editor',
    labelKey: 'export.field.selectionBackground',
    alpha: 'forbidden',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.selectionBackground']),
  },
  {
    key: 'font-lock-comment-face.fg',
    group: 'Syntax',
    labelKey: 'export.field.comment',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'comment'),
  },
  {
    key: 'font-lock-string-face.fg',
    group: 'Syntax',
    labelKey: 'export.field.string',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'string'),
  },
  {
    key: 'font-lock-keyword-face.fg',
    group: 'Syntax',
    labelKey: 'export.field.keyword',
    alpha: 'forbidden',
    quickTweak: 'accentColor',
    resolve: (source) => resolveFromTokenRole(source, 'keyword'),
  },
  {
    key: 'font-lock-function-name-face.fg',
    group: 'Syntax',
    labelKey: 'export.field.function',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'function'),
  },
  {
    key: 'font-lock-variable-name-face.fg',
    group: 'Syntax',
    labelKey: 'export.field.variable',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'variable'),
  },
  {
    key: 'font-lock-type-face.fg',
    group: 'Syntax',
    labelKey: 'export.field.type',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'type'),
  },
  {
    key: 'font-lock-constant-face.fg',
    group: 'Syntax',
    labelKey: 'export.field.number',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'number'),
  },
  {
    key: 'font-lock-builtin-face.fg',
    group: 'Syntax',
    labelKey: 'export.field.operator',
    alpha: 'forbidden',
    resolve: (source) => resolveFromTokenRole(source, 'operator'),
  },
];

