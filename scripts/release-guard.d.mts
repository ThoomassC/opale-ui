export function compareVersions(left: string, right: string): number;
export function highestTag(tags: readonly string[]): string | null;
export function releaseBlocker(version: string, tags: readonly string[]): string | null;
