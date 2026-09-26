import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PAGES } from './pages';
import { CURRENT_RELEASE, V320_REMOVED_COMPONENTS, RELEASES } from './releases';
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

  it('présente la 3.3.0 et conserve les groupes de la 3.2.0 archivée', () => {
    expect(CURRENT_RELEASE.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/recette');
    expect(CURRENT_RELEASE.sections?.map((section) => section.title)).toEqual([
      'Créer une page avec Opale',
      'Navigation et accessibilité',
    ]);
    expect(CURRENT_RELEASE.changes).toHaveLength(4);
    const previous = RELEASES.find((release) => release.version === '3.2.0');
    expect(previous?.sections?.map((section) => section.title)).toEqual([
      'Compatibilité et migration',
      'Composants et interactions',
      'Documentation et qualité',
      'Améliorations de recette',
    ]);
    expect(previous?.migration?.steps).toHaveLength(3);
    expect(previous?.changes).toHaveLength(12);
    expect(previous?.appHref).toBe('/versions/v3.2.0/index.html');
  });

  it('documente chaque export retiré une seule fois dans le tableau de migration', () => {
    const removed = V320_REMOVED_COMPONENTS.flatMap((row) => row.removed);

    expect(removed).toHaveLength(28);
    expect(new Set(removed).size).toBe(removed.length);
    expect(RELEASES.find((release) => release.version === '3.2.0')?.removedComponents).toBe(
      V320_REMOVED_COMPONENTS,
    );
  });

  it('lie chaque changement et remplacement à une fiche existante', () => {
    const slugs = new Set(PAGES.map((page) => page.slug));
    const linkedSlugs = [
      ...RELEASES.flatMap((release) => release.sections ?? []).flatMap((section) =>
        section.changes.flatMap((change) => change.links?.map((link) => link.slug) ?? []),
      ),
      ...V320_REMOVED_COMPONENTS.flatMap((row) => (row.slug ? [row.slug] : [])),
    ];

    for (const slug of linkedSlugs) {
      expect(slugs.has(slug), `fiche absente : ${slug}`).toBe(true);
    }
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
