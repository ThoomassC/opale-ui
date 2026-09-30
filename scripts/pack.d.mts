export const PUBLISHED_FIELDS: readonly string[];
export const DROPPED_FIELDS: readonly string[];
export function packManifest<T extends Record<string, unknown>>(manifest: T): Partial<T>;
export function packStaged(root: string, destination: string): string;
