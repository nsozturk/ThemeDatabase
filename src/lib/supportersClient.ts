export type SupportTierId = 'supporter' | 'contributor' | 'sponsor';

export interface SupportTier {
  id: SupportTierId;
  label: string;
  amountUsd: number;
}

export interface SupporterEntry {
  name: string;
  tier: SupportTierId;
  since?: string;
}

export interface SupportersDoc {
  updatedAt: string;
  ctaUrl: string;
  tiers: SupportTier[];
  supporters: SupporterEntry[];
  methods?: Array<{ id: string; label: string; url?: string }>;
}

const FALLBACK_URL = 'https://buymeacoffee.com/ns0bj';
let supportersPromise: Promise<SupportersDoc> | null = null;

function isLikelyUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('http');
}

function sanitizeCtaUrl(value: unknown): string {
  if (!isLikelyUrl(value)) return FALLBACK_URL;
  if (value.includes('<') || value.includes('>')) return FALLBACK_URL;
  return value;
}

export function getSupporters(): Promise<SupportersDoc> {
  if (!supportersPromise) {
    const url = `${import.meta.env.BASE_URL}supporters.json`;
    supportersPromise = fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch supporters.json (${res.status})`);
        }
        return (await res.json()) as SupportersDoc;
      })
      .then((doc) => ({
        ...doc,
        ctaUrl: sanitizeCtaUrl(doc.ctaUrl),
      }));
  }
  return supportersPromise;
}
