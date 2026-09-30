export function compareVersions(left: string, right: string): number;
export function highestTag(tags: readonly string[]): string | null;
export function releaseBlocker(version: string, tags: readonly string[]): string | null;
export function breakingBlocker(version: string, breaking: boolean, previous: string | null): string | null;
export function isBreakingEntry(releasesSource: string, version: string): boolean;
export function branchBlocker(branch: string): string | null;
export function releaseAssetName(version: string): string;
export function releaseAssetUrl(tag: string, version: string): string;
