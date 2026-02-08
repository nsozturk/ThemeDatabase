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
  operator: [
    'keyword.operator',
    'punctuation.separator',
    'punctuation.accessor',
  ],
};

