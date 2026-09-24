import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { CURRENT_RELEASE, RELEASES } from './releases';
import { UI_VERSION } from './version';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function asTuple(version: string): readonly number[] {
  const match = SEMVER.exec(version);
  if (!match) throw new Error(`version invalide dans le registre : ${version}`);
  return match.slice(1).map(Number);
}

function compareVersions(left: readonly number[], right: readonly number[]): number {
  for (let index = 0; index < 3; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
}

describe('registre des notes de versions', () => {
  it('devrait commencer par la version affichée par la vitrine', () => {
    expect(CURRENT_RELEASE.version).toBe(UI_VERSION);
    expect(RELEASES[0]?.version).toBe(UI_VERSION);
  });

  it('devrait garder des versions uniques, au format semver, du plus récent au plus ancien', () => {
    const versions = RELEASES.map((release) => release.version);
    const duplicates = versions.filter((version, index) => versions.indexOf(version) !== index);

    expect(duplicates).toEqual([]);
    expect(versions.every((version) => SEMVER.test(version))).toBe(true);

    for (let index = 1; index < versions.length; index += 1) {
      const previous = asTuple(versions[index - 1] ?? '0.0.0');
      const current = asTuple(versions[index] ?? '0.0.0');

      expect(
        compareVersions(previous, current),
        `${versions[index - 1]} devrait précéder ${versions[index]}`,
      ).toBeGreaterThan(0);
    }
  });

  it('garde les changements de la 3.2.0 dans leurs trois groupes de lecture', () => {
    expect(CURRENT_RELEASE.sections?.map((section) => section.title)).toEqual([
      'Compatibilité et migration',
      'Composants et interactions',
      'Documentation et qualité',
    ]);
    expect(CURRENT_RELEASE.sections?.flatMap((section) => section.changes)).toEqual(
      CURRENT_RELEASE.changes,
    );
    expect(CURRENT_RELEASE.migration?.steps).toHaveLength(3);
  });

  it('devrait donner une application et une provenance à chaque entrée', () => {
    for (const release of RELEASES) {
      expect(release.appHref, `application absente pour ${release.version}`).not.toBe('');
      expect(release.sourceHref, `provenance absente pour ${release.version}`).toMatch(
        /^https:\/\/github\.com\//,
      );
      expect(
        release.changes.length,
        `aucun changement documenté pour ${release.version}`,
      ).toBeGreaterThan(0);
    }
  });

  it('devrait posséder un index pour chaque archive historique référencée', () => {
    const archived = RELEASES.filter((release) => release.appHref.startsWith('/versions/'));

    for (const release of archived) {
      const archiveIndex = join(
        process.cwd(),
        'public',
        'versions',
        `v${release.version}`,
        'index.html',
      );

      expect(existsSync(archiveIndex), `archive absente pour ${release.version}`).toBe(true);
    }
  });
});
