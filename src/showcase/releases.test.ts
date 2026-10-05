import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { findPage } from './doc-model';
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

  it('présente la 4.0.0, en rupture annoncée, et archive les versions précédentes sur leur tag ou leur commit', () => {
    expect(CURRENT_RELEASE.version).toBe('4.0.0');
    expect(CURRENT_RELEASE.breaking).toBe(true);
    expect(CURRENT_RELEASE.sections?.map((section) => section.title)).toEqual([
      'Les retraits',
      'Les composants',
      'Le site',
    ]);
    expect(CURRENT_RELEASE.migration?.fromVersion).toBe('3.0.4');
    expect(CURRENT_RELEASE.migration?.steps.length).toBeGreaterThanOrEqual(6);
    expect(
      CURRENT_RELEASE.sections
        ?.flatMap((section) => section.changes)
        .some((change) => change.links?.some((link) => link.slug === 'migrer-vers-4')),
    ).toBe(true);

    const v304 = RELEASES.find((release) => release.version === '3.0.4');
    expect(v304?.appHref).toBe('/versions/v3.0.4/index.html');
    expect(v304?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v3.0.4');

    const v303 = RELEASES.find((release) => release.version === '3.0.3');
    expect(v303?.appHref).toBe('/versions/v3.0.3/index.html');
    expect(v303?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v3.0.3');

    const v302 = RELEASES.find((release) => release.version === '3.0.2');
    expect(v302?.appHref).toBe('/versions/v3.0.2/index.html');
    expect(v302?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v3.0.2');

    const v301 = RELEASES.find((release) => release.version === '3.0.1');
    expect(v301?.appHref).toBe('/versions/v3.0.1/index.html');
    expect(v301?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v3.0.1');

    const v2100 = RELEASES.find((release) => release.version === '2.10.0');
    expect(v2100?.appHref).toBe('/versions/v2.10.0/index.html');
    expect(v2100?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.10.0');

    const v394 = RELEASES.find((release) => release.version === '2.9.4');
    expect(v394?.appHref).toBe('/versions/v2.9.4/index.html');
    expect(v394?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.9.4');

    const v393 = RELEASES.find((release) => release.version === '2.9.3');
    expect(v393?.appHref).toBe('/versions/v2.9.3/index.html');
    expect(v393?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.9.3');

    const v392 = RELEASES.find((release) => release.version === '2.9.2');
    expect(v392?.appHref).toBe('/versions/v2.9.2/index.html');
    expect(v392?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.9.2');

    const v391 = RELEASES.find((release) => release.version === '2.9.1');
    expect(v391?.appHref).toBe('/versions/v2.9.1/index.html');
    expect(v391?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.9.1');

    const v390 = RELEASES.find((release) => release.version === '2.9.0');
    expect(v390?.appHref).toBe('/versions/v2.9.0/index.html');
    expect(v390?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.9.0');

    const v380 = RELEASES.find((release) => release.version === '2.8.0');
    expect(v380?.appHref).toBe('/versions/v2.8.0/index.html');
    expect(v380?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.8.0');

    const v371 = RELEASES.find((release) => release.version === '2.7.1');
    expect(v371?.appHref).toBe('/versions/v2.7.1/index.html');
    expect(v371?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.7.1');

    const v370 = RELEASES.find((release) => release.version === '2.7.0');
    expect(v370?.appHref).toBe('/versions/v2.7.0/index.html');
    expect(v370?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.7.0');

    const v361 = RELEASES.find((release) => release.version === '2.6.1');
    expect(v361?.appHref).toBe('/versions/v2.6.1/index.html');
    expect(v361?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.6.1');

    const v360 = RELEASES.find((release) => release.version === '2.6.0');
    expect(v360?.appHref).toBe('/versions/v2.6.0/index.html');
    expect(v360?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.6.0');
    expect(v360?.migration?.fromVersion).toBe('2.5.2');

    const v352 = RELEASES.find((release) => release.version === '2.5.2');
    expect(v352?.appHref).toBe('/versions/v2.5.2/index.html');
    expect(v352?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.5.2');

    const v351 = RELEASES.find((release) => release.version === '2.5.1');
    expect(v351?.appHref).toBe('/versions/v2.5.1/index.html');
    expect(v351?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.5.1');

    const v350 = RELEASES.find((release) => release.version === '2.5.0');
    expect(v350?.appHref).toBe('/versions/v2.5.0/index.html');
    expect(v350?.sourceHref).toBe('https://github.com/ThoomassC/opale-ui/tree/v2.5.0');
    expect(v350?.migration?.fromVersion).toBe('2.4.0');

    for (const version of ['2.4.0', '2.3.0']) {
      const archived = RELEASES.find((release) => release.version === version);
      expect(archived?.appHref).toBe(`/versions/v${version}/index.html`);
      expect(archived?.sourceHref).toMatch(/\/tree\/[0-9a-f]{40}$/);
    }
  });

  it('conserve les groupes de la 2.2.0 archivée', () => {
    const previous = RELEASES.find((release) => release.version === '2.2.0');
    expect(previous?.sections?.map((section) => section.title)).toEqual([
      'Compatibilité et migration',
      'Composants et interactions',
      'Documentation et qualité',
      'Améliorations de recette',
    ]);
    expect(previous?.migration?.steps).toHaveLength(3);
    expect(previous?.changes).toHaveLength(12);
    expect(previous?.appHref).toBe('/versions/v2.2.0/index.html');
  });

  it('documente chaque export retiré une seule fois dans le tableau de migration', () => {
    const removed = V320_REMOVED_COMPONENTS.flatMap((row) => row.removed);

    expect(removed).toHaveLength(28);
    expect(new Set(removed).size).toBe(removed.length);
    expect(RELEASES.find((release) => release.version === '2.2.0')?.removedComponents).toBe(
      V320_REMOVED_COMPONENTS,
    );
  });

  /* Une ancienne adresse (`SLUG_ALIASES`) mène à une fiche : la note de 2.9
     lie encore « Migrer vers la 3.0 », que `findPage` résout. */
  it('lie chaque changement et remplacement à une fiche existante', () => {
    const linkedSlugs = [
      ...RELEASES.flatMap((release) => release.sections ?? []).flatMap((section) =>
        section.changes.flatMap((change) => change.links?.map((link) => link.slug) ?? []),
      ),
      ...V320_REMOVED_COMPONENTS.flatMap((row) => (row.slug ? [row.slug] : [])),
    ];

    for (const slug of linkedSlugs) {
      expect(findPage(PAGES, slug), `fiche absente : ${slug}`).toBeDefined();
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
