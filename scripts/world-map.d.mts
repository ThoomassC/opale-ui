import type { GeometryCollection, Topology } from 'topojson-specification';

export interface WorldShape {
  readonly index: number;
  readonly numeric: string | null;
  readonly name: string;
  readonly d: string;
}

export const WORLD_PATHS_FILE: string;
export function compactPath(d: string): string;
export function projectWorld(
  topology: Topology<{ countries: GeometryCollection<{ name: string }> }>,
): WorldShape[];
export function buildWorldPaths(
  topology: Topology<{ countries: GeometryCollection<{ name: string }> }>,
): WorldShape[];
export function readTopology(): Topology<{ countries: GeometryCollection<{ name: string }> }>;
