import type { TargetFieldDef } from '@/exports/catalogTypes';
import {
  resolveFromTokenRole,
  resolveFromTokenRoleWithFallbacks,
  resolveFromVsCodeColorKeys,
  lightenColor,
} from '@/lib/resolveColor';

// Xcode Font & Color Themes store syntax colors under `DVTSourceTextSyntaxColors` dict using `xcode.syntax.*` keys.
// We represent nested plist keys with `TopLevelKey/NestedKey` to allow the exporter to build nested dicts.
export const XCODE_FIELDS: TargetFieldDef[] = [
  // ─── Editor ────────────────────────────────────────────────────
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

  // ─── Syntax Colors ────────────────────────────────────────────
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
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['function']),
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
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['variable']),
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
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['type']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.attribute',
    group: 'Syntax',
    labelKey: 'export.field.attribute',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['attribute', 'keyword']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.character',
    group: 'Syntax',
    labelKey: 'export.field.character',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['character', 'string']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.preprocessor',
    group: 'Syntax',
    labelKey: 'export.field.preprocessor',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['preprocessor', 'keyword']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.url',
    group: 'Syntax',
    labelKey: 'export.field.url',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['url', 'string']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.mark',
    group: 'Syntax',
    labelKey: 'export.field.mark',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['mark', 'comment']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.class',
    group: 'Syntax',
    labelKey: 'export.field.class',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['class', 'type']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.class.system',
    group: 'Syntax',
    labelKey: 'export.field.classSystem',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['class', 'type']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.constant',
    group: 'Syntax',
    labelKey: 'export.field.constant',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['constant', 'number']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.constant.system',
    group: 'Syntax',
    labelKey: 'export.field.constantSystem',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['constant', 'number']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.macro',
    group: 'Syntax',
    labelKey: 'export.field.macro',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['macro', 'preprocessor', 'keyword']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.identifier.macro.system',
    group: 'Syntax',
    labelKey: 'export.field.macroSystem',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['macro', 'preprocessor', 'keyword']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.declaration.type',
    group: 'Syntax',
    labelKey: 'export.field.declarationType',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['declaration', 'function', 'type']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.declaration.other',
    group: 'Syntax',
    labelKey: 'export.field.declarationOther',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['declaration', 'function']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.regex',
    group: 'Syntax',
    labelKey: 'export.field.regex',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['regex', 'string']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.regex.keyword',
    group: 'Syntax',
    labelKey: 'export.field.regexKeyword',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['regex', 'keyword']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.regex.capture.variable',
    group: 'Syntax',
    labelKey: 'export.field.regexCaptureVar',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['regex', 'variable']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.regex.character.class',
    group: 'Syntax',
    labelKey: 'export.field.regexCharClass',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['regex', 'character', 'constant']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.regex.number',
    group: 'Syntax',
    labelKey: 'export.field.regexNumber',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['regex', 'number']),
  },
  {
    key: 'DVTSourceTextSyntaxColors/xcode.syntax.regex.constant',
    group: 'Syntax',
    labelKey: 'export.field.regexConstant',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['regex', 'constant']),
  },

  // ─── Console Colors ───────────────────────────────────────────
  {
    key: 'DVTConsoleTextColor',
    group: 'Console',
    labelKey: 'export.field.consoleText',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'terminal.foreground', 'editor.foreground',
    ]),
  },
  {
    key: 'DVTConsoleTextBackgroundColor',
    group: 'Console',
    labelKey: 'export.field.consoleBackground',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'terminal.background', 'editor.background',
    ]),
  },
  {
    key: 'DVTConsoleTextInsertionPointColor',
    group: 'Console',
    labelKey: 'export.field.consoleCaret',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'terminalCursor.foreground', 'editorCursor.foreground',
    ]),
  },
  {
    key: 'DVTConsoleTextSelectionColor',
    group: 'Console',
    labelKey: 'export.field.consoleSelection',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'terminal.selectionBackground', 'editor.selectionBackground',
    ]),
  },
  {
    key: 'DVTDebugConsoleTextColor',
    group: 'Console',
    labelKey: 'export.field.debugConsoleText',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'debugConsole.infoForeground', 'terminal.foreground', 'editor.foreground',
    ]),
  },
  {
    key: 'DVTConsoleExectuableOutputTextColor',
    group: 'Console',
    labelKey: 'export.field.consoleExecutable',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'terminal.foreground', 'editor.foreground',
    ]),
  },
  {
    key: 'DVTConsoleExectuableInputTextColor',
    group: 'Console',
    labelKey: 'export.field.consoleInput',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'terminal.foreground', 'editor.foreground',
    ]),
  },

  // ─── Scrollbar Markers ────────────────────────────────────────
  {
    key: 'DVTScrollbarMarkerBreakpointColor',
    group: 'Scrollbar',
    labelKey: 'export.field.scrollBreakpoint',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'debugIcon.breakpointForeground', 'editorOverviewRuler.errorForeground',
    ]),
  },
  {
    key: 'DVTScrollbarMarkerDiffColor',
    group: 'Scrollbar',
    labelKey: 'export.field.scrollDiff',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'editorOverviewRuler.modifiedForeground', 'editorGutter.modifiedBackground',
    ]),
  },
  {
    key: 'DVTScrollbarMarkerDiffConflictColor',
    group: 'Scrollbar',
    labelKey: 'export.field.scrollDiffConflict',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'merge.border', 'editorOverviewRuler.errorForeground',
    ]),
  },
  {
    key: 'DVTScrollbarMarkerErrorColor',
    group: 'Scrollbar',
    labelKey: 'export.field.scrollError',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'editorOverviewRuler.errorForeground', 'editorError.foreground',
    ]),
  },
  {
    key: 'DVTScrollbarMarkerFindResultColor',
    group: 'Scrollbar',
    labelKey: 'export.field.scrollFindResult',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'editorOverviewRuler.findMatchForeground', 'editor.findMatchHighlightBackground',
    ]),
  },
  {
    key: 'DVTScrollbarMarkerInstructionPointerColor',
    group: 'Scrollbar',
    labelKey: 'export.field.scrollInstructionPtr',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'editor.stackFrameHighlightBackground', 'editorCursor.foreground',
    ]),
  },
  {
    key: 'DVTScrollbarMarkerWarningColor',
    group: 'Scrollbar',
    labelKey: 'export.field.scrollWarning',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, [
      'editorOverviewRuler.warningForeground', 'editorWarning.foreground',
    ]),
  },

  // ─── Markup Text Colors ───────────────────────────────────────
  {
    key: 'DVTMarkupTextNormalColor',
    group: 'Markup',
    labelKey: 'export.field.markupNormal',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.foreground']),
  },
  {
    key: 'DVTMarkupTextOtherHeadingColor',
    group: 'Markup',
    labelKey: 'export.field.markupOtherHeading',
    alpha: 'allowed',
    resolve: (source) => {
      const res = resolveFromTokenRoleWithFallbacks(source, ['keyword', 'function']);
      if (res) {
        return { ...res, rgba: lightenColor(res.rgba, 0.15) };
      }
      return resolveFromVsCodeColorKeys(source, ['editor.foreground']);
    },
  },
  {
    key: 'DVTMarkupTextPrimaryHeadingColor',
    group: 'Markup',
    labelKey: 'export.field.markupPrimaryHeading',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['keyword', 'function']),
  },
  {
    key: 'DVTMarkupTextSecondaryHeadingColor',
    group: 'Markup',
    labelKey: 'export.field.markupSecondaryHeading',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['keyword', 'function']),
  },
  {
    key: 'DVTMarkupTextStrongColor',
    group: 'Markup',
    labelKey: 'export.field.markupStrong',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.foreground']),
  },
  {
    key: 'DVTMarkupTextEmphasisColor',
    group: 'Markup',
    labelKey: 'export.field.markupEmphasis',
    alpha: 'allowed',
    resolve: (source) => resolveFromVsCodeColorKeys(source, ['editor.foreground']),
  },
  {
    key: 'DVTMarkupTextCodeColor',
    group: 'Markup',
    labelKey: 'export.field.markupCode',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['string', 'function']),
  },
  {
    key: 'DVTMarkupTextLinkColor',
    group: 'Markup',
    labelKey: 'export.field.markupLink',
    alpha: 'allowed',
    resolve: (source) => resolveFromTokenRoleWithFallbacks(source, ['url', 'string']),
  },
];

