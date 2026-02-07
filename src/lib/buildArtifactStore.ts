import type { BuiltVsixArtifact } from '@/lib/vsixBuilder';

let currentArtifact: BuiltVsixArtifact | null = null;

export function setBuildArtifact(artifact: BuiltVsixArtifact): void {
  currentArtifact = artifact;
}

export function getBuildArtifact(): BuiltVsixArtifact | null {
  return currentArtifact;
}
