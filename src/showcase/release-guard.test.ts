import { describe, expect, it } from 'vitest';

import {
  breakingBlocker,
  compareVersions,
  highestTag,
  isBreakingEntry,
  releaseBlocker,
} from '../../scripts/release-guard.mjs';
import releasesSource from './releases.ts?raw';
import { RELEASES } from './releases';

/* LE TAG FANTÔME, ET LA GARDE QUI L'AURAIT ARRÊTÉ.

   Le 24/09, un tag v4.0.0 a été posé sur un code antérieur à la 3.2.0, puis la
   ligne est redescendue en 3.x. Pour semver, v4.0.0 restait la version la plus
   récente : « le dernier tag » ou une borne ^4 installaient un code plus
   ancien. Le script de publication ne vérifiait que l'existence du tag exact. */
describe('la garde de publication', () => {
  it('compare des versions au sens semver, pas au sens alphabétique', () => {
    expect(compareVersions('3.10.0', '3.9.9')).toBeGreaterThan(0);
    expect(compareVersions('3.5.0', '4.0.0')).toBeLessThan(0);
    expect(compareVersions('3.5.0', '3.5.0')).toBe(0);
  });

  it('trouve le plus haut tag de version et ignore les autres', () => {
    expect(highestTag(['v0.2.0', 'v3.2.0', 'v3.10.0', 'latest', 'v3.9.1'])).toBe('3.10.0');
    expect(highestTag(['latest'])).toBeNull();
  });

  it('refuse une version qui n’est pas au-dessus du plus haut tag', () => {
    expect(releaseBlocker('3.5.1', ['v3.2.0', 'v4.0.0'])).toMatch(/4\.0\.0/);
    expect(releaseBlocker('3.2.0', ['v3.2.0'])).toMatch(/existe déjà/);
    expect(releaseBlocker('3.5.1', ['v3.2.0', 'v3.5.0'])).toBeNull();
  });
});

/* LIV-07 — DES RUPTURES PUBLIÉES EN VERSIONS MINEURES.

   3.1.1, 3.2.0 et 3.5.0 portent `breaking: true` sans changer de majeure : une
   borne ^3.1.0 récupérait des composants retirés et des props devenues
   obligatoires. Elles sont publiées, donc figées ; la garde empêche la
   suivante. */
describe('la garde des ruptures', () => {
  it('exige une nouvelle majeure pour une version en rupture', () => {
    expect(breakingBlocker('3.6.0', true, '3.5.2')).toMatch(/4\.0\.0/);
    expect(breakingBlocker('3.5.3', true, '3.5.2')).toMatch(/majeure/);
    expect(breakingBlocker('4.0.0', true, '3.5.2')).toBeNull();
    expect(breakingBlocker('3.6.0', false, '3.5.2')).toBeNull();
    expect(breakingBlocker('1.0.0', true, null)).toBeNull();
  });

  it('suit la règle de semver avant 1.0 : la mineure y tient lieu de majeure', () => {
    expect(breakingBlocker('0.3.0', true, '0.2.0')).toBeNull();
    expect(breakingBlocker('0.2.1', true, '0.2.0')).toMatch(/0\.3\.0/);
  });

  it('lit le drapeau de rupture de l’entrée voulue, et d’elle seule', () => {
    expect(isBreakingEntry(releasesSource, '3.5.0')).toBe(true);
    expect(isBreakingEntry(releasesSource, '3.4.0')).toBe(false);
    expect(isBreakingEntry(releasesSource, '9.9.9')).toBe(false);
  });

  it('ne laisse passer, dans le registre, que les trois ruptures déjà publiées', () => {
    const LEGACY = ['3.5.0', '3.2.0', '3.1.1'];
    const offenders = RELEASES.flatMap((release, index) => {
      const previous = RELEASES[index + 1]?.version ?? null;
      const blocker = breakingBlocker(release.version, release.breaking === true, previous);
      return blocker ? [release.version] : [];
    });
    expect(offenders).toEqual(LEGACY);
  });
});
