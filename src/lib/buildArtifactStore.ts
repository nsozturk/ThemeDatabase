import type { BuiltArtifact } from '@/types/export';

let currentArtifact: BuiltArtifact | null = null;

export function setBuildArtifact(artifact: BuiltArtifact): void {
  currentArtifact = artifact;
}

export function getBuildArtifact(): BuiltArtifact | null {
  return currentArtifact;
}
