export type SyntaxRole = 'comment' | 'string' | 'keyword' | 'function' | 'variable' | 'number' | 'type' | 'operator';

export interface SyntaxSummaryItem {
  hex: string;
  category: string;
}

export type SyntaxSummary = Partial<Record<SyntaxRole, SyntaxSummaryItem>>;

export interface ThemeIndexRecord {
  id: string;
  extensionId: string;
  extensionName: string;
  publisher: string;
  themeInternalName: string;
  themeDisplayName: string;
  description: string;
  bg: string;
  badge: string;
  bgCategory: string;
  syntaxSummary: SyntaxSummary;
  previewSvg?: string;
  previewPng?: string;
  marketplaceUrl: string;
  themeUrl: string;
  labVectors: [number, number, number];
}

export interface ThemeDetailRecord {
  id: string;
  description: string;
  tokenPalette: Array<{ role: string; hex: string; category: string }>;
  editorColors: Record<string, string>;
  similarThemeIds: string[];
  license: string | null;
  sourceInfo: {
    extensionId: string;
    extensionName: string;
    publisher: string;
    marketplaceUrl: string;
    themeUrl: string;
    exactAvailable: boolean;
    exactSource: 'extracted' | 'fallback';
  };
}

export interface ThemeIndexManifest {
  generatedAt: string;
  sourceCsv: string;
  shardSize: number;
  totalRecords: number;
  shardCount: number;
  shards: string[];
  themeIdToShard: Record<string, { shard: number; offset: number }>;
}

export interface ThemeDetailManifest {
  generatedAt: string;
  shardSize: number;
  totalRecords: number;
  shardCount: number;
  shards: string[];
  themeIdToShard: Record<string, { shard: number; offset: number }>;
}

export interface VsixPayloadRecord {
  themeId: string;
  mode: 'exact' | 'fallback';
  uiTheme: string;
  themeJson: Record<string, unknown>;
}

export interface VsixManifest {
  generatedAt: string;
  exactCap: number;
  exactCount: number;
  fallbackCount: number;
  exactShardSize: number;
  exactShardCount: number;
  exactShards: string[];
  exactLookup: Record<string, { shard: number; offset: number }>;
}

export interface ThemeFilters {
  q: string;
  bg: string;
  token: SyntaxRole | 'any' | 'background';
  hex: string;
  tolerance: number;
  sort: 'name' | 'publisher' | 'background';
  view: 'grid' | 'list';
}
