import type { ExportBuildPlan, ExportExcludedReason, ExportFieldValue } from '@/types/export';
import type { ExportQuickTweaks, ExportSource } from '@/lib/exportSource';
import type { AlphaPolicy, TargetFieldDef } from '@/exports/catalogTypes';
import { parseCssColor, rgbaToHexHash } from '@/lib/resolveColor';

export interface PlannedField {
  key: string;
  group: string;
  labelKey: string;
  source: string;
  value: string; // display value (hex or rgba string)
  raw: string;
  overridden: boolean;
  overrideError?: string;
}

export interface PlannedCatalog {
  plan: ExportBuildPlan;
  groups: Record<string, PlannedField[]>;
}

function alphaAllowed(policy: AlphaPolicy, alpha: number): boolean {
  if (policy === 'allowed') return true;
  return alpha >= 0.999;
}

function displayValueFromRaw(raw: string): string {
  const parsed = parseCssColor(raw);
  if (!parsed) return raw;
  if (parsed.a >= 0.999) return rgbaToHexHash(parsed);
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${Number(parsed.a.toFixed(3))})`;
}

function applyOverride(
  def: TargetFieldDef,
  rawOverride: string | undefined,
): { raw: string; overridden: boolean; error?: string } {
  if (!rawOverride) return { raw: '', overridden: false };
  const parsed = parseCssColor(rawOverride);
  if (!parsed) return { raw: rawOverride, overridden: true, error: 'invalid' };
  if (!alphaAllowed(def.alpha, parsed.a)) return { raw: rawOverride, overridden: true, error: 'alpha' };
  return { raw: rawOverride, overridden: true };
}

export function buildStrictExportPlan(
  target: ExportBuildPlan['target'],
  source: ExportSource,
  defs: TargetFieldDef[],
  overrides: Record<string, string | undefined>,
  quickTweaks?: ExportQuickTweaks,
): PlannedCatalog {
  const included: ExportFieldValue[] = [];
  const excluded: Array<{ key: string; reason: ExportExcludedReason }> = [];
  const groups: Record<string, PlannedField[]> = {};

  for (const def of defs) {
    const resolved = def.resolve(source);
    if (!resolved) {
      excluded.push({ key: def.key, reason: 'no-source' });
      continue;
    }

    if (!alphaAllowed(def.alpha, resolved.rgba.a)) {
      excluded.push({ key: def.key, reason: 'no-source' });
      continue;
    }

    let effectiveRaw = resolved.raw;
    let overridden = false;
    let overrideError: string | undefined;

    // Quick tweaks are treated as user overrides, but only apply when the field exists.
    const tweakValue =
      def.quickTweak === 'editorBackground' ? quickTweaks?.editorBackground
        : def.quickTweak === 'accentColor' ? quickTweaks?.accentColor
          : undefined;
    if (tweakValue) {
      const parsed = parseCssColor(tweakValue);
      if (parsed && alphaAllowed(def.alpha, parsed.a)) {
        effectiveRaw = tweakValue;
        overridden = true;
      }
    }

    const userOverride = overrides[def.key];
    if (userOverride) {
      const result = applyOverride(def, userOverride);
      overridden = overridden || result.overridden;
      if (result.error) {
        overrideError = result.error;
      } else if (result.raw) {
        effectiveRaw = result.raw;
      }
    }

    const value = displayValueFromRaw(effectiveRaw);
    included.push({
      key: def.key,
      value,
      source: resolved.source,
      confidence: 'exact',
    });

    const row: PlannedField = {
      key: def.key,
      group: def.group,
      labelKey: def.labelKey,
      source: resolved.source,
      raw: effectiveRaw,
      value,
      overridden,
      overrideError,
    };

    const bucket = groups[def.group] ?? [];
    bucket.push(row);
    groups[def.group] = bucket;
  }

  return {
    plan: { target, included, excluded },
    groups,
  };
}
