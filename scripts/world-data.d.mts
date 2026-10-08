export type Position = readonly [number, number];
/** `[ouest, sud, est, nord]`, en degrés. */
export type Box = readonly [number, number, number, number];
/** `[origine en longitude, origine en latitude, pas]`, en degrés. */
export type Quantization = readonly [number, number, number];

export interface NaturalEarthSource {
  readonly scale: '110m' | '50m' | '10m';
  readonly theme: 'cultural' | 'physical';
  readonly name: string;
  readonly url: string;
  readonly sha256: string;
}

export interface FileSize {
  /** Relatif à `public/world-map/v1/` : `110m.json`, `10m/18_4.json`… */
  readonly name: string;
  readonly raw: number;
  readonly gzip: number;
}

export const NATURAL_EARTH_VERSION: string;
export const OUTPUT_DIR: string;
export const CACHE_DIR: string;
export const TILE_DEGREES: 10;
export const FILL_MARGIN: number;
export const BUDGETS: {
  readonly '110m': { readonly raw: number; readonly gzip: number };
  readonly '50m': { readonly raw: number; readonly gzip: number };
  readonly tile: number;
  readonly total10m: number;
};
export const SOURCES: readonly NaturalEarthSource[];

export function sha256(data: Uint8Array): string;
export function quantize(
  coords: readonly Position[],
  q: Quantization,
  closed: boolean,
): number[] | null;
export function clipRing(ring: readonly Position[], box: Box): Position[];
export function clipLine(line: readonly Position[], box: Box): Position[][];
export function tileKey(col: number, row: number): string;
export function tileBox(col: number, row: number): [number, number, number, number];
export function tilesCovering(box: Box): [number, number][];
export function checkBudgets(files: readonly FileSize[]): string[];
export function verifiedArchive(source: NaturalEarthSource, cacheDir?: string): Promise<string>;
export function buildWorldData(): Promise<FileSize[]>;
