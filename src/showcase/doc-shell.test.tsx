import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocNavEntry, DocPage } from './doc-model';
import { GROUPS, HOME_SLUG, hrefFor, navEntriesForPages } from './doc-model';
import { DocShell } from './doc-shell';
import {
  DOC_NAV_WIDTH_DEFAULT,
  DOC_NAV_WIDTH_MAX,
  DOC_NAV_WIDTH_MIN,
  DOC_NAV_WIDTH_STEP,
} from './doc-nav';
import { PAGES } from './pages';
import { UI_VERSION } from './version';

/* ============================================================================
   POURQUOI CE FICHIER EXISTE

   `registry.test.tsx` garde les DONNÉES de la vitrine — une page par composant
   publié, des adresses lisibles, un plan de titres qui descend d'un cran à la
   fois. Il le fait en POSTULANT que la coquille rend le `<h1>` : son
   `SHELL_HEADING_LEVEL = 1` était une constante que rien n'exécutait.

   Deux promesses de la demande n'étaient pas exécutables non plus : « une
   entrée de nav par composant publié » et « une note de version en tête de la
   barre ». Ce sont des propriétés du RENDU, pas du registre.

   Ce fichier les rend exécutables, et couvre le reste de ce que la coquille
   promet dans ses propres commentaires : le repli sans réécriture d'adresse,
   le focus qu'on ne vole pas au chargement, l'annonce unique sous mode strict,
   l'écouteur retiré au démontage.
   ========================================================================== */

/**
 * Le suffixe de `document.title`.
 *
 * Recopié : `SITE_NAME` n'est pas exporté par `doc-shell.tsx`, et l'exporter
 * pour un test élargirait la surface du module pour rien. Une dérive ici
 * rougit — c'est le titre affiché dans l'onglet.
 */
const TITLE_SUFFIX = ' — opaleUI';

/** L'identifiant de `<main>`, cible du lien d'évitement et du focus. */
const MAIN_ID = 'contenu';

/**
 * Le titre de la page de repli que la coquille rend quand le registre ne peut
 * rien servir — `EMPTY_REGISTRY_PAGE` dans `doc-shell.tsx`.
 */
const EMPTY_REGISTRY_TITLE = 'Aucune page à servir';

const HOME_FIXTURE: DocPage = {
  slug: HOME_SLUG,
  label: 'Accueil',
  group: 'introduction',
  title: 'Le socle',
  lede: 'Un chapeau d’accueil.',
  render: () => <p>corps de l’accueil</p>,
};

/** Sans chapeau : c'est ce qui rend le test du chapeau absent possible. */
const PALETTE_FIXTURE: DocPage = {
  slug: 'palette',
  label: 'La palette',
  group: 'fondations',
  title: 'La palette',
  render: () => <p>corps de la palette</p>,
};

/*
 * LES DEUX SPÉCIMENS CI-DESSOUS SONT FABRIQUÉS, ET LEURS ADRESSES NE DÉSIGNENT
 * PLUS AUCUNE PAGE SERVIE.
 *
 * Ils ne sont jamais passés qu'à `<DocShell pages={FIXTURE_PAGES} />`, donc ce
 * que la coquille en fait ne dépend que de ce qui est écrit ici. `composants/
 * button` et `composants/card` étaient de vrais slugs quand ils ont été
 * choisis ; les pages vendorées correspondantes ont depuis fusionné avec leur
 * jumeau Opale. Rien à corriger : un spécimen dont l'adresse ne croise aucune
 * vraie page est PLUS sûr, puisqu'il ne peut pas se mettre à passer — ou à
 * rougir — pour une raison qui vient du registre réel. Ils sont laissés tels
 * quels, et cette note existe pour qu'on ne les prenne pas pour des renvois.
 */
const BUTTON_FIXTURE: DocPage = {
  slug: 'composants/button',
  label: 'Button',
  group: 'composants',
  title: 'Button',
  render: () => <p>corps de Button</p>,
};

const CARD_FIXTURE: DocPage = {
  slug: 'composants/card',
  label: 'Card',
  group: 'composants',
  title: 'Card',
  render: () => <p>corps de Card</p>,
};

const FIXTURE_PAGES: readonly DocPage[] = [
  HOME_FIXTURE,
  PALETTE_FIXTURE,
  BUTTON_FIXTURE,
  CARD_FIXTURE,
];

/** Le message que jette le spécimen fautif, relu dans le rendu de la frontière. */
const BOUNDARY_MESSAGE = 'spécimen fautif';

/** Un composant de spécimen qui jette — le `Pill` sans libellé de l'incident. */
function Faulty(): never {
  throw new Error(BOUNDARY_MESSAGE);
}

/** Une page dont le CORPS jette : la faute est dans un composant du spécimen. */
const FAULTY_BODY_FIXTURE: DocPage = {
  slug: 'composants/pill',
  label: 'Pill',
  group: 'composants',
  title: 'Pill',
  render: () => <Faulty />,
};

/** Une page dont `render()` LUI-MÊME jette, avant qu'aucun composant ne rende. */
const FAULTY_RENDER_FIXTURE: DocPage = {
  slug: 'composants/tag',
  label: 'Tag',
  group: 'composants',
  title: 'Tag',
  render: () => {
    throw new Error(BOUNDARY_MESSAGE);
  },
};

const BOUNDARY_PAGES: readonly DocPage[] = [
  HOME_FIXTURE,
  PALETTE_FIXTURE,
  FAULTY_BODY_FIXTURE,
  FAULTY_RENDER_FIXTURE,
];

/**
 * Le même registre, DÉCLARÉ DANS LE DÉSORDRE.
 *
 * Le vrai registre est déjà écrit dans l'ordre des groupes, si bien qu'un test
 * d'ordre mené sur lui seul ne saurait pas distinguer « la nav suit `GROUPS` »
 * de « la nav suit l'ordre de déclaration ». Ici les deux divergent.
 */
const SCRAMBLED_PAGES: readonly DocPage[] = [
  BUTTON_FIXTURE,
  PALETTE_FIXTURE,
  CARD_FIXTURE,
  HOME_FIXTURE,
];

/** L'ordre attendu dans la barre : les groupes de `GROUPS`, puis la déclaration. */
function navOrderOf(pages: readonly DocPage[]): readonly DocNavEntry[] {
  return navEntriesForPages(pages);
}

function sommaire(): HTMLElement {
  return screen.getByRole('navigation', { name: 'Sommaire' });
}

/**
 * Les liens de la barre de gauche, dans l'ordre du DOM.
 *
 * Bornés à la nav : le lien de marque de la barre du haut pointe aussi vers
 * l'accueil, et le compter ferait passer un sommaire à qui il manque une
 * entrée.
 */
function navLinks(): readonly HTMLElement[] {
  return within(sommaire()).queryAllByRole('link');
}

function labelsOf(links: readonly HTMLElement[]): readonly string[] {
  return links.map((link) => link.textContent ?? '');
}

function hrefsOf(links: readonly HTMLElement[]): readonly (string | null)[] {
  return links.map((link) => link.getAttribute('href'));
}

/** Les liens qui se déclarent comme la page courante. */
function currentLinks(): readonly HTMLElement[] {
  return navLinks().filter((link) => link.getAttribute('aria-current') === 'page');
}

/**
 * Ce qui a le focus : la balise ET son texte.
 *
 * Le texte n'est pas décoratif dans l'assertion : sur `<h1>` seul, un focus
 * resté sur le titre de la page QUITTÉE passerait pour juste. C'est le libellé
 * qui prouve que le focus a suivi la bonne page.
 */
function describeActiveElement(): string {
  const active = document.activeElement;

  if (active === null) return '(aucun)';

  const id = active.id ? ` id="${active.id}"` : '';
  const text = active.textContent?.trim().slice(0, 40) ?? '';

  return `<${active.tagName.toLowerCase()}${id}> « ${text} »`;
}

/**
 * Navigue comme le ferait un clic sur une entrée du sommaire.
 *
 * jsdom émet bien un `hashchange` quand on écrit `location.hash`, mais de
 * façon DIFFÉRÉE : l'émettre nous-mêmes dans l'`act` rend le test
 * déterministe. Le second passage, celui de jsdom, est inoffensif —
 * `getSnapshot` rend la même chaîne, donc React ne réengage aucun rendu.
 */
function navigate(hash: string): void {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new Event('hashchange'));
  });
}

/** Remet l'adresse à la racine SANS émettre `hashchange`. */
function resetRoute(): void {
  window.history.replaceState(null, '', '/');
}

beforeEach(() => {
  resetRoute();
  document.title = '';
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetRoute();
});

describe('DocShell — la note de version', () => {
  /* La demande, mot pour mot : « tout en haut de la liste du sommaire de
     gauche, une note de version ». Premier ENFANT, donc : la trouver quelque
     part dans la nav ne suffit pas. */
  it('devrait rendre la note de version en premier enfant du sommaire', () => {
    render(<DocShell pages={PAGES} />);

    const first = sommaire().firstElementChild;

    expect(
      first?.textContent ?? '(le sommaire est vide)',
      `le premier enfant du sommaire est ` +
        `<${first?.tagName.toLowerCase() ?? 'rien'}> « ${first?.textContent ?? ''} » ` +
        `et ne porte pas la version ${UI_VERSION}`,
    ).toContain(UI_VERSION);
  });

  it('devrait rendre la note de version même sur un registre vide', () => {
    render(<DocShell pages={[]} />);

    expect(
      sommaire().firstElementChild?.textContent ?? '(le sommaire est vide)',
      `un registre vide fait disparaître la note de version — elle ne dépend ` +
        `pas des pages, elle dit quel paquet on lit`,
    ).toContain(UI_VERSION);
  });
});

describe('DocShell — les onglets du header', () => {
  it('devrait rendre Accueil, Installation et Notes de versions dans cet ordre', () => {
    render(<DocShell pages={PAGES} />);

    const links = within(
      screen.getByRole('navigation', { name: 'Navigation principale' }),
    ).getAllByRole('link');

    expect(links.map((link) => link.textContent)).toEqual([
      'Accueil',
      'Installation',
      'Notes de versions',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      hrefFor(''),
      hrefFor('installation'),
      hrefFor('notes-de-versions'),
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
  });

  it('devrait préparer un menu compact pour les largeurs où les onglets ne tiennent plus', () => {
    render(<DocShell pages={PAGES} />);

    const menu = document.querySelector('.tc-doc-topbar__menu');

    expect(menu).toBeInstanceOf(HTMLDetailsElement);
    expect(menu?.querySelector('summary')).toHaveAttribute('aria-label', 'Ouvrir le menu');
    expect(menu?.querySelectorAll('.tc-doc-topbar__menu-nav a')).toHaveLength(3);
  });
});

describe('DocShell — la largeur du sommaire', () => {
  it('devrait prévisualiser la largeur directement pendant un glissement', () => {
    render(<DocShell pages={PAGES} />);

    const resizeHandle = screen.getByRole('slider', { name: 'Largeur du sommaire' });
    const body = document.querySelector('.tc-doc-body');

    expect(body).not.toBeNull();

    fireEvent.pointerDown(resizeHandle, { pointerId: 7, clientX: 100 });
    fireEvent.pointerMove(resizeHandle, { pointerId: 7, clientX: 124 });

    expect(body).toHaveStyle(`--tc-doc-nav-width: ${DOC_NAV_WIDTH_DEFAULT + 24}px`);
    expect(resizeHandle).toHaveAttribute('aria-valuenow', String(DOC_NAV_WIDTH_DEFAULT + 24));

    fireEvent.pointerUp(resizeHandle, { pointerId: 7, clientX: 124 });

    expect(body).toHaveStyle(`--tc-doc-nav-width: ${DOC_NAV_WIDTH_DEFAULT + 24}px`);
    expect(resizeHandle.closest('.tc-doc-nav')).not.toHaveAttribute('data-resizing');
  });

  it('devrait pouvoir être ajustée au clavier dans des bornes accessibles', async () => {
    const user = userEvent.setup();

    render(<DocShell pages={PAGES} />);

    const resizeHandle = screen.getByRole('slider', { name: 'Largeur du sommaire' });
    const body = document.querySelector('.tc-doc-body');

    expect(resizeHandle).toHaveAttribute('aria-valuemin', String(DOC_NAV_WIDTH_MIN));
    expect(resizeHandle).toHaveAttribute('aria-valuemax', String(DOC_NAV_WIDTH_MAX));
    expect(resizeHandle).toHaveAttribute('aria-valuenow', String(DOC_NAV_WIDTH_DEFAULT));
    expect(body?.getAttribute('style')).toContain(`--tc-doc-nav-width: ${DOC_NAV_WIDTH_DEFAULT}px`);

    resizeHandle.focus();
    await user.keyboard('{ArrowRight}');

    expect(resizeHandle).toHaveAttribute(
      'aria-valuenow',
      String(DOC_NAV_WIDTH_DEFAULT + DOC_NAV_WIDTH_STEP),
    );
    expect(body?.getAttribute('style')).toContain(
      `--tc-doc-nav-width: ${DOC_NAV_WIDTH_DEFAULT + DOC_NAV_WIDTH_STEP}px`,
    );

    await user.keyboard('{Home}');
    expect(resizeHandle).toHaveAttribute('aria-valuenow', String(DOC_NAV_WIDTH_MIN));

    await user.keyboard('{End}');
    expect(resizeHandle).toHaveAttribute('aria-valuenow', String(DOC_NAV_WIDTH_MAX));
  });
});

describe('DocShell — les entrées du sommaire', () => {
  /* LA promesse : « une entrée de nav par composant publié ». Elle est ici
     menée sur le VRAI registre, dont `registry.test.tsx` garantit par ailleurs
     qu'il couvre chaque composant publié. Les deux tests se tiennent : l'un
     dit que le registre est complet, l'autre que la barre le rend en entier. */
  it('devrait rendre une entrée par page du registre réel', () => {
    render(<DocShell pages={PAGES} />);

    const expected = navOrderOf(PAGES);

    expect(
      labelsOf(navLinks()),
      `le sommaire rend ${navLinks().length} entrées pour ${PAGES.length} pages ` +
        `du registre — une page sans entrée est une page qu'on ne peut atteindre ` +
        `qu'en tapant son adresse`,
    ).toEqual(expected.map((entry) => entry.label));
  });

  it('devrait donner à chaque entrée l’adresse canonique de sa page', () => {
    render(<DocShell pages={PAGES} />);

    expect(
      hrefsOf(navLinks()),
      `des entrées du sommaire ne pointent pas sur hrefFor(page.slug)`,
    ).toEqual(navOrderOf(PAGES).map((entry) => hrefFor(entry.page.slug)));
  });

  it('devrait ordonner les entrées par groupe de GROUPS puis par déclaration', () => {
    render(<DocShell pages={SCRAMBLED_PAGES} />);

    expect(
      labelsOf(navLinks()),
      `ordre rendu : ${labelsOf(navLinks()).join(' → ')} — la barre doit suivre ` +
        `l'ordre des groupes (${GROUPS.map((group) => group.id).join(', ')}), pas ` +
        `l'ordre de déclaration du registre`,
    ).toEqual(['Accueil', 'La palette', 'Button', 'Card']);
  });

  /* La réciproque : la barre n'invente rien. Sans elle, un sommaire qui
     ajouterait une entrée « Bientôt » sans page derrière passerait les tests
     précédents dès que le registre grandirait. */
  it('ne devrait rendre aucune entrée qui ne corresponde à une page', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    const known = new Set(FIXTURE_PAGES.map((page) => hrefFor(page.slug)));
    const strays = hrefsOf(navLinks()).filter((href) => href === null || !known.has(href));

    expect(
      strays,
      `entrées de sommaire sans page derrière : ${strays.join(', ')} — un clic ` +
        `y servirait l'accueil sans dire pourquoi`,
    ).toEqual([]);
  });

  /* `doc-nav.tsx` le promet explicitement : un groupe vide ne rend ni son
     titre ni sa liste, parce qu'un lecteur d'écran énonce une liste de zéro
     élément.

     CE TEST VISAIT « COMPOSITIONS », ET LA 2.0 L'AURAIT RENDU VACUEUX. Il
     s'appuyait sur le fait que `FIXTURE_PAGES` n'avait aucune page de ce
     groupe — or « compositions » n'est plus un groupe du tout, si bien que
     l'assertion « Compositions n'apparaît pas » serait devenue vraie quoi que
     fasse `doc-nav.tsx`. Les trois groupes restants sont TOUS peuplés par
     `FIXTURE_PAGES`, donc le registre complet ne peut plus servir à mesurer
     ça : le test construit maintenant son propre registre en retirant le seul
     page de « fondations », et vérifie que le groupe disparaît AVEC elle.
     Vérifié par mutation — en rendant le titre d'un groupe vide, il rougit. */
  it('ne devrait rendre ni titre ni liste pour un groupe sans page', () => {
    const sansFondations = FIXTURE_PAGES.filter((page) => page.group !== 'fondations');

    render(<DocShell pages={sansFondations} />);

    const nav = sommaire();

    /* CIBLÉ PAR L'ID DU LIBELLÉ STATIQUE, et non par le texte : un libellé de
       groupe peut aussi se retrouver dans une entrée de page, si bien qu'un
       `queryByText` en trouverait plusieurs. */
    expect(
      nav.querySelector('#tc-doc-nav-section-fondations'),
      `le groupe « Fondations » n'a plus aucune page dans ce registre et ne doit ` +
        `pas apparaître dans la barre`,
    ).toBeNull();
    /* DEUX listes et non trois : « introduction » et « composants ». Le
       chiffre est épinglé plutôt que déduit de `GROUPS.length - 1`, pour que
       l'ajout d'un groupe fasse relire ce test au lieu de le suivre. */
    expect(within(nav).getAllByRole('list')).toHaveLength(2);
  });

  /* Le pendant du précédent : avec les trois groupes peuplés, les trois sont
     rendus. Sans lui, un `doc-nav.tsx` qui ne rendrait jamais de groupe
     passerait le test ci-dessus. */
  it('devrait rendre une liste par groupe peuplé', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    const nav = sommaire();

    expect(
      within(nav).getAllByRole('list'),
      `les trois groupes de FIXTURE_PAGES ne rendent pas trois listes`,
    ).toHaveLength(3);
    for (const label of ['Introduction', 'Fondations', 'Composants']) {
      expect(
        [...nav.querySelectorAll('.tc-doc-nav__grouptitle')].some(
          (title) => title.textContent?.trim() === label,
        ),
        `le groupe « ${label} » a des pages dans ce registre et n'apparaît pas`,
      ).toBe(true);
    }
  });

  it('ne devrait rendre aucune entrée pour un registre vide', () => {
    render(<DocShell pages={[]} />);

    expect(labelsOf(navLinks()), `entrées rendues sans page à servir`).toEqual([]);
  });
});

describe('DocShell — la page courante', () => {
  it('devrait marquer d’aria-current="page" la seule entrée servie', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(
      labelsOf(currentLinks()),
      `entrées portant aria-current="page" : ${labelsOf(currentLinks()).join(', ') || '(aucune)'} ` +
        `— l'attribut doit désigner exactement le lien de la page à l'écran`,
    ).toEqual(['Accueil']);
  });

  it('devrait déplacer aria-current="page" après une navigation', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    navigate(hrefFor(BUTTON_FIXTURE.slug));

    expect(
      labelsOf(currentLinks()),
      `après navigation vers « ${BUTTON_FIXTURE.slug} », aria-current reste sur ` +
        `${labelsOf(currentLinks()).join(', ') || '(aucune entrée)'}`,
    ).toEqual(['Button']);
  });

  /* Sur un fragment inconnu c'est l'accueil qui est à l'écran, donc c'est
     l'accueil qui porte `aria-current` — pas le fragment demandé, qui ne
     correspond à rien. */
  it('devrait marquer l’accueil quand le fragment est inconnu', () => {
    window.history.replaceState(null, '', '/#/rien-de-tel');
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(labelsOf(currentLinks())).toEqual(['Accueil']);
  });
});

/* ============================================================================
   LA BASCULE DE LA BARRE DU HAUT — UNE, ET PLUS DEUX.

   CE QUE CE BLOC GARDAIT ET QU'IL NE PEUT PLUS GARDER. Il tenait deux AXES
   indépendants — le thème (clair / sombre) et le matériau (aplat / verre) — et
   sa vraie valeur était l'INDÉPENDANCE : qu'un clic sur l'un ne bouge pas
   l'autre. Le mode de défaillance visé était le copier-coller, deux boutons
   câblés sur le même hook s'annonçant encore correctement chacun de leur côté.

   L'axe du matériau est supprimé en 2.0 : la seule feuille qui lisait
   `data-material` était `glass.css`, qui n'est plus publiée, si bien que la
   bascule n'allumait plus rien. Il n'y a donc plus deux axes à croiser, et le
   garde d'indépendance n'a plus d'objet — il est retiré, pas affaibli. Ce qui
   RESTE vérifié ici, et qui ne l'était pas séparément par `theme-toggle` :
   que la coquille porte bien la bascule, qu'elle n'en porte qu'UNE (une
   seconde qui réapparaîtrait sans axe serait exactement le défaut qu'on vient
   de retirer), et que le clic écrit sur `<html>` et non seulement dans l'état
   React.
   ========================================================================== */
describe('DocShell — la bascule de la barre du haut', () => {
  const THEME_NAME = 'Thème sombre';

  function topbar() {
    return within(screen.getByRole('banner'));
  }

  /** Le texte des boutons de la barre, glyphes compris — pour les messages. */
  function toggleTexts(): readonly string[] {
    return topbar()
      .getAllByRole('button')
      .filter((button) => button.hasAttribute('aria-pressed'))
      .map((button) => button.textContent ?? '');
  }

  /**
   * Les attributs de présentation posés sur `<html>`.
   *
   * `data-material` EST ENCORE LU ICI, et c'est délibéré : le test doit dire si
   * quelqu'un remet une bascule de matériau sans remettre la feuille qui la
   * lit. Sa valeur attendue est `null` en permanence.
   */
  function documentAxes(): Record<string, string | null> {
    return {
      'data-theme': document.documentElement.getAttribute('data-theme'),
      'data-material': document.documentElement.getAttribute('data-material'),
    };
  }

  function pressed(): string | null {
    return (
      topbar().queryByRole('button', { name: THEME_NAME })?.getAttribute('aria-pressed') ?? null
    );
  }

  async function clickToggle(name: string) {
    const user = userEvent.setup();
    await user.click(topbar().getByRole('button', { name }));
  }

  it('devrait porter exactement une bascule', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(
      toggleTexts(),
      `boutons de la barre du haut : ${toggleTexts().join(' | ') || '(aucun)'} — la ` +
        `barre porte un axe par bouton, et il n'en reste qu'un depuis que l'axe du ` +
        `matériau a été retiré. Un second bouton ici est soit une bascule sans ` +
        `feuille pour la lire, soit un axe qu'il faut venir déclarer dans ce test`,
    ).toHaveLength(1);
    expect(pressed(), `la bascule de thème manque dans la barre du haut`).toBe('false');
  });

  /* Le setup global fournit un `matchMedia` figé sur `matches: false`, donc un
     système en clair, et vide le stockage avant chaque test : l'axe n'a pas
     été choisi. */
  it('ne devrait pas enfoncer la bascule quand rien n’a été choisi', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(pressed()).toBe('false');
    expect(documentAxes()).toEqual({ 'data-theme': 'light', 'data-material': null });
  });

  it('devrait écrire le thème sur le document au clic, et rien d’autre', async () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    await clickToggle(THEME_NAME);

    expect(pressed()).toBe('true');
    expect(
      documentAxes(),
      `le clic sur « ${THEME_NAME} » a écrit un second attribut de présentation sur ` +
        `<html> : aucune feuille publiée ne lit plus « data-material », donc rien ` +
        `ne doit le poser`,
    ).toEqual({ 'data-theme': 'dark', 'data-material': null });
  });

  it('ne devrait plus rendre de commande pour plier le sommaire', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(topbar().queryByRole('button', { name: 'Afficher ou masquer le sommaire' })).toBeNull();
    expect(document.querySelector('#tc-doc-nav-content')).toBeNull();
    expect(sommaire()).toBeInTheDocument();
  });
});

describe('DocShell — le rendu de la page', () => {
  /* Ce test est ce qui fait cesser d'être un postulat le `SHELL_HEADING_LEVEL
     = 1` de `registry.test.tsx` : c'est bien la coquille qui rend le titre de
     premier niveau, et elle n'en rend qu'un. */
  it('devrait rendre le titre de la page en un unique <h1>', () => {
    render(<DocShell pages={PAGES} />);

    const level1 = screen.getAllByRole('heading', { level: 1 });

    expect(
      level1.map((heading) => heading.textContent),
      `${level1.length} <h1> dans le document — la coquille en rend un, et les ` +
        `pages n'en rendent aucun`,
    ).toHaveLength(1);
  });

  it('devrait rendre le titre puis le corps de la page', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(
      screen.getByRole('main').textContent,
      `le contenu principal ne se lit pas « titre, corps »`,
    ).toBe('Le soclecorps de l’accueil');
  });

  it('devrait rendre l’accueil Opale sans la carte Beta de la référence', () => {
    render(<DocShell pages={PAGES} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Le design system de l’écosystème Opale.',
    );
    expect(screen.getByRole('heading', { name: 'Opale UI 3.0.0' })).toBeInTheDocument();
    expect(screen.getByText('91 composants')).toBeInTheDocument();
    expect(screen.queryByText(/Rejoindre la bêta/i)).toBeNull();
    expect(screen.queryByText(/Explorer/i)).toBeNull();
  });

  it('devrait présenter les composants comme Opale sans bloc API ni habillage de référence', () => {
    render(<DocShell pages={PAGES} />);

    navigate('#/composants/opale-button');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Button');
    /* L'`import` A CHANGÉ DE BLOC, PAS DE PAGE. Il vivait dans une plaque de
       code figée en tête, qui répétait mot pour mot l'extrait dépliable juste
       en dessous ; la plaque est supprimée et l'`import` a rejoint l'extrait.

       LE TEST DÉPLIE, PARCE QUE LE PANNEAU EST `aria-hidden` QUAND IL EST
       REPLIÉ — et c'est correct : ce qu'on ne peut pas voir ne doit pas être
       dans l'arbre d'accessibilité. Interroger le DOM par-dessous aurait fait
       passer le test sur un contenu qu'aucun utilisateur n'atteint. On clique
       donc, comme on le ferait.

       Et l'on compare des `textContent` plutôt qu'un texte : la coloration
       syntaxique découpe la ligne en un `<span>` par jeton, donc aucun nœud ne
       porte la phrase entière. */
    fireEvent.click(screen.getByRole('button', { name: 'Afficher le code' }));

    expect(
      screen.getByRole('group', { name: 'Exemple Button, défilement horizontal' }).textContent,
    ).toContain("import { Opale } from '@thomascaron/opale-ui';");
    expect(screen.queryByRole('heading', { name: 'API' })).toBeNull();
    expect(screen.queryByText(/Explorer/i)).toBeNull();
  });

  it('ne devrait rien insérer entre le titre et le corps quand la page n’a pas de chapeau', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    navigate(hrefFor(PALETTE_FIXTURE.slug));

    expect(
      screen.getByRole('main').textContent,
      `un chapeau vide est rendu alors que la page n'en déclare pas`,
    ).toBe('La palettecorps de la palette');
  });
});

describe('DocShell — la navigation par fragment', () => {
  it('devrait remplacer le contenu au changement de fragment', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    navigate(hrefFor(BUTTON_FIXTURE.slug));

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Button');
    expect(screen.getByText('corps de Button')).toBeInTheDocument();
  });

  it('devrait faire disparaître le contenu de la page quittée', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    navigate(hrefFor(BUTTON_FIXTURE.slug));

    expect(
      screen.queryByText('corps de l’accueil'),
      `le corps de l'accueil est encore à l'écran après la navigation — les deux ` +
        `pages se superposent`,
    ).toBeNull();
  });

  it('devrait mettre à jour le titre du document à la page servie', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    navigate(hrefFor(BUTTON_FIXTURE.slug));

    expect(document.title).toBe(`Button${TITLE_SUFFIX}`);
  });

  /* La forme tolérée, héritée des liens écrits à la main du temps de la page
     unique : `#palette` sans barre oblique désigne la même page. */
  it('devrait servir la même page pour la forme #slug sans barre oblique', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    navigate('#palette');

    expect(
      screen.getByRole('heading', { level: 1 }).textContent,
      `« #palette » ne sert pas la page « palette » — les liens des spécimens ` +
        `écrits avant la refonte tombent tous sur l'accueil`,
    ).toBe('La palette');
  });

  it('devrait revenir à l’accueil sur le fragment racine', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);
    navigate(hrefFor(BUTTON_FIXTURE.slug));

    navigate(hrefFor(HOME_SLUG));

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Le socle');
  });

  /* Le vrai registre, avec l'adresse que `registry.test.tsx` garantit — le
     kebab-case du libellé sous le préfixe `composants/`, et `opale-` pour les
     composants ajoutés au catalogue V3. */
  it('devrait servir la page de Button du catalogue Opale sur #/composants/opale-button', () => {
    const expected = PAGES.find((page) => page.slug === 'composants/opale-button');

    render(<DocShell pages={PAGES} />);
    navigate('#/composants/opale-button');

    expect(
      screen.getByRole('heading', { level: 1 }).textContent,
      `page attendue : « ${expected?.title ?? '(aucune page de slug composants/button)'} »`,
    ).toBe(expected?.title);
  });
});

describe('DocShell — le fragment inconnu', () => {
  it('devrait servir l’accueil sur un fragment inconnu', () => {
    window.history.replaceState(null, '', '/#/rien-de-tel');
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(
      screen.getByRole('heading', { level: 1 }).textContent,
      `un fragment inconnu doit servir l'accueil, jamais une page blanche`,
    ).toBe('Le socle');
  });

  /* La coquille documente ce choix et il se teste : réécrire l'adresse — par
     `replaceState` ou en corrigeant le `hash` — remplacerait l'entrée
     d'historique d'origine, donc casserait le bouton « retour ». */
  it('ne devrait pas réécrire l’adresse sur un fragment inconnu', () => {
    window.history.replaceState(null, '', '/#/rien-de-tel');
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(
      window.location.hash,
      `l'adresse a été réécrite : le bouton « retour » ne ramène plus à la page ` +
        `d'où venait le visiteur`,
    ).toBe('#/rien-de-tel');
  });

  it('devrait titrer le document du nom de la page servie, pas du fragment demandé', () => {
    window.history.replaceState(null, '', '/#/rien-de-tel');
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(document.title).toBe(`Le socle${TITLE_SUFFIX}`);
  });
});

describe('DocShell — le repli du registre', () => {
  it('devrait dire qu’aucune page n’est servable plutôt que rendre une page blanche', () => {
    render(<DocShell pages={[]} />);

    expect(
      screen.getByRole('heading', { level: 1 }).textContent,
      `un registre vide doit rendre la page de diagnostic de la coquille`,
    ).toBe(EMPTY_REGISTRY_TITLE);
  });

  it('devrait se replier de même quand le registre n’a pas de page d’accueil', () => {
    window.history.replaceState(null, '', '/#/rien-de-tel');
    render(<DocShell pages={[PALETTE_FIXTURE]} />);

    expect(
      screen.getByRole('heading', { level: 1 }).textContent,
      `sans page de slug '' et sur un fragment inconnu, la coquille n'a rien à ` +
        `servir : elle doit le dire`,
    ).toBe(EMPTY_REGISTRY_TITLE);
  });

  it('devrait servir une page connue même si le registre n’a pas d’accueil', () => {
    window.history.replaceState(null, '', `/${hrefFor(PALETTE_FIXTURE.slug)}`);
    render(<DocShell pages={[PALETTE_FIXTURE]} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('La palette');
  });
});

/* ============================================================================
   LE FOCUS — sous `StrictMode`, et ce n'est pas décoratif.

   Le garde de la coquille est une `useRef` que React CONSERVE au double
   montage du mode strict. Un test rendu hors mode strict ne verrait donc
   jamais le scénario contre lequel ce garde existe : le second montage
   volerait le focus au chargement.

   LA CIBLE EST LE `<h1>`, PAS `<main>`, et c'est un choix mesuré par l'audit
   d'accessibilité : `<main>` fait la hauteur de la page, donc son anneau de
   `:focus-visible` devenait un rectangle de plusieurs milliers de pixels dont
   on ne voyait que deux traits verticaux, bord haut passant sous la barre
   collante (WCAG 2.4.7) ; et un `<main>` sans nom accessible s'annonce
   « main », c'est-à-dire rien, là où un titre focalisé s'annonce « Button,
   titre niveau 1 ». `<main id="contenu" tabIndex={-1}>` reste — c'est le filet
   du `href="#contenu"` tant que le gestionnaire de clic n'est pas attaché —
   mais plus rien ne le focalise par code.
   ========================================================================== */
describe('DocShell — le focus', () => {
  it('ne devrait pas prendre le focus au premier rendu', () => {
    render(
      <StrictMode>
        <DocShell pages={FIXTURE_PAGES} />
      </StrictMode>,
    );

    expect(
      document.activeElement,
      `le focus est sur ${describeActiveElement()} au chargement — WCAG 3.2.1 : ` +
        `personne n'a demandé de changement de contexte`,
    ).toBe(document.body);
  });

  /* Sans `tabindex="-1"`, `focus()` sur un titre ne fait RIEN, et ne le dit
     pas : même famille de panne que le `ref` manquant, que l'optional chaining
     avalait. Le garde porte donc sur l'attribut, pas seulement sur l'effet. */
  it('devrait rendre le titre de la page focalisable par le code', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(
      screen.getByRole('heading', { level: 1 }),
      `le <h1> n'est pas focalisable : focus() n'aura aucun effet et aucune ` +
        `erreur — la navigation laissera le focus au début du document`,
    ).toHaveAttribute('tabindex', '-1');
  });

  it('devrait donner le focus au titre de la page servie après une navigation', () => {
    render(
      <StrictMode>
        <DocShell pages={FIXTURE_PAGES} />
      </StrictMode>,
    );

    navigate(hrefFor(PALETTE_FIXTURE.slug));

    expect(
      describeActiveElement(),
      `après navigation le focus est sur ${describeActiveElement()} — il doit ` +
        `aller sur le <h1> de la page servie, qui s'annonce « La palette, titre ` +
        `niveau 1 » et pose l'anneau là où l'œil doit aller`,
    ).toBe('<h1> « La palette »');
  });

  /* Le scénario que le mode strict rend piégeux : le garde de la coquille est
     une CHAÎNE et non un drapeau « déjà monté ». Un drapeau serait déjà vrai
     au second montage, donc raterait cette PREMIÈRE navigation réelle. */
  it('devrait donner le focus au titre dès la première navigation réelle sous StrictMode', () => {
    render(
      <StrictMode>
        <DocShell pages={FIXTURE_PAGES} />
      </StrictMode>,
    );

    navigate(hrefFor(BUTTON_FIXTURE.slug));

    expect(
      describeActiveElement(),
      `focus sur ${describeActiveElement()} après la première navigation réelle`,
    ).toBe('<h1> « Button »');
  });
});

/* ============================================================================
   L'ABSENCE DE RÉGION LIVE — une garde de non-régression.

   La coquille avait une région `role="status"` qui recevait le titre de la
   page ; elle a été SUPPRIMÉE parce qu'elle doublait l'annonce du titre
   focalisé — « région principale, Card, titre niveau 1 … Card ». Le titre
   focalisé est le seul porteur, et c'est le mécanisme le plus universel des
   deux ; remettre la région ferait entendre le nom de la page deux fois.

   Portée volontairement restreinte au registre de TEST, et non au vrai : la
   prop `live` de `Message` pose légitimement un `role="status"`, et un futur
   spécimen qui l'emploie ne doit pas faire rougir une garde qui parle de la
   coquille. C'est la limite de cette garde, et elle est assumée.
   ========================================================================== */
describe('DocShell — l’absence de région live', () => {
  it('ne devrait rendre aucune région live au premier rendu', () => {
    render(
      <StrictMode>
        <DocShell pages={FIXTURE_PAGES} />
      </StrictMode>,
    );

    expect(
      screen.queryAllByRole('status'),
      `la coquille rend une région live au chargement`,
    ).toEqual([]);
  });

  it('ne devrait rendre aucune région live après une navigation', () => {
    render(
      <StrictMode>
        <DocShell pages={FIXTURE_PAGES} />
      </StrictMode>,
    );

    navigate(hrefFor(PALETTE_FIXTURE.slug));

    expect(
      screen.queryAllByRole('status').map((region) => region.textContent),
      `la coquille annonce la page dans une région live EN PLUS du titre ` +
        `focalisé — le nom de la page s'entendrait deux fois`,
    ).toEqual([]);
  });
});

/* ============================================================================
   LE LIEN D'ÉVITEMENT — un lien qui ne doit PAS naviguer.

   `href="#contenu"` laissé au navigateur écrit `#contenu` dans l'adresse ; le
   routage lit TOUT le fragment, `parseSlug('#contenu')` rend le slug
   « contenu », aucune page ne correspond, et la coquille sert l'accueil. Le
   lien censé faire gagner du temps faisait donc PERDRE la page qu'on lisait —
   panne d'autant plus discrète que le focus, lui, atterrissait au bon endroit.
   ========================================================================== */
describe('DocShell — le lien d’évitement', () => {
  /** La coquille rendue sur une page profonde, prête à évitement. */
  async function renderOnDeepPage() {
    const user = userEvent.setup();

    render(<DocShell pages={FIXTURE_PAGES} />);
    navigate(hrefFor(BUTTON_FIXTURE.slug));

    return { user, skip: screen.getByRole('link', { name: 'Aller au contenu' }) };
  }

  /* Le FILET, que l'audit a délibérément gardé : tant que le gestionnaire de
     clic n'est pas attaché (chargement, hydratation), c'est le `href` seul qui
     doit déplacer le focus. Il lui faut donc une cible qui existe ET qui soit
     focalisable — `<main id="contenu" tabIndex={-1}>`. */
  it('devrait pointer sur un élément qui existe', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    const skip = screen.getByRole('link', { name: 'Aller au contenu' });

    expect(
      document.getElementById(skip.getAttribute('href')?.slice(1) ?? ''),
      `le href du lien d'évitement (« ${skip.getAttribute('href')} ») ne désigne ` +
        `aucun élément : le filet ne rattrape rien`,
    ).not.toBeNull();
  });

  it('devrait viser un élément focalisable sans son gestionnaire', () => {
    render(<DocShell pages={FIXTURE_PAGES} />);

    expect(
      document.getElementById(MAIN_ID),
      `<main id="${MAIN_ID}"> n'est plus focalisable : le href seul déplacerait ` +
        `le défilement mais pas le focus`,
    ).toHaveAttribute('tabindex', '-1');
  });

  it('ne devrait pas changer l’adresse depuis une page profonde', async () => {
    const { user, skip } = await renderOnDeepPage();

    await user.click(skip);

    expect(
      window.location.hash,
      `l'adresse est devenue « ${window.location.hash} » — le routage en tirera ` +
        `un slug inconnu et servira l'accueil, donc le lien fait perdre la page lue`,
    ).toBe(hrefFor(BUTTON_FIXTURE.slug));
  });

  it('ne devrait pas changer la page rendue', async () => {
    const { user, skip } = await renderOnDeepPage();

    await user.click(skip);

    expect(
      screen.getByRole('heading', { level: 1 }).textContent,
      `la page rendue a changé en activant le lien d'évitement`,
    ).toBe('Button');
  });

  it('ne devrait pas déplacer aria-current', async () => {
    const { user, skip } = await renderOnDeepPage();

    await user.click(skip);

    expect(
      labelsOf(currentLinks()),
      `aria-current a suivi le lien d'évitement : ${labelsOf(currentLinks()).join(', ') || '(aucune entrée)'}`,
    ).toEqual(['Button']);
  });

  /* Le lien vise le TITRE et non `<main>`, pour la même raison que le
     changement de route : c'est là que la lecture reprend, et c'est le seul
     des deux qui s'annonce. */
  it('devrait donner le focus au titre de la page lue', async () => {
    const { user, skip } = await renderOnDeepPage();

    await user.click(skip);

    expect(
      describeActiveElement(),
      `le focus est sur ${describeActiveElement()} — un lien d'évitement qui ne ` +
        `déplace pas le focus ne fait rien pour qui navigue au clavier`,
    ).toBe('<h1> « Button »');
  });
});

/* ============================================================================
   LA FRONTIÈRE D'ERREUR DU CONTENU.

   Ces tests ÉCRIVENT dans `console.error` — c'est le contrat de la frontière,
   qui laisse la pile dans la console. L'espion est donc local à ce bloc et
   restauré par l'`afterEach` du fichier : le garde « aucune page du registre
   n'écrit dans console.error » de `registry.test.tsx` n'en sait rien, il court
   sur le VRAI registre, dont aucune page ne jette.
   ========================================================================== */
describe('DocShell — la frontière d’erreur du contenu', () => {
  let errors: string[] = [];

  beforeEach(() => {
    errors = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map((arg) => String(arg)).join(' '));
    });
  });

  it('devrait garder le sommaire et la bascule quand une page jette', () => {
    render(<DocShell pages={BOUNDARY_PAGES} />);

    navigate(hrefFor(FAULTY_BODY_FIXTURE.slug));

    expect(
      labelsOf(navLinks()),
      `le sommaire a disparu avec la page fautive — c'est précisément ce qui ` +
        `permet d'aller voir ailleurs`,
    ).toEqual(['Accueil', 'La palette', 'Pill', 'Tag']);
    /* La bascule aussi : une page fautive ne doit pas laisser le visiteur
       bloqué dans le thème où il se trouvait. Il n'y en a plus qu'une — l'axe
       du matériau a été retiré avec la feuille qui le lisait. */
    expect(screen.getByRole('button', { name: /Thème sombre/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /opaleUI/ })).toBeInTheDocument();
  });

  it('devrait rendre le message d’erreur à la place du contenu de la page', () => {
    render(<DocShell pages={BOUNDARY_PAGES} />);

    navigate(hrefFor(FAULTY_BODY_FIXTURE.slug));

    expect(
      screen.getByRole('alert').textContent,
      `la frontière ne dit pas ce qui a échoué`,
    ).toContain(BOUNDARY_MESSAGE);
  });

  it('devrait garder le titre de la page fautive, rendu hors de la frontière', () => {
    render(<DocShell pages={BOUNDARY_PAGES} />);

    navigate(hrefFor(FAULTY_BODY_FIXTURE.slug));

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pill');
  });

  /* Le rôle de `resetKey` : sans lui, la frontière reste en état d'erreur pour
     toutes les pages suivantes et le site paraît cassé après un seul incident. */
  it('devrait remettre la frontière à zéro en naviguant vers une page saine', () => {
    render(<DocShell pages={BOUNDARY_PAGES} />);
    navigate(hrefFor(FAULTY_BODY_FIXTURE.slug));

    navigate(hrefFor(PALETTE_FIXTURE.slug));

    expect(
      screen.queryByRole('alert'),
      `la frontière reste en erreur sur une page saine — un seul incident ` +
        `condamnerait les vingt autres pages`,
    ).toBeNull();
    expect(screen.getByText('corps de la palette')).toBeInTheDocument();
  });

  it('devrait nommer le slug fautif dans console.error', () => {
    render(<DocShell pages={BOUNDARY_PAGES} />);

    navigate(hrefFor(FAULTY_BODY_FIXTURE.slug));

    expect(
      errors.join('\n'),
      `console.error n'a rien reçu qui nomme « ${FAULTY_BODY_FIXTURE.slug} » — ` +
        `sans le slug, la trace ne dit pas quelle page corriger. Reçu :\n${errors.join('\n')}`,
    ).toContain(FAULTY_BODY_FIXTURE.slug);
  });

  /* Le second mode de défaillance, et il n'est pas le même : ici c'est
     `render()` qui jette, pas un composant de l'arbre qu'il retourne. */
  it('devrait borner aussi une page dont render() jette lui-même', () => {
    window.history.replaceState(null, '', `/${hrefFor(FAULTY_RENDER_FIXTURE.slug)}`);

    expect(
      () => render(<DocShell pages={BOUNDARY_PAGES} />),
      `l'erreur de « ${FAULTY_RENDER_FIXTURE.slug} » remonte hors de la coquille : ` +
        `page.render() est évalué PENDANT le rendu de DocShell, donc au-dessus de ` +
        `<PageBoundary>, qui ne peut rien intercepter`,
    ).not.toThrow();
  });
});

describe('DocShell — le démontage', () => {
  it('devrait retirer son écouteur hashchange au démontage', () => {
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<DocShell pages={FIXTURE_PAGES} />);
    unmount();

    const subscribed = added.mock.calls
      .filter(([type]) => type === 'hashchange')
      .map(([, listener]) => listener);
    const released = removed.mock.calls
      .filter(([type]) => type === 'hashchange')
      .map(([, listener]) => listener);
    const leaked = subscribed.filter((listener) => !released.includes(listener));

    expect(
      leaked.length,
      `${leaked.length} écouteur(s) hashchange survivent au démontage sur ` +
        `${subscribed.length} posé(s) — chaque montage de la vitrine en laisserait un`,
    ).toBe(0);
  });

  it('ne devrait plus rien mettre à jour après le démontage', () => {
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map((arg) => String(arg)).join(' '));
    });

    const { unmount } = render(<DocShell pages={FIXTURE_PAGES} />);
    unmount();

    const titleAfterUnmount = document.title;
    window.location.hash = hrefFor(PALETTE_FIXTURE.slug);
    window.dispatchEvent(new Event('hashchange'));

    expect(document.title, `le titre du document a bougé après le démontage`).toBe(
      titleAfterUnmount,
    );
    expect(errors, `React a averti après le démontage :\n${errors.join('\n')}`).toEqual([]);
  });
});
