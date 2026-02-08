import type { ThemeDetailRecord, ThemeIndexRecord, VsixPayloadRecord } from '@/types/theme';

export interface ExportQuickTweaks {
  editorBackground?: string;
  accentColor?: string;
}

export interface ExportSource {
  theme: ThemeIndexRecord;
  payload: VsixPayloadRecord;
  detail: ThemeDetailRecord | null;
  quickTweaks: ExportQuickTweaks;
}

export function buildExportSource(
  theme: ThemeIndexRecord,
  payload: VsixPayloadRecord,
  detail: ThemeDetailRecord | null,
  quickTweaks: ExportQuickTweaks,
): ExportSource {
  return {
    theme,
    payload,
    detail,
    quickTweaks,
  };
}

