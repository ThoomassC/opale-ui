import { describe, expect, it } from 'vitest';

import { parseRules, ruleBody } from '../test/css-rules';
import docSource from './doc.css?raw';

/* =============================================================================
   AVERTISSEMENT — CE FICHIER GARDE UN ANNEAU QUI N'EST PLUS PEINT.

   `doc-v3.css` neutralise désormais tout indicateur de focus de la vitrine, à
   la demande explicite du propriétaire du design system, en rendant
   `--focus-outer`, `--focus-inner` et `--opale-focus` transparents. Les règles
   de `doc.css` vérifiées ci-dessous EXISTENT toujours et restent cohérentes
   entre elles — les assertions sont donc encore vraies —, mais elles ne
   dessinent plus rien à l'écran.

   CE FICHIER N'EST PAS SUPPRIMÉ POUR AUTANT, et c'est un choix. Il garde la
   cohérence interne de `doc.css`, qui redeviendrait immédiatement utile le jour
   où l'anneau est rétabli — et ce jour-là, personne n'aura à réécrire les trois
   défauts mesurés que son en-tête d'origine documente. Le garde de la
   SUPPRESSION, lui, vit dans `doc-v3-controls.structure.test.ts`.
   ============================================================================

   LA QUESTION D'`utilities.css`, RENDUE EXÉCUTABLE.

   `styles/components/utilities.css` la pose en prose : « La question à se poser
   avant d'ajouter une `box-shadow` à un composant focusable est donc : à quel
   poids, et déclarée après cette feuille ? Si la réponse est au moins 0,2,0,
   l'anneau se perd, et c'est au composant de s'en garder. »

   Elle est restée une phrase, et TROIS défauts en sont sortis dans la seule
   vitrine :

   1. `.tc-doc-search__input` déclarait `outline: none` sans `box-shadow: none`,
      donc l'anneau n'était pas déplacé sur l'enveloppe mais DÉDOUBLÉ — un
      anneau noir de 5 px à angles droits dans un anneau en pilule ;
   2. `.tc-doc-main:focus-visible` ne rentrait que son `outline`, et les deux
      ombres de la règle universelle survivaient AUTOUR d'une boîte de 1904 px ;
   3. `.tc-doc-search__list` porte `--elevation-3`, et Chrome rend focusable au
      clavier un conteneur défilant sans enfant focusable : dès que le panneau
      de suggestions défile, son ombre remplaçait les deux ombres de l'anneau.
      Mesuré — 960 × 420, `clientHeight` 250 contre `scrollHeight` 368,
      `focusable: true`.

   Le poids n'est même pas le bon critère : la règle universelle de `tokens.css`
   pèse (0,1,0), donc une règle de MÊME poids déclarée après elle suffit à
   l'écraser, et `doc.css` est importée après. C'est l'ORDRE qui décide.

   CE FICHIER NE VÉRIFIE DONC PAS DES VALEURS, IL FORCE UNE DÉCISION : toute
   règle de `doc.css` qui déclare une `box-shadow` doit être dans la liste
   ci-dessous, avec la raison écrite. Ajouter une ombre à un élément quelconque
   fait rougir la suite, et la seule façon de la faire reverdir est de dire si
   l'élément est focusable et ce qu'on a fait de son anneau.
   ========================================================================== */

/**
 * Les règles de `doc.css` autorisées à déclarer une `box-shadow`, et pourquoi
 * chacune ne coûte pas un anneau de focus.
 *
 * `focusable` est la réponse à la seule question qui compte. Elle a été
 * vérifiée au navigateur, élément par élément, et non déduite du nom.
 */
const ALLOWED: readonly { readonly selector: string; readonly focusable: boolean }[] = [
  /* Les trois anneaux de focus eux-mêmes : ils POSENT les deux ombres. */
  { selector: '.tc-doc-skip:focus-visible', focusable: true },
  { selector: '.tc-doc-topbar__brand:focus-visible', focusable: true },
  { selector: '.tc-doc-nav__grouptitle:focus-visible', focusable: true },
  { selector: '.tc-doc-nav__alltitle:focus-visible', focusable: true },
  { selector: '.tc-doc-nav__link:focus-visible', focusable: true },
  { selector: '.tc-doc-themetoggle:focus-visible', focusable: true },
  { selector: '.tc-doc-mobile-nav-toggle:focus-visible', focusable: true },
  { selector: '.tc-doc-search:has(.tc-doc-search__input:focus-visible)', focusable: false },

  /* Le panneau de suggestions. FOCUSABLE dès qu'il défile, donc son état
     focalisé cumule l'ombre et les deux anneaux — la règle juste en dessous
     dans la feuille. */
  { selector: '.tc-doc-search__list', focusable: true },
  { selector: '.tc-doc-search__list:focus-visible', focusable: true },

  /* Un `<p>` non défilant : rien ne le rend focusable, aucun enfant non plus. */
  { selector: '.tc-doc-search__empty', focusable: false },

  /* Le champ, qui ÉTEINT les deux — sous `@supports selector(:has(*))`, pour
     que l'extinction ne survive pas à l'absence de son remplaçant. */
  { selector: '.tc-doc-search__input', focusable: true },

  /* `<main tabindex="-1">` : atteignable par le lien d'évitement, jamais par
     tabulation. Son anneau est RENTRÉ, donc les ombres extérieures sont
     éteintes. */
  { selector: '.tc-doc-main:focus-visible', focusable: true },

  /* Deux surfaces décoratives : un `<div>` et un `<article>`, aucun `tabindex`,
     aucun descendant défilant focalisable. Vérifié au navigateur. */
  { selector: '.tc-doc-specimen', focusable: false },
  { selector: '.tc-doc-plate', focusable: false },

  /* Les blocs de repli sous couleurs forcées, qui posent `box-shadow: none`. */
  {
    selector: ".tc-doc-themetoggle[aria-pressed='true']:focus-visible",
    focusable: true,
  },
];

/**
 * Les corps de TOUTES les règles qui ciblent exactement `selector`.
 *
 * Un sélecteur peut être déclaré plusieurs fois — une règle de base et une
 * variante dans un `@supports` ou un `@media` —, et la compensation d'un anneau
 * peut vivre dans n'importe laquelle.
 */
function bodiesOf(selector: string): readonly string[] {
  return parseRules(docSource)
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body);
}

/** Les préludes de `doc.css` qui déclarent une `box-shadow`, at-rules comprises. */
function shadowedPreludes(): readonly string[] {
  return parseRules(docSource)
    .filter((rule) => /(^|[;\s])box-shadow\s*:/.test(rule.body))
    .map((rule) => rule.prelude);
}

describe('les box-shadow de doc.css, et les anneaux de focus', () => {
  it('ne devrait déclarer aucune box-shadow hors de la liste décidée', () => {
    const allowed = new Set(
      ALLOWED.flatMap((entry) => entry.selector.split(',').map((part) => part.trim())),
    );

    const unexpected = shadowedPreludes()
      .flatMap((prelude) => prelude.split(',').map((part) => part.trim()))
      .filter((selector) => !allowed.has(selector));

    expect(
      [...new Set(unexpected)],
      'ces règles de doc.css déclarent une box-shadow sans être dans la liste décidée :\n  ' +
        [...new Set(unexpected)].join('\n  ') +
        '\n\nUne box-shadow déclarée après `tokens.css` REMPLACE les deux ombres de la règle ' +
        'universelle `:focus-visible`, à poids égal, par simple ordre d’import. Si l’élément ' +
        'est focusable — y compris parce qu’il DÉFILE sans enfant focusable, ce que Chrome ' +
        'suffit à décider — son anneau perd la moitié de son indicateur. Ajoute l’entrée à ' +
        'ALLOWED en répondant à la question, ou porte l’ombre sur `:not(:focus-visible)`.',
    ).toEqual([]);
  });

  it('devrait compenser chaque ombre posée sur un élément FOCUSABLE', () => {
    /* LE TEST QUI MANQUAIT À CE FICHIER, ET SON ABSENCE ÉTAIT LE DÉFAUT QUE LE
       FICHIER EXISTE POUR EMPÊCHER. La liste ci-dessus RÉPOND à la question
       d'`utilities.css` — « cet élément est-il focusable ? » — mais rien ne
       vérifiait qu'on avait AGI sur la réponse. Mutation exécutée : retirer
       `.tc-doc-search__list:focus-visible` laissait les trente-quatre tests
       verts, alors que le panneau de suggestions perd la moitié de son anneau
       dès qu'il défile.

       La règle : une ombre posée sur un élément focusable doit être accompagnée
       d'une règle `:focus-visible` qui REPOSE les deux anneaux — ou éteindre
       l'ombre, ce que fait `.tc-doc-search__input`. Les entrées qui SONT
       elles-mêmes une règle de focus sont hors sujet : elles posent l'anneau. */
    const manquantes = ALLOWED.filter((entry) => entry.focusable)
      .filter((entry) => !entry.selector.includes(':focus-visible'))
      .filter((entry) => {
        /* TOUTES les règles du sélecteur et non la première : l'extinction de
           `.tc-doc-search__input` vit dans un `@supports`, donc `ruleBody`
           seul rendait la règle de base — qui ne déclare aucune ombre — et le
           test signalait un défaut inexistant. Il a rougi sur l'état correct
           avant de rougir sur la mutation, ce qui est le bon ordre. */
        const bodies = bodiesOf(entry.selector);

        /* Éteindre l'ombre est une compensation valable : il ne reste alors
           rien à écraser. */
        if (bodies.some((body) => /box-shadow:\s*none/.test(body))) return false;

        return !bodiesOf(`${entry.selector}:focus-visible`).some(
          (body) => body.includes('--focus-inner') && body.includes('--focus-outer'),
        );
      })
      .map((entry) => entry.selector);

    expect(
      manquantes,
      'ces sélecteurs posent une box-shadow sur un élément FOCUSABLE sans rien pour ' +
        'compenser :\n  ' +
        manquantes.join('\n  ') +
        '\n\nL’ombre remplace les deux ombres de la règle universelle `:focus-visible` de ' +
        '`tokens.css` (poids égal, `doc.css` importée après), donc l’anneau perd la moitié de ' +
        'son indicateur. Il faut soit une règle `<sélecteur>:focus-visible` qui repose ' +
        '`--focus-inner` ET `--focus-outer`, soit un `box-shadow: none`.',
    ).toEqual([]);
  });

  it('devrait éteindre les ombres extérieures de `<main>` focalisé', () => {
    /* Le commentaire de cette règle décrivait « deux traits verticaux » qu'il
       affirmait avoir supprimés, et il n'en avait supprimé que la moitié.
       Mesuré avant correction, `<main>` focalisé en 760 × 560 : boîte
       760 × 1903,7, `outline` 3 px à −4 px, et `box-shadow` valant encore
       « rgb(246,255,222) 0 0 0 2px, rgb(0,0,0) 0 0 0 5px ». */
    expect(
      ruleBody(docSource, '.tc-doc-main:focus-visible') ?? '',
      '.tc-doc-main:focus-visible ne déclare pas « box-shadow: none » : un anneau noir de 5 px ' +
        'se peint autour d’une boîte de près de 1900 px, dont le haut passe sous la barre.',
    ).toMatch(/box-shadow:\s*none/);
  });

  it('devrait garder la troncature de la marque en disposition de grille', () => {
    /* LA RÉGRESSION QUE LE CENTRAGE A INTRODUITE. `justify-self: start`
       dimensionne l'élément en `fit-content`, et `white-space: nowrap` rend son
       `min-content` égal à son `max-content` : l'élément dépasse sa piste au
       lieu de s'abréger, donc `overflow: hidden` et `text-overflow: ellipsis`
       ne s'appliquent plus.

       Mesuré à 960 px avec une taille de police minimale forcée : marque
       282,5 px dans une piste de 236, `scrollWidth == clientWidth` donc rien ne
       le signale, et 34,5 px de recouvrement avec la pilule de recherche.

       jsdom ne peint pas : seul un garde de texte peut tenir ça. */
    const grid = ruleBody(docSource, '.tc-doc-topbar__brand', {
      within: '@media (min-width: 60rem)',
    });

    expect(
      grid,
      'aucune règle ne cible .tc-doc-topbar__brand dans le bloc 60 rem : le centrage en grille ' +
        'ne peut alors pas rendre la piste opposable à la marque.',
    ).not.toBeNull();

    expect(
      grid ?? '',
      '.tc-doc-topbar__brand ne déclare pas « max-inline-size: 100% » en grille : la marque ' +
        'dépasse sa piste au lieu de s’abréger, et se peint sous le champ de recherche.',
    ).toMatch(/max-inline-size:\s*100%/);
  });
});
