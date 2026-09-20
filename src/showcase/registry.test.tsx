import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* L'ENTRÉE RACINE DU PAQUET, ET ELLE A CHANGÉ DE FICHIER EN 2.0.
   C'était `src/index.ts`, qui réexportait dix-huit composants écrits ici ;
   c'est désormais `src/magic/index.ts`, que `package.json` déclare en
   `exports["."] -> ./dist/magic/index.js`. Le test lit donc la MÊME chose
   qu'avant — les exports réels de ce qu'un consommateur installe — à un chemin
   près.

   IMPORT RELATIF ET NON `@thomascaron/opale-ui`, ET C'EST MESURÉ. Le paquet est
   auto-référençable (son `package.json` a un `name` et un `exports`), donc
   `@thomascaron/opale-ui` RÉSOUT — mais vers `dist/`, le produit du build :
   `tsc --traceResolution` le confirme (« successfully resolved to
   .../dist/magic/index.d.ts »), et Vitest y charge `dist/magic/index.js`. La
   suite éprouverait alors un artefact de build au lieu de la source, et
   passerait au vert sur une source cassée tant que `dist/` est encore frais.
   Le spécimen relatif désigne la source, dans les trois outils, sans
   configuration. Voir la note de `vite.config.ts`. */
import * as library from '../magic';

import type { DocPage } from './doc-model';
import { GROUPS, HOME_SLUG, catalogComponentLabel, parseSlug } from './doc-model';
import { PAGES } from './pages';

/* ============================================================================
   POURQUOI CE FICHIER EXISTE

   La promesse de la vitrine — « une entrée de navigation par composant
   publié » — est une phrase, et une phrase ne s'exécute pas. Elle s'est déjà
   perdue une fois : la charte unique déroulait sept sections et documentait
   ce que son auteur avait sous la main, pas ce que l'entrée racine publiait.

   Ce fichier la rend exécutable. Il lit les exports RÉELS de la librairie et
   exige une page pour chacun. Ajouter un composant sans page rougit ici, en
   le NOMMANT — c'est ce qu'on lira dans six mois.

   Il ne dit rien du CONTENU d'une page : ni combien de boutons la page de
   `Button` montre, ni dans quel ordre. Ce contenu est écrit à côté et bougera ;
   ce qui ne doit pas bouger est le contrat — l'existence, l'adresse, le plan
   de titres, et le fait que la page se rende sans se plaindre.
   ========================================================================== */

/**
 * Les composants documentés sur la page d'un AUTRE composant.
 *
 * `ToastProvider` est le fournisseur de contexte du système de notification :
 * seul, il ne rend rien de visible et n'a pas de spécimen à montrer. Ce qui
 * s'emploie est le couple `ToastProvider` + `useToast`, et les deux se
 * documentent donc sur la page « Toast ». La correspondance est écrite ici, et
 * non retirée en silence de la liste des composants à documenter : une
 * exclusion muette est le mécanisme même par lequel un composant finit sans
 * page.
 *
 * `useToast` N'EST PAS DANS CETTE LISTE ET N'A PAS À Y ÊTRE : le filtre
 * ci-dessous ne retient que les exports dont le nom commence par une majuscule,
 * donc un hook n'est jamais compté. Il est documenté sur la même page, mais
 * rien ici ne l'exige — c'est une limite connue de ce garde, pas un oubli.
 */
const DOCUMENTED_WITH: Readonly<Record<string, string>> = {
  ToastProvider: 'Toast',
};

/** Ce qui doit finir dans une URL : minuscules, chiffres, tirets, barres. */
const SLUG_SHAPE = /^$|^[a-z0-9]+(?:[/-][a-z0-9]+)*$/;

/** Le préfixe d'adresse du groupe des composants. */
const COMPONENT_PREFIX = 'composants/';

/**
 * Le niveau du titre que rend la COQUILLE, au-dessus de toute page.
 *
 * Ce n'est plus un postulat : `doc-shell.test.tsx` vérifie que la coquille rend
 * bien un `<h1>`, et un seul.
 */
const SHELL_HEADING_LEVEL = 1;

/**
 * Les marqueurs des composants que React ne représente pas par une fonction.
 *
 * `memo`, `forwardRef` et `lazy` rendent des OBJETS portant un `$$typeof` —
 * vérifié sur le React du dépôt (19.2.8). Un `typeof value === 'function'` seul
 * les rate tous les trois, si bien que le premier composant devant transmettre
 * une `ref` — le cas naturel pour `Input`, `Select` ou `Textarea` — serait
 * publié sans page et sans rien faire rougir : exactement la panne que ce
 * fichier existe pour empêcher.
 */
const COMPONENT_MARKERS: readonly symbol[] = [
  Symbol.for('react.memo'),
  Symbol.for('react.forward_ref'),
  Symbol.for('react.lazy'),
];

/** Un composant au sens de React : une fonction, ou un objet marqué. */
function isComponent(value: unknown): boolean {
  if (typeof value === 'function') return true;
  if (typeof value !== 'object' || value === null || !('$$typeof' in value)) return false;

  const marker = value.$$typeof;

  return typeof marker === 'symbol' && COMPONENT_MARKERS.includes(marker);
}

/**
 * Les composants publiés par l'entrée racine, `src/magic/index.ts`.
 *
 * Reconnus par la FORME de l'export et non par une liste recopiée : un export
 * dont le nom commence par une majuscule et dont la valeur est un composant.
 * Les exports de TYPE ne sont pas là — ils sont effacés à la compilation, donc
 * absents de l'objet de module.
 */
const PUBLISHED_COMPONENTS: readonly string[] = Object.entries(library)
  .filter(([name, value]) => /^[A-Z]/.test(name) && isComponent(value))
  .map(([name]) => name)
  .sort();

/**
 * Le nombre de composants publiés, ÉPINGLÉ.
 *
 * Une borne large (« plus de dix ») tolérerait une perte silencieuse de
 * détection : le fichier passerait au vert en ne regardant plus que la moitié
 * des exports. En ajoutant un composant à `src/magic/index.ts`, ce chiffre
 * monte d'un — et il faut aussi lui écrire une page, ce que le test suivant
 * exige.
 *
 * SEIZE COMPOSANTS HISTORIQUES, PLUS LE CATALOGUE OPALE DE LA V3. L'entrée
 * racine publie les composants historiques et les nouvelles briques compatibles.
 * verre liquide historiques, ainsi que `SiteNav` et `SearchBar`.
 */
/* 92 ET NON 93 DEPUIS QUE LE BOUTON N'EST PLUS EN DOUBLE. Le paquet exportait
   deux `Button` : le vendoré, qui passe par `<Glass>`, et `CanopButton`. Le
   premier n'est plus une porte publique — il est la matière derrière
   `liquidGlass` — donc il n'a plus de page à exiger, et le compte descend d'un.
   Le module, lui, existe toujours. */
const PUBLISHED_COMPONENT_COUNT = 92;

/** Le libellé de la page attendue pour un composant. */
function pageLabelFor(component: string): string {
  return DOCUMENTED_WITH[component] ?? catalogComponentLabel(component);
}

/** `ChipList` → `chip-list`. Le slug d'une page de composant. */
function kebabCase(label: string): string {
  return label.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

const COMPONENT_PAGES: readonly DocPage[] = PAGES.filter((page) => page.group === 'composants');
const COMPONENT_PAGE_CASES: readonly (readonly [slug: string, page: DocPage])[] =
  COMPONENT_PAGES.map((page) => [page.slug, page]);

/**
 * Une page par cas, le slug d'abord.
 *
 * Le slug est passé en premier argument pour qu'il apparaisse dans le NOM du
 * test : sans lui, vingt et une lignes identiques laissent chercher laquelle
 * des vingt et une pages a cassé.
 */
const PAGE_CASES: readonly (readonly [slug: string, page: DocPage])[] = PAGES.map((page) => [
  page.slug === HOME_SLUG ? '(accueil)' : page.slug,
  page,
]);

const HEADINGS = 'h1, h2, h3, h4, h5, h6';

function headingsOf(root: HTMLElement): readonly HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(HEADINGS)];
}

function levelOf(heading: HTMLElement): number {
  return Number(heading.tagName.slice(1));
}

function describeHeading(heading: HTMLElement): string {
  return `h${levelOf(heading)} « ${heading.textContent?.trim().slice(0, 40) ?? ''} »`;
}

/** Le plan des titres rendus, précédé du `<h1>` que fournit la coquille. */
function headingOutline(headings: readonly HTMLElement[]): string {
  return ['h1 (coquille)', ...headings.map(describeHeading)].join(' → ');
}

/**
 * Le premier saut de plus d'un cran dans le plan des titres, s'il y en a un.
 *
 * Descendre de plusieurs crans est licite — on remonte d'une sous-section vers
 * la suivante ; monter de plus d'un laisse un trou dans le plan sur lequel un
 * lecteur d'écran navigue.
 */
function firstHeadingJump(headings: readonly HTMLElement[]): string | undefined {
  let previous = SHELL_HEADING_LEVEL;

  for (const heading of headings) {
    const level = levelOf(heading);

    if (level > previous + 1) return `h${previous} → ${describeHeading(heading)}`;

    previous = level;
  }

  return undefined;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Le registre des pages', () => {
  describe('la couverture des composants publiés', () => {
    it('devrait trouver les composants publiés par l’entrée racine', () => {
      /* Garde-fou du garde-fou : si la reconnaissance des exports cassait, le
         test suivant passerait sur une liste tronquée et ne dirait plus rien. */
      expect(
        PUBLISHED_COMPONENTS,
        `${PUBLISHED_COMPONENTS.length} composants reconnus au lieu de ` +
          `${PUBLISHED_COMPONENT_COUNT} : ${PUBLISHED_COMPONENTS.join(', ')}\n` +
          `— si vous venez d'AJOUTER un composant à src/magic/index.ts, montez ` +
          `PUBLISHED_COMPONENT_COUNT d'un et écrivez-lui sa page ;\n` +
          `— si vous n'avez rien ajouté, c'est la détection qui a cassé (memo, ` +
          `forwardRef et lazy rendent des objets, pas des fonctions).`,
      ).toHaveLength(PUBLISHED_COMPONENT_COUNT);
    });

    it('devrait donner une page du groupe « composants » à chaque composant publié', () => {
      const labels = new Set(COMPONENT_PAGES.map((page) => page.label));
      const missing = PUBLISHED_COMPONENTS.filter(
        (component) => !labels.has(pageLabelFor(component)),
      );

      expect(
        missing,
        `composants publiés sans page : ${missing.join(', ')}\n` +
          `libellés attendus : ${missing.map(pageLabelFor).join(', ')}\n` +
          `pages du groupe « composants » : ${[...labels].join(', ') || '(aucune)'}`,
      ).toEqual([]);
    });
  });

  describe('la cohérence du registre', () => {
    it('devrait n’avoir que des slugs uniques', () => {
      const slugs = PAGES.map((page) => page.slug);
      const duplicates = [...new Set(slugs.filter((slug, i) => slugs.indexOf(slug) !== i))];

      expect(
        duplicates,
        `slugs en double : ${duplicates.map((slug) => `« ${slug} »`).join(', ')} — ` +
          `la seconde page est inatteignable`,
      ).toEqual([]);
    });

    it('devrait n’avoir qu’une seule page de slug vide', () => {
      const homes = PAGES.filter((page) => page.slug === HOME_SLUG);

      expect(
        homes.map((page) => page.label),
        `pages de slug vide : ${homes.length} — l'accueil est la page servie au ` +
          `chargement et au repli d'un slug inconnu, il en faut exactement une`,
      ).toHaveLength(1);
    });

    it('devrait rattacher l’accueil au groupe « introduction »', () => {
      const home = PAGES.find((page) => page.slug === HOME_SLUG);

      expect(
        home?.group,
        `l'accueil « ${home?.label ?? '(absent)'} » est rattaché à ` +
          `« ${home?.group ?? 'aucun groupe'} » — la première entrée de la barre ` +
          `de navigation doit être celle par laquelle on entre`,
      ).toBe('introduction');
    });

    it('devrait rattacher chaque page à un groupe déclaré dans GROUPS', () => {
      const known = new Set(GROUPS.map((group) => group.id));
      const orphans = PAGES.filter((page) => !known.has(page.group)).map(
        (page) => `« ${page.slug} » → ${page.group}`,
      );

      expect(
        orphans,
        `pages rattachées à un groupe inconnu : ${orphans.join(', ')} — elles ` +
          `n'apparaîtraient dans aucune section de la barre de navigation`,
      ).toEqual([]);
    });

    it('devrait donner un libellé et un titre non vides à chaque page', () => {
      const blank = PAGES.filter(
        (page) => page.label.trim() === '' || page.title.trim() === '',
      ).map((page) => `« ${page.slug} » (label: « ${page.label} », title: « ${page.title} »)`);

      expect(
        blank,
        `pages sans libellé ou sans titre : ${blank.join(', ')} — le libellé ` +
          `est l'entrée de nav, le titre le <h1> de la page`,
      ).toEqual([]);
    });

    it('devrait n’employer que des slugs utilisables dans une URL', () => {
      const malformed = PAGES.map((page) => page.slug)
        .filter((slug) => !SLUG_SHAPE.test(slug))
        .map((slug) => `« ${slug} »`);

      expect(
        malformed,
        `slugs hors forme ${SLUG_SHAPE.source} : ${malformed.join(', ')} — une ` +
          `majuscule, un espace ou un accent ressort percent-encodé du fragment ` +
          `et ne se relit plus`,
      ).toEqual([]);
    });
  });

  describe('les adresses des pages de composants', () => {
    it('devrait préfixer chaque page de composant par « composants/ »', () => {
      const misplaced = COMPONENT_PAGES.filter(
        (page) => !page.slug.startsWith(COMPONENT_PREFIX),
      ).map((page) => `${page.label} → « ${page.slug} »`);

      expect(
        misplaced,
        `pages du groupe « composants » hors du préfixe ${COMPONENT_PREFIX} : ` +
          `${misplaced.join(', ')}`,
      ).toEqual([]);
    });

    it('devrait nommer chaque page de composant par le kebab-case de son libellé', () => {
      const wrong = COMPONENT_PAGES.filter((page) => {
        const prefix = page.slug.startsWith(`${COMPONENT_PREFIX}opale-`) ? 'opale-' : '';

        return page.slug !== `${COMPONENT_PREFIX}${prefix}${kebabCase(page.label)}`;
      }).map((page) => {
        const prefix = page.slug.startsWith(`${COMPONENT_PREFIX}opale-`) ? 'opale-' : '';
        const expected = `${COMPONENT_PREFIX}${prefix}${kebabCase(page.label)}`;

        return `${page.label} : « ${page.slug} » au lieu de « ${expected} »`;
      });

      expect(
        wrong,
        `adresses qui ne se déduisent pas du libellé : ${wrong.join(' | ')} — ` +
          `un lien deviné depuis le nom du composant tomberait à côté`,
      ).toEqual([]);
    });
  });

  describe('le rendu de chaque page', () => {
    let errors: string[] = [];

    beforeEach(() => {
      errors = [];
      /* `console.error` reste espionné et non avalé : le message part dans
         l'assertion. Les trois composants d'Opale qui s'en servaient pour
         signaler un emploi fautif — `Pill` sans libellé lisible, `TimelineItem`
         à un niveau de titre qu'il ne déclare pas, `Button` mal appelé — ne
         sont plus publiés, donc CE GARDE NE COUVRE PLUS CE QU'IL COUVRAIT :
         aucun des quatorze composants vendorés ne rapporte un emploi fautif,
         ni par `console.error` ni autrement. Ce qu'il attrape encore est ce que
         React écrit lui-même — clé manquante, prop inconnue sur un élément
         du DOM, mise à jour hors du rendu —, et c'est la raison qui le garde. */
      vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        errors.push(args.map((arg) => String(arg)).join(' '));
      });
    });

    it.each(PAGE_CASES)('la page « %s » devrait se rendre sans erreur', (_slug, page) => {
      const { unmount } = render(<>{page.render()}</>);

      unmount();

      expect(
        errors,
        `la page « ${page.slug} » a écrit dans console.error :\n${errors.join('\n')}`,
      ).toEqual([]);
    });

    it.each(COMPONENT_PAGE_CASES)(
      'la page composant « %s » devrait proposer afficher et copier son code',
      (_slug, page) => {
        const { container } = render(<>{page.render()}</>);
        const labels = [...container.querySelectorAll<HTMLButtonElement>('button')].map((button) =>
          button.textContent?.trim(),
        );

        expect(labels.filter((label) => label === 'Afficher le code')).toHaveLength(1);
        expect(labels.filter((label) => label === 'Copier')).toHaveLength(1);

        const toggle = container.querySelector<HTMLButtonElement>(
          'button[aria-expanded="false"][aria-controls]',
        );
        const controlled = toggle?.getAttribute('aria-controls');

        expect(controlled).toBeTruthy();
        expect(controlled ? document.getElementById(controlled) : null).not.toBeNull();
      },
    );

    /* La coquille rend le `<h1>` — le `title` de la page. Une page qui en rend
       un second donne deux titres de premier niveau au document, donc deux
       réponses à « où suis-je ». */
    it.each(PAGE_CASES)('la page « %s » ne devrait rendre aucun <h1>', (_slug, page) => {
      const { container } = render(<>{page.render()}</>);
      const own = headingsOf(container)
        .filter((heading) => levelOf(heading) === 1)
        .map(describeHeading);

      expect(
        own,
        `la page « ${page.slug} » rend ${own.length} <h1> (${own.join(', ')}) alors ` +
          `que la coquille rend déjà celui du titre « ${page.title} »`,
      ).toEqual([]);
    });

    /* ========================================================================
       LE GARDE AJOUTÉ PAR LA MIGRATION 2.0, ET IL A TROUVÉ ONZE DÉFAUTS.

       Les quatorze pages de composants comparaient chacune leur composant à
       « l'équivalent d'Opale », par un lien vers sa page : `composants/tag`,
       `composants/pill`, `composants/field`, `composants/backdrop`,
       `composants/message`, `composants/date-range`, `composants/timeline`,
       `composants/glass-lens`, plus les quatre pages `magic/*` liées entre
       elles. La 2.0 supprime les dix-sept pages d'Opale et déplace les
       quatorze autres : chacun de ces liens serait tombé sur un fragment
       inconnu, donc — la vitrine étant servie en statique — sur l'ACCUEIL,
       silencieusement, sans 404 et sans rien de rouge.

       Deux d'entre eux étaient pires qu'un lien mort : la page du `Card`
       vendoré liait `composants/card` et celle de l'`Input` vendoré
       `composants/input` pour désigner le composant d'Opale du même nom. Après
       le déplacement, ces adresses existent — et désignent LA PAGE ELLE-MÊME.
       Un lien « voir l'équivalent d'Opale » qui ramène où l'on est déjà ne
       rougit sur aucun test d'existence ; c'est pourquoi le second cas est
       vérifié à part, juste en dessous.

       CE TEST LIT LE DOM RENDU et non le source : il attrape donc aussi les
       `href="#palette"` écrits à la main, hérités du temps où la vitrine
       tenait sur une page unique, que rien ne fait passer par `hrefFor`.
       ==================================================================== */
    it.each(PAGE_CASES)('la page « %s » ne devrait lier aucun slug inexistant', (_slug, page) => {
      const { container } = render(<>{page.render()}</>);
      const known = new Set(PAGES.map((entry) => entry.slug));

      const broken = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
        .map((anchor) => anchor.getAttribute('href') ?? '')
        .filter((href) => !known.has(parseSlug(href)))
        .map((href) => `« ${href} » → slug « ${parseSlug(href)} »`);

      expect(
        [...new Set(broken)],
        `la page « ${page.slug} » lie des fragments qu'aucune page ne sert :\n  ` +
          [...new Set(broken)].join('\n  ') +
          `\n\nLa vitrine est servie en statique : un fragment inconnu ne rend pas une 404, ` +
          `il se replie sur l'accueil. Un lien mort est donc INVISIBLE ici — il faut soit ` +
          `corriger l'adresse, soit retirer le lien et dire en clair ce qui n'est plus ` +
          `documenté.\n\nslugs servis : ${[...known].join(', ')}`,
      ).toEqual([]);
    });

    /* Le second cas, celui qu'un test d'existence laisse passer : un lien qui
       pointe sur la page qui le porte. Il ne casse rien et ne mène nulle part —
       et c'est exactement ce qu'ont produit `composants/card` et
       `composants/input` quand les pages vendorées ont pris l'adresse des
       composants d'Opale auxquels elles renvoyaient. */
    it.each(PAGE_CASES)('la page « %s » ne devrait pas se lier à elle-même', (_slug, page) => {
      const { container } = render(<>{page.render()}</>);

      const self = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
        .map((anchor) => anchor.getAttribute('href') ?? '')
        .filter((href) => parseSlug(href) === page.slug);

      expect(
        [...new Set(self)],
        `la page « ${page.slug} » porte ${self.length} lien(s) vers elle-même : ` +
          `${[...new Set(self)].join(', ')}.\nUn tel lien ne rougit sur aucun test ` +
          `d'existence et ne mène nulle part — il vient en général d'un renvoi vers un ` +
          `AUTRE composant qui portait le même nom.`,
      ).toEqual([]);
    });

    it.each(PAGE_CASES)('la page « %s » ne devrait sauter aucun niveau de titre', (_slug, page) => {
      const { container } = render(<>{page.render()}</>);
      const headings = headingsOf(container);
      const jump = firstHeadingJump(headings);

      expect(
        jump,
        `la page « ${page.slug} » saute un niveau (${jump}).\n` +
          `plan trouvé : ${headingOutline(headings)}`,
      ).toBeUndefined();
    });
  });
});
