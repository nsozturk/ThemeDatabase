import type { BuiltArtifact } from '@/types/export';
import type { ThemeIndexRecord, VsixPayloadRecord } from '@/types/theme';
import { buildVsixArtifact, type VsixBuildInput } from '@/lib/vsixBuilder';

export async function buildVsCodeVsixArtifact(
  input: VsixBuildInput,
  record: ThemeIndexRecord,
  payload: VsixPayloadRecord,
): Promise<BuiltArtifact> {
  return buildVsixArtifact(input, record, payload);
}

