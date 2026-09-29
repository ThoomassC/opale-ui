import type { GeometryCollection, Topology } from 'topojson-specification';

export interface WorldShape {
  readonly index: number;
  readonly numeric: string | null;
  readonly name: string;
  readonly d: string;
}

export interface ContinentFrame {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export type FramedContinent = 'europe' | 'africa' | 'asia' | 'americas' | 'oceania';

export const WORLD_PATHS_FILE: string;
export const CONTINENT_FRAMES_FILE: string;
export const CONTINENT_DEGREES: Readonly<
  Record<FramedContinent, readonly [number, number, number, number]>
>;
export function buildContinentFrames(): Record<FramedContinent, ContinentFrame>;
export function compactPath(d: string): string;
export function projectWorld(
  topology: Topology<{ countries: GeometryCollection<{ name: string }> }>,
): WorldShape[];
export function buildWorldPaths(
  topology: Topology<{ countries: GeometryCollection<{ name: string }> }>,
): WorldShape[];
export function readTopology(): Topology<{ countries: GeometryCollection<{ name: string }> }>;
