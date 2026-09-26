import { describe, expect, it } from 'vitest';
import type { DocGroupId, DocPage } from './doc-model';
import { GROUPS } from './doc-model';
import { MAX_SUGGESTIONS, normalize, searchPages } from './search-model';

/* ============================================================================
   CE QUE CE FICHIER GARDE

   `search-model.ts` annonce dans ses propres commentaires quatre promesses que
   rien n'exécutait : la normalisation des diacritiques (« personne ne tape les
   accents dans une barre de recherche »), le classement en cinq rangs, la
   STABILITÉ du tri (« deux pages de même rang sortent dans l'ordre du
   registre ») et le plafond de huit avec son total non plafonné.

   AUCUNE PAGE RÉELLE ICI, ET C'EST LA CONDITION POUR QUE CES TESTS SURVIVENT.
   Un garde du classement écrit sur `PAGES` rougirait le jour où une vingt-
   cinquième page arrive avec un libellé qui contient la requête — l'ajout
   d'une page n'est pas une régression du classement. Les fixtures ci-dessous
   sont donc fabriquées, avec des libellés choisis pour que chaque rang soit
   atteint par un seul chemin.

   L'EXCEPTION EST LE GROUPE. `GROUP_LABELS` est indexé à l'import depuis le
   `GROUPS` réel : une fixture ne peut pas inventer son groupe, sinon le rang
   « nom de groupe » ne serait jamais atteignable. Les fixtures portent donc de
   vrais `DocGroupId`, et le test du groupe lit `GROUPS` plutôt que de recopier
   « Fondations ».
   ========================================================================== */

interface PageSeed {
  readonly label: string;
  readonly group: DocGroupId;
  /** Absent, le titre vaut le libellé — le cas courant du registre. */
  readonly title?: string;
  readonly searchTerms?: readonly string[];
}

/**
 * Une page de test. `render` ne sert jamais ici : le modèle de recherche ne
 * lit que `label`, `title` et `group`, et c'est précisément ce qui le rend
 * testable sans navigateur.
 */
function pageOf(seed: PageSeed): DocPage {
  return {
    slug: `test/${seed.label.toLowerCase().replace(/\s+/g, '-')}`,
    label: seed.label,
    group: seed.group,
    title: seed.title ?? seed.label,
    searchTerms: seed.searchTerms,
    render: () => null,
  };
}

/** Les libellés rendus, dans l'ordre où la recherche les a classés. */
function labelsOf(result: { readonly suggestions: readonly { page: DocPage }[] }): string[] {
  return result.suggestions.map((suggestion) => suggestion.page.label);
}

describe('normalize', () => {
  it.each([
    ['une capitale isolée', 'Button', 'button'],
    ['une chaîne déjà normalisée', 'button', 'button'],
    ['des capitales partout', 'ÉLÉVATION', 'elevation'],
    ['un accent aigu et un accent sur la casse mêlés', 'Élévation', 'elevation'],
    ['un accent aigu final', 'Accessibilité', 'accessibilite'],
    ['une cédille', 'Façade', 'facade'],
    ['un tréma et un accent grave', 'Où naïf', 'ou naif'],
    ['les espaces internes, qui sont conservés', 'Espacement et rayons', 'espacement et rayons'],
    ['la chaîne vide', '', ''],
  ])('devrait rendre la forme minuscule et sans diacritiques pour %s', (_case, input, expected) => {
    expect(normalize(input)).toBe(expected);
  });

  it('devrait laisser tels quels les caractères non latins', () => {
    // Pas de casse, pas de marque combinante à retirer : la fonction doit
    // rendre l'entrée intacte plutôt que de la vider ou de la translittérer.
    expect(normalize('日本語')).toBe('日本語');
    expect(normalize('42 % — €')).toBe('42 % — €');
  });

  it('ne devrait pas séparer une ligature, qui n’est pas un diacritique', () => {
    /* LIMITE ASSUMÉE, ÉPINGLÉE ICI POUR QU'ELLE SOIT UN CHOIX ET NON UNE
       SURPRISE : `NFD` ne décompose pas « œ » (ce n'est pas une lettre
       accentuée mais une lettre à part entière), donc taper « coeur » ne
       trouverait pas une page « Cœur ». Aucun libellé du registre n'en
       contient ; le jour où l'un en contient, ce test dit où regarder. */
    expect(normalize('Cœur')).toBe('cœur');
  });
});

describe('searchPages — la promesse centrale : trouver malgré les accents', () => {
  const ELEVATION = pageOf({ label: 'Élévation', group: 'fondations' });
  const ACCESSIBILITE = pageOf({ label: 'Accessibilité', group: 'fondations' });
  const PAGES = [ELEVATION, ACCESSIBILITE];

  it.each(['elevation', 'ELEVATION', 'élévation', 'Élévation', 'Elevation'])(
    'devrait trouver « Élévation » quand on tape « %s »',
    (query) => {
      const result = searchPages(PAGES, query);

      expect(
        labelsOf(result),
        `« ${query} » ne trouve pas « Élévation » — sans décomposition NFD, une ` +
          `doc en français est introuvable au clavier`,
      ).toEqual(['Élévation']);
      expect(result.total).toBe(1);
    },
  );

  it.each(['acces', 'ACCES', 'accès', 'accessibilite', 'accessibilité'])(
    'devrait trouver « Accessibilité » quand on tape « %s »',
    (query) => {
      expect(labelsOf(searchPages(PAGES, query))).toEqual(['Accessibilité']);
    },
  );

  it('devrait ignorer les espaces autour de la requête', () => {
    expect(labelsOf(searchPages(PAGES, '  elevation  '))).toEqual(['Élévation']);
  });
});

describe('searchPages — la requête sans contenu', () => {
  const PAGES = [pageOf({ label: 'Button', group: 'composants' })];

  it.each([
    ['vide', ''],
    ['un espace', ' '],
    ['des espaces seuls', '     '],
    ['une tabulation et un retour à la ligne', '\t\n '],
  ])('ne devrait rien rendre pour une requête %s', (_case, query) => {
    /* LE SOMMAIRE DE GAUCHE EST DÉJÀ LA LISTE COMPLÈTE : une requête vide qui
       rendrait les pages mettrait deux navigations concurrentes à l'écran. */
    expect(searchPages(PAGES, query)).toEqual({ suggestions: [], total: 0 });
  });

  it('ne devrait rien rendre quand aucune page ne correspond', () => {
    expect(searchPages(PAGES, 'xyzzy')).toEqual({ suggestions: [], total: 0 });
  });

  it('ne devrait rien rendre sur un registre vide', () => {
    expect(searchPages([], 'button')).toEqual({ suggestions: [], total: 0 });
  });
});

describe('searchPages — le classement, rang par rang', () => {
  /* UNE SEULE REQUÊTE POUR LES SIX RANGS, et c'est ce qui rend l'ordre
     comparable : « on » est atteignable par chacun des six chemins, y compris
     par le nom de groupe (« Introduction »), qu'aucune autre requête courte ne
     touche sans toucher aussi un libellé. */
  const QUERY = 'on';

  /** Le libellé COMMENCE par la requête. */
  const LABEL_PREFIX = pageOf({ label: 'Onglets', group: 'composants' });
  /** Un mot du libellé commence par la requête, mais pas le libellé. */
  const WORD_PREFIX = pageOf({ label: 'Barre onglet', group: 'composants' });
  /** Le libellé contient la requête, hors tête de mot. */
  const LABEL_INFIX = pageOf({ label: 'Contraste', group: 'fondations' });
  /** Seul le titre contient la requête. */
  const TITLE_INFIX = pageOf({
    label: 'Palette',
    group: 'fondations',
    title: 'Le contrat de couleur',
  });
  /** Seul un terme d'API ou un ancien nom contient la requête. */
  const SEARCH_TERM = pageOf({ label: 'Aide', group: 'composants', searchTerms: ['Ancienne fonction'] });
  /** Ni le libellé ni le titre : seul le nom du groupe « Introduction ». */
  const GROUP_INFIX = pageOf({ label: 'Repères', group: 'introduction', title: 'Les repères' });

  /** Volontairement à l'envers du classement attendu : le tri doit tout bouger. */
  const PAGES = [GROUP_INFIX, SEARCH_TERM, TITLE_INFIX, LABEL_INFIX, WORD_PREFIX, LABEL_PREFIX];

  it('classe libellé, titre, termes de recherche, puis nom de groupe', () => {
    const result = searchPages(PAGES, QUERY);

    expect(
      labelsOf(result),
      `ordre rendu : ${labelsOf(result).join(' < ') || '(vide)'} — le classement ` +
        `est la seule chose qui distingue une recherche utile d'un filtre`,
    ).toEqual(['Onglets', 'Barre onglet', 'Contraste', 'Palette', 'Aide', 'Repères']);
  });

  it('devrait rendre des rangs strictement croissants dans l’ordre de sortie', () => {
    const ranks = searchPages(PAGES, QUERY).suggestions.map((suggestion) => suggestion.rank);

    // Six rangs distincts et croissants : c'est ce qui garantit que les six
    // chemins de `rankOf` sont bien pris, et qu'aucun n'en recouvre un autre.
    expect(ranks).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it.each([
    ['un préfixe de libellé', 'ongl', 'Onglets'],
    ['un préfixe de mot', 'ongle', 'Barre onglet'],
    ['un infixe de libellé', 'trast', 'Contraste'],
    ['un infixe de titre', 'contrat', 'Palette'],
    ['un ancien nom', 'ancien', 'Aide'],
    ['un nom de groupe seul', 'introduc', 'Repères'],
  ])('devrait trouver par %s', (_case, query, expected) => {
    expect(labelsOf(searchPages(PAGES, query))).toContain(expected);
  });

  it('retrouve une page par propriété API et par plusieurs termes', () => {
    const CARD = pageOf({
      label: 'Card',
      group: 'composants',
      searchTerms: ['Glass', 'liquidGlass', 'surface vitrée'],
    });

    expect(labelsOf(searchPages([CARD], 'liquidGlass'))).toEqual(['Card']);
    expect(labelsOf(searchPages([CARD], 'Glass surface'))).toEqual(['Card']);
  });

  it('devrait préférer un préfixe de mot à un infixe de libellé', () => {
    /* Le cas le plus facile à inverser dans une implémentation : « ray »
       désigne « rayons » en tête de mot, et se cache au milieu de « crayon ».
       C'est le premier qu'on cherchait. */
    const RAYONS = pageOf({ label: 'Espacement et rayons', group: 'fondations' });
    const CRAYON = pageOf({ label: 'Crayon', group: 'composants' });

    expect(labelsOf(searchPages([CRAYON, RAYONS], 'ray'))).toEqual([
      'Espacement et rayons',
      'Crayon',
    ]);
  });
});

describe('searchPages — la stabilité du tri', () => {
  const CARD = pageOf({ label: 'Card', group: 'composants' });
  /* MÊME GROUPE QUE `CARD` DEPUIS LA 2.0, qui supprime « compositions ». Le
     groupe n'entrait pour rien dans ce que ce bloc mesure — deux libellés de
     MÊME rang doivent sortir dans l'ordre du tableau d'entrée — et les mettre
     dans le même groupe isole même mieux la propriété : il ne reste plus que
     l'ordre d'entrée pour les départager. Ni « composants » ni « compositions »
     ne contiennent « car », donc l'indexation du nom de groupe ne pesait pas
     sur le résultat. */
  const CARTE = pageOf({ label: 'Carte', group: 'composants' });
  /** Rang inférieur : il doit passer derrière, sans déranger les deux autres. */
  const ECARTS = pageOf({ label: 'Écarts', group: 'fondations' });

  it('devrait rendre deux pages de même rang dans l’ordre du tableau d’entrée', () => {
    expect(labelsOf(searchPages([ECARTS, CARD, CARTE], 'car'))).toEqual([
      'Card',
      'Carte',
      'Écarts',
    ]);
  });

  it('devrait suivre l’ordre d’entrée quand on l’inverse, et non un ordre à lui', () => {
    /* LE MÊME JEU DE PAGES, L'ORDRE D'ENTRÉE INVERSÉ. Si le tri était instable
       ou alphabétique, l'un des deux tests rougirait : c'est la paire qui fait
       la preuve, pas l'un des deux. */
    expect(labelsOf(searchPages([ECARTS, CARTE, CARD], 'car'))).toEqual([
      'Carte',
      'Card',
      'Écarts',
    ]);
  });
});

describe('searchPages — le plafond', () => {
  /** Dix libellés commençant tous par « b » : dix correspondances de rang 0. */
  const TEN_MATCHES: readonly DocPage[] = [
    'Badge',
    'Bandeau',
    'Barre',
    'Bloc',
    'Bordure',
    'Bouton',
    'Breadcrumb',
    'Bulle',
    'Button',
    'Brouillon',
  ].map((label) => pageOf({ label, group: 'composants' }));

  it('devrait valoir 8', () => {
    // La constante est une contrainte de hauteur documentée, pas un réglage :
    // elle est exportée, donc elle fait partie du contrat du module.
    expect(MAX_SUGGESTIONS).toBe(8);
  });

  it('devrait rendre exactement 8 suggestions au-delà du plafond', () => {
    const result = searchPages(TEN_MATCHES, 'b');

    expect(result.suggestions).toHaveLength(MAX_SUGGESTIONS);
  });

  it('devrait rendre le VRAI total au-delà du plafond, et non le nombre affiché', () => {
    const result = searchPages(TEN_MATCHES, 'b');

    expect(
      result.total,
      `total = ${result.total} — annoncer 8 là où il y en a 10 laisse croire ` +
        `qu'affiner la requête ne sert à rien`,
    ).toBe(10);
  });

  it('devrait garder les 8 PREMIÈRES du classement, pas huit au hasard', () => {
    expect(labelsOf(searchPages(TEN_MATCHES, 'b'))).toEqual([
      'Badge',
      'Bandeau',
      'Barre',
      'Bloc',
      'Bordure',
      'Bouton',
      'Breadcrumb',
      'Bulle',
    ]);
  });

  it('ne devrait pas tronquer à la limite exacte de 8', () => {
    const result = searchPages(TEN_MATCHES.slice(0, MAX_SUGGESTIONS), 'b');

    expect(result.suggestions).toHaveLength(8);
    expect(result.total).toBe(8);
  });

  it('devrait tronquer dès la limite plus une', () => {
    const result = searchPages(TEN_MATCHES.slice(0, MAX_SUGGESTIONS + 1), 'b');

    expect(result.suggestions).toHaveLength(8);
    expect(result.total).toBe(9);
  });
});

describe('searchPages — le libellé de groupe', () => {
  it('devrait rendre le libellé LISIBLE du groupe et non son identifiant', () => {
    const expected = GROUPS.find((group) => group.id === 'fondations')?.label;
    const [suggestion] = searchPages(
      [pageOf({ label: 'Élévation', group: 'fondations' })],
      'elevation',
    ).suggestions;

    expect(expected, 'la fixture cible un groupe qui n’existe plus dans GROUPS').toBe('Fondations');
    expect(
      suggestion?.groupLabel,
      `groupLabel = « ${suggestion?.groupLabel} » — la liste afficherait ` +
        `l'identifiant sous le libellé de la page`,
    ).toBe(expected);
  });

  it('devrait rendre un libellé de groupe pour chaque groupe du registre', () => {
    const pages = GROUPS.map((group) => pageOf({ label: 'Élévation', group: group.id }));

    expect(searchPages(pages, 'elevation').suggestions.map((one) => one.groupLabel)).toEqual(
      GROUPS.map((group) => group.label),
    );
  });
});

describe('searchPages — la requête qui ne touche que le nom du groupe', () => {
  const ELEVATION = pageOf({ label: 'Élévation', group: 'fondations' });
  const PALETTE = pageOf({ label: 'La palette', group: 'fondations', title: 'La palette' });
  const BUTTON = pageOf({ label: 'Button', group: 'composants' });

  it('devrait rendre les pages du groupe quand seul son nom correspond', () => {
    /* « fonda » n'est ni dans « Élévation » ni dans « La palette » : la seule
       raison pour laquelle ces deux pages sortent est leur groupe. */
    const result = searchPages([ELEVATION, PALETTE, BUTTON], 'fonda');

    expect(labelsOf(result)).toEqual(['Élévation', 'La palette']);
    expect(result.total).toBe(2);
  });

  it('ne devrait pas rendre les pages d’un autre groupe', () => {
    expect(labelsOf(searchPages([ELEVATION, PALETTE, BUTTON], 'fonda'))).not.toContain('Button');
  });

  it('devrait classer ces pages APRÈS toute correspondance de libellé', () => {
    // Le groupe est le rang le plus faible : une page nommée « Fondations » ou
    // presque doit passer devant les six pages du groupe.
    const FOND = pageOf({ label: 'Fondation d’un design system', group: 'composants' });

    expect(labelsOf(searchPages([ELEVATION, PALETTE, FOND], 'fonda'))).toEqual([
      'Fondation d’un design system',
      'Élévation',
      'La palette',
    ]);
  });
});
