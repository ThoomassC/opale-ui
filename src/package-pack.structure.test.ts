import { describe, expect, it } from 'vitest';

import { DROPPED_FIELDS, PUBLISHED_FIELDS, packManifest } from '../scripts/pack.mjs';
import manifest from '../package.json';
import releaseSource from '../scripts/release.mjs?raw';
import consumerSource from '../scripts/check-consumer.mjs?raw';

/* =============================================================================
   L'ARCHIVE DE RELEASE LIVRE UN MANIFESTE DE PAQUET, PAS CELUI DU DÉPÔT.

   INT-16 — le `package.json` de l'archive portait les scripts, les
   dépendances de développement et `private: true`. L'archive est emballée
   depuis un dossier de préparation, avec un manifeste réduit à ce qu'un
   consommateur lit. L'installation par tag Git garde le vrai manifeste :
   elle a besoin de `prepare`.
   ========================================================================== */

describe('scripts/pack.mjs', () => {
  const packed = packManifest(manifest);

  it('retire scripts, dépendances de développement et private', () => {
    for (const field of ['scripts', 'devDependencies', 'private']) {
      expect(packed).not.toHaveProperty(field);
    }
  });

  it('garde à l’identique ce qu’un consommateur lit', () => {
    for (const field of [
      'name',
      'version',
      'type',
      'exports',
      'files',
      'peerDependencies',
      'dependencies',
      'engines',
      'sideEffects',
      'license',
    ] as const) {
      expect(packed[field]).toEqual(manifest[field]);
    }
  });

  /* Un champ ajouté au manifeste doit être classé : publié ou retiré. Sans
     cette règle, il disparaîtrait de l'archive sans que personne l'ait voulu. */
  it('classe chaque champ du manifeste', () => {
    const classified = new Set([...PUBLISHED_FIELDS, ...DROPPED_FIELDS]);
    expect(Object.keys(manifest).filter((field) => !classified.has(field))).toEqual([]);
  });

  it('emballe la release et la vérification consommatrice depuis la préparation', () => {
    expect(releaseSource).toContain('packStaged(');
    expect(releaseSource).not.toMatch(/\['pack',/);
    expect(consumerSource).toContain('packStaged(');
    expect(consumerSource).not.toMatch(/\['pack',/);
  });
});
