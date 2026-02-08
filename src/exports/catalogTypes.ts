import type { ExportSource } from '@/lib/exportSource';
import type { ResolvedColor } from '@/lib/resolveColor';

export type AlphaPolicy = 'allowed' | 'forbidden';

export interface TargetFieldDef {
  key: string;
  group: string;
  labelKey: string;
  alpha: AlphaPolicy;
  quickTweak?: 'editorBackground' | 'accentColor';
  resolve: (source: ExportSource) => ResolvedColor | null;
}

