export type ExportTarget =
  | 'vscode-vsix'
  | 'jetbrains-plugin'
  | 'jetbrains-icls'
  | 'xcode-dvtcolortheme'
  | 'vim-colorscheme'
  | 'emacs-theme';

export type MappingConfidence = 'exact';

export type ExportExcludedReason = 'no-source' | 'no-mapping';

export interface BuiltArtifact {
  target: ExportTarget;
  filename: string;
  blob: Blob;
  mode: 'exact' | 'fallback';
  meta?: Record<string, string>;
}

export interface ExportFieldValue {
  key: string;
  value: string;
  source: string;
  confidence: MappingConfidence;
}

export interface ExportBuildPlan {
  target: ExportTarget;
  included: ExportFieldValue[];
  excluded: Array<{ key: string; reason: ExportExcludedReason }>;
}

