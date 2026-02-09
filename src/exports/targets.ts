import type { ExportTarget } from '@/types/export';

export interface TargetOption {
  id: ExportTarget;
  labelKey: string;
  fileExtension: string;
}

export const TARGET_OPTIONS: TargetOption[] = [
  { id: 'vscode-vsix', labelKey: 'builder.target.vscode', fileExtension: '.vsix' },
  { id: 'jetbrains-plugin', labelKey: 'builder.target.jetbrainsPlugin', fileExtension: '.zip' },
  { id: 'jetbrains-icls', labelKey: 'builder.target.jetbrainsIcls', fileExtension: '.icls' },
  { id: 'xcode-dvtcolortheme', labelKey: 'builder.target.xcode', fileExtension: '.dvtcolortheme' },
  { id: 'xcode-xccolortheme', labelKey: 'builder.target.xcodeXc', fileExtension: '.xccolortheme' },
  { id: 'vim-colorscheme', labelKey: 'builder.target.vim', fileExtension: '.vim' },
  { id: 'emacs-theme', labelKey: 'builder.target.emacs', fileExtension: '-theme.el' },
];

export function isVsCodeTarget(target: ExportTarget): boolean {
  return target === 'vscode-vsix';
}
