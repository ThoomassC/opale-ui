import { describe, expect, it } from 'vitest';

/* =============================================================================
   LE NOM DE LA LIBRAIRIE AMONT N'EXISTE PLUS DANS CE DÉPÔT.

   Une partie du catalogue V3 a été reprise d'une autre librairie, dont le nom
   préfixait quatre-vingt-dix-neuf identifiants, mille trois cents classes CSS
   et six noms de fichiers. Le propriétaire a demandé qu'il disparaisse
   entièrement : ce projet s'appelle Opale, et rien d'autre.

   POURQUOI UN TEST ET PAS UN SIMPLE `grep` UNE FOIS. Un renommage global se
   défait par petits bouts : une classe recopiée d'une ancienne capture, un
   commentaire réécrit de mémoire, une branche rebasée sur du code d'avant.
   Chacun de ces retours passe la relecture — il ne casse rien. Ce garde est le
   seul endroit qui refuse le mot.

   DEUX PRÉCAUTIONS DE CONSTRUCTION, sans quoi le test ne dirait rien :

   1. LE MOT CHERCHÉ N'EST PAS ÉCRIT EN TOUTES LETTRES. Il est recomposé à
      l'exécution. Écrit littéralement, ce fichier se dénoncerait lui-même à
      chaque exécution, et la seule façon de le faire passer au vert aurait été
      de s'exclure de son propre balayage — c'est-à-dire de commencer la liste
      d'exceptions par laquelle ce genre de garde meurt.

   2. LE BALAYAGE INCLUT LES NOMS DE FICHIERS. Le mot vivait aussi dans six
      d'entre eux ; un garde qui ne lit que le contenu laisserait revenir un
      fichier qui le porte dans son nom sans broncher.

   CE FICHIER NE S'EXCLUT PAS DE SON PROPRE BALAYAGE, et c'est la conséquence
   directe du point 1. Une première version se félicitait, ici même, d'éviter
   « la liste d'exceptions par laquelle ce genre de garde meurt » — tout en
   écrivant le mot en toutes lettres dans un exemple deux lignes plus haut, et
   en se retirant du balayage pour survivre. Le garde se contredisait sur les
   deux points qu'il revendiquait. L'exemple est parti, l'exception avec.
   ========================================================================== */

/** Le mot interdit, recomposé pour que ce fichier ne se dénonce pas lui-même. */
const FORBIDDEN = ['can', 'op'].join('');

/* `import.meta.glob` est résolu par Vite À LA COMPILATION : la liste des
   fichiers est figée dans le bundle de test, donc le balayage ne dépend pas
   d'un accès disque au moment où il tourne. */
const SOURCES = import.meta.glob('./**/*.{ts,tsx,css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('le nom de la librairie amont', () => {
  it('balaie bien tout l’arbre source', () => {
    /* Sans cette borne, un motif de glob cassé rendrait un objet vide et les
       deux tests suivants passeraient sur rien. */
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
  });

  it('n’apparaît dans le contenu d’aucun fichier', () => {
    const guilty = Object.entries(SOURCES)
      .filter(([, source]) => source.toLowerCase().includes(FORBIDDEN))
      .map(([path]) => path);

    expect(
      guilty,
      `Le nom de la librairie amont est réapparu dans :\n  ${guilty.join('\n  ')}\n\n` +
        'Ce projet s’appelle Opale. Les composants portent leur propre nom ' +
        '(`Button`, `Card`…), les classes et les jetons le préfixe `opale-`.',
    ).toEqual([]);
  });

  it('n’apparaît dans le nom d’aucun fichier', () => {
    const guilty = Object.keys(SOURCES).filter((path) => path.toLowerCase().includes(FORBIDDEN));

    expect(
      guilty,
      `Ces fichiers portent le nom de la librairie amont :\n  ${guilty.join('\n  ')}`,
    ).toEqual([]);
  });
});
