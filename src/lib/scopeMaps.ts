import type { SyntaxRole } from '@/types/theme';

// Strict, versioned mapping: TextMate scopes that best represent each role.
// If a role can't be resolved from theme tokenColors and the detail palette lacks it,
// we treat it as "no-source" and skip for strict exports.
export const ROLE_SCOPES: Record<SyntaxRole, string[]> = {
  comment: [
    'comment',
    'comment.line',
    'comment.block',
    'punctuation.definition.comment',
  ],
  string: [
    'string',
    'string.quoted',
    'string.template',
    'punctuation.definition.string',
  ],
  keyword: [
    'keyword',
    'storage',
    'storage.type',
    'storage.modifier',
    'keyword.control',
  ],
  function: [
    'entity.name.function',
    'support.function',
    'meta.function-call',
  ],
  variable: [
    'variable',
    'variable.other',
    'entity.name.variable',
    'support.variable',
    'identifier',
  ],
  number: [
    'constant.numeric',
    'constant.numeric.integer',
    'constant.numeric.float',
  ],
  type: [
    'entity.name.type',
    'support.type',
    'storage.type',
  ],
  attribute: [
    'entity.other.attribute-name',
    'meta.decorator',
    'support.function.attribute',
    'meta.attribute',
  ],
  character: [
    'constant.character',
    'constant.character.escape',
    'constant.character.numeric',
  ],
  preprocessor: [
    'meta.preprocessor',
    'keyword.control.directive',
    'keyword.control.import',
    'keyword.other.import',
    'entity.name.function.preprocessor',
  ],
  url: [
    'markup.underline.link',
    'string.other.link',
    'meta.link',
  ],
  regex: [
    'string.regexp',
    'constant.regexp',
    'keyword.other.regex',
  ],
  class: [
    'entity.name.type.class',
    'entity.name.class',
    'support.class',
    'entity.other.inherited-class',
  ],
  constant: [
    'constant',
    'constant.language',
    'variable.other.constant',
    'support.constant',
  ],
  macro: [
    'entity.name.function.preprocessor',
    'meta.preprocessor.macro',
    'keyword.control.directive',
  ],
  mark: [
    'comment',
    'punctuation.definition.comment',
  ],
  declaration: [
    'entity.name.function',
    'entity.name.type',
    'entity.name.tag',
  ],
  operator: [
    'keyword.operator',
    'punctuation.separator',
    'punctuation.accessor',
  ],
};

