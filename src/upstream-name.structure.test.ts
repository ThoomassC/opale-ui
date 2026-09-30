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

/* LA DEUXIÈME LIBRAIRIE AMONT, AJOUTÉE LE 28/09. Le dossier des composants,
   leur feuille, le préfixe des classes produites et la bannière du bundle
   portaient encore le nom de la librairie d'où venaient les premiers
   composants en verre — alors que plus une ligne de son code n'était
   distribuée. Le propriétaire veut qu'Opale ne doive rien à aucune des deux.
   Les deux mots sont recomposés, pour la raison du point 1. */

/** Les mots interdits, recomposés pour que ce fichier ne se dénonce pas lui-même. */
const FORBIDDEN = [
  ['can', 'op'].join(''),
  ['ma', 'gic'].join(''),
  ['twee', 'edlex'].join(''),
  ['ven', 'dor'].join(''),
  /* LA TROISIÈME TRACE N'ÉTAIT PAS UN NOM, MAIS UNE PHRASE. L'en-tête de
     `opale.css` présentait les jetons comme « compatibles » avec une librairie
     « de référence » dont ils « reprenaient » les noms : la librairie amont
     n'était plus nommée, mais toujours désignée. Le garde refuse désormais la
     formule elle-même, recomposée pour la raison du point 1. */
  ['reference', 'library'].join(' '),
];

/* `import.meta.glob` est résolu par Vite À LA COMPILATION : la liste des
   fichiers est figée dans le bundle de test, donc le balayage ne dépend pas
   d'un accès disque au moment où il tourne. */
const SOURCES = {
  ...import.meta.glob('./**/*.{ts,tsx,css,scss,md}', { query: '?raw', import: 'default', eager: true }),
  /* La racine aussi : configurations de build, scripts, README et notices.
     `package-lock.json` est exclu : il nomme les dépendances de Vite, dont
     une porte le mot dans son nom sans rien devoir à personne ici. */
  ...import.meta.glob(
    [
      '../*.{ts,md,json}',
      '../scripts/*.{mjs,mts}',
      '../docs/**/*.md',
      '../index.html',
      '!../package-lock.json',
    ],
    { query: '?raw', import: 'default', eager: true },
  ),
} as Record<string, string>;

const offending = (text: string) => FORBIDDEN.some((word) => text.toLowerCase().includes(word));

describe('le nom des librairies amont', () => {
  it('balaie bien tout l’arbre source', () => {
    /* Sans cette borne, un motif de glob cassé rendrait un objet vide et les
       deux tests suivants passeraient sur rien. */
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
  });

  it('n’apparaît dans le contenu d’aucun fichier', () => {
    const guilty = Object.entries(SOURCES)
      .filter(([, source]) => offending(source))
      .map(([path]) => path);

    expect(
      guilty,
      `Le nom de la librairie amont est réapparu dans :\n  ${guilty.join('\n  ')}\n\n` +
        'Ce projet s’appelle Opale. Les composants portent leur propre nom ' +
        '(`Button`, `Card`…), les classes et les jetons le préfixe `opale-`.',
    ).toEqual([]);
  });

  it('n’apparaît dans le nom d’aucun fichier', () => {
    const guilty = Object.keys(SOURCES).filter((path) => offending(path));

    expect(
      guilty,
      `Ces fichiers portent le nom de la librairie amont :\n  ${guilty.join('\n  ')}`,
    ).toEqual([]);
  });
});
