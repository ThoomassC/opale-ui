import { describe, expect, it } from 'vitest';

import {
  branchBlocker,
  breakingBlocker,
  compareVersions,
  highestTag,
  isBreakingEntry,
  releaseAssetName,
  releaseAssetUrl,
  releaseBlocker,
} from '../../scripts/release-guard.mjs';
import packageJson from '../../package.json';
import releasesSource from './releases.ts?raw';
import { RELEASES } from './releases';

/* LE TAG FANTÔME, ET LA GARDE QUI L'AURAIT ARRÊTÉ.

   Le 24/09, un tag v4.0.0 a été posé sur un code antérieur à la 2.2.0, puis la
   ligne est redescendue en 2.x. Pour semver, v4.0.0 restait la version la plus
   récente : « le dernier tag » ou une borne ^4 installaient un code plus
   ancien. Le script de publication ne vérifiait que l'existence du tag exact. */
describe('la garde de publication', () => {
  it('compare des versions au sens semver, pas au sens alphabétique', () => {
    expect(compareVersions('2.10.0', '2.9.9')).toBeGreaterThan(0);
    expect(compareVersions('2.5.0', '3.0.0')).toBeLessThan(0);
    expect(compareVersions('2.5.0', '2.5.0')).toBe(0);
  });

  it('trouve le plus haut tag de version et ignore les autres', () => {
    expect(highestTag(['v0.2.0', 'v2.2.0', 'v2.10.0', 'latest', 'v2.9.1'])).toBe('2.10.0');
    expect(highestTag(['latest'])).toBeNull();
  });

  it('refuse une version qui n’est pas au-dessus du plus haut tag', () => {
    expect(releaseBlocker('2.5.1', ['v2.2.0', 'v4.0.0'])).toMatch(/4\.0\.0/);
    expect(releaseBlocker('2.2.0', ['v2.2.0'])).toMatch(/existe déjà/);
    expect(releaseBlocker('2.5.1', ['v2.2.0', 'v2.5.0'])).toBeNull();
  });
});

/* LIV-07 — DES RUPTURES PUBLIÉES EN VERSIONS MINEURES.

   2.1.1, 2.2.0 et 2.5.0 portent `breaking: true` sans changer de majeure : une
   borne ^2.1.0 récupérait des composants retirés et des props devenues
   obligatoires. Elles sont publiées, donc figées ; la garde empêche la
   suivante. */
describe('la garde des ruptures', () => {
  it('exige une nouvelle majeure pour une version en rupture', () => {
    expect(breakingBlocker('2.6.0', true, '2.5.2')).toMatch(/3\.0\.0/);
    expect(breakingBlocker('2.5.3', true, '2.5.2')).toMatch(/majeure/);
    expect(breakingBlocker('3.0.0', true, '2.5.2')).toBeNull();
    expect(breakingBlocker('2.6.0', false, '2.5.2')).toBeNull();
    expect(breakingBlocker('1.0.0', true, null)).toBeNull();
  });

  it('suit la règle de semver avant 1.0 : la mineure y tient lieu de majeure', () => {
    expect(breakingBlocker('0.3.0', true, '0.2.0')).toBeNull();
    expect(breakingBlocker('0.2.1', true, '0.2.0')).toMatch(/0\.3\.0/);
  });

  it('lit le drapeau de rupture de l’entrée voulue, et d’elle seule', () => {
    expect(isBreakingEntry(releasesSource, '2.5.0')).toBe(true);
    expect(isBreakingEntry(releasesSource, '2.4.0')).toBe(false);
    expect(isBreakingEntry(releasesSource, '9.9.9')).toBe(false);
  });

  it('ne laisse passer, dans le registre, que les trois ruptures déjà publiées', () => {
    const LEGACY = ['2.5.0', '2.2.0', '2.1.1'];
    const offenders = RELEASES.flatMap((release, index) => {
      const previous = RELEASES[index + 1]?.version ?? null;
      const blocker = breakingBlocker(release.version, release.breaking === true, previous);
      return blocker ? [release.version] : [];
    });
    expect(offenders).toEqual(LEGACY);
  });
});

/* LIV-08 — LES VERSIONS SORTENT DE `recette`. `main` porte la production
   (1.0.0) et ne reçoit une version que sur décision ; un tag posé depuis une
   branche de travail désignerait un code qui n'a pas été recetté. */
describe('la garde de branche', () => {
  it('ne publie que depuis recette', () => {
    expect(branchBlocker('recette')).toBeNull();
    expect(branchBlocker('main')).toMatch(/recette/);
    expect(branchBlocker('codex/recette-vague-5')).toMatch(/recette/);
    expect(branchBlocker('HEAD')).toMatch(/détach/);
  });
});

/* LIV-05 — UNE ARCHIVE CONSTRUITE, ATTACHÉE À LA RELEASE.

   Installer depuis le tag Git fait tourner `prepare` chez le consommateur :
   toute la chaîne de build y est requise, `npm ci --ignore-scripts` livre un
   paquet sans `dist/`, et pnpm 10 bloque le script. L'archive `npm pack`
   attachée à la release GitHub arrive construite. Son nom et son adresse sont
   calculés ici, au même endroit pour le script de publication et la vitrine. */
describe("l'archive de release", () => {
  it('porte le nom que `npm pack` donne à ce paquet', () => {
    expect(releaseAssetName('2.9.0')).toBe('thomascaron-opale-ui-2.9.0.tgz');
    expect(packageJson.name).toBe('@thomascaron/opale-ui');
    expect(releaseAssetName('2.9.0')).toBe(
      `${packageJson.name.replace(/^@/, '').replace('/', '-')}-2.9.0.tgz`,
    );
  });

  it('se télécharge depuis la release du tag', () => {
    expect(releaseAssetUrl('v2.9.0', '2.9.0')).toBe(
      'https://github.com/ThoomassC/opale-ui/releases/download/v2.9.0/thomascaron-opale-ui-2.9.0.tgz',
    );
  });

  it('refuse une version qui n’en est pas une', () => {
    expect(() => releaseAssetName('recette')).toThrow(/Version invalide/);
    expect(() => releaseAssetUrl('recette', '2.9.0')).toThrow(/Tag invalide/);
  });
});
