import type { DocGroupId, DocPage } from './doc-model';
import { GROUPS } from './doc-model';

/* La correspondance de recherche, en fonctions pures testables sans
   navigateur : classement, normalisation, plafond. Balayage linéaire du
   registre, sans index ni dépendance ; les termes d'API et anciens noms sont
   déclarés sur les pages. */

/**
 * La forme normalisée d'une chaîne : minuscules, puis sans diacritiques
 * (`NFD` puis `\p{Diacritic}`), pour que « acces » trouve « Accessibilité ».
 */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Le rang d'une correspondance, du plus fort au plus faible. Un nombre et non
 * une chaîne : c'est ce qui se trie.
 */
/* UN OBJET `as const` ET NON UN `const enum` : esbuild compile chaque module
   isolément (`isolatedModules`), et un `const enum` y est une erreur — ses
   membres devraient être inlinés à travers les frontières de module, ce qu'un
   compilateur qui ne voit qu'un fichier ne peut pas faire. */
const Rank = {
  /** Le libellé COMMENCE par la requête. « but » → « Button ». */
  LabelPrefix: 0,
  /** Un mot du libellé commence par la requête. « ray » → « Espacement et rayons ». */
  WordPrefix: 1,
  /** Le libellé contient la requête ailleurs qu'en tête de mot. */
  LabelInfix: 2,
  /** Le titre de la page contient la requête, mais pas son libellé. */
  TitleInfix: 3,
  /** Un terme d'API, une description ou un ancien nom correspond. */
  SearchTerms: 4,
  /** Seul le nom du groupe contient la requête. « fonda » → les six fondations. */
  GroupInfix: 5,
} as const;

/** Le nom de groupe, indexé une fois — `GROUPS` est un tableau, pas une carte. */
const GROUP_LABELS: ReadonlyMap<DocGroupId, string> = new Map(
  GROUPS.map((group) => [group.id, normalize(group.label)]),
);

/**
 * Une suggestion : la page trouvée, et de quoi l'afficher sans la rechercher.
 *
 * `groupLabel` est le libellé LISIBLE et non l'identifiant : la liste affiche
 * « Fondations » sous « Élévation », pour que deux pages de même nom dans deux
 * groupes se distinguent. Il est calculé ici parce que c'est ici qu'on tient
 * déjà la table.
 */
export interface Suggestion {
  readonly page: DocPage;
  readonly groupLabel: string;
  readonly rank: number;
}

/**
 * Le nombre de suggestions affichées au plus. Le panneau défile et suit
 * l'option désignée : huit rangées se parcourent aux flèches sans perdre le
 * compte. Au-delà, le composant annonce le total.
 */
export const MAX_SUGGESTIONS = 8;

/** Le rang d'une page pour une requête normalisée, ou `null` si elle ne correspond pas. */
function rankOf(page: DocPage, query: string): number | null {
  const label = normalize(page.label);

  if (label.startsWith(query)) return Rank.LabelPrefix;

  /* Les frontières de mot du libellé. `split(/\s+/)` et non un `\b` de regex :
     `\b` est défini sur `[A-Za-z0-9_]`, donc une apostrophe typographique ou
     un tiret cadratin y coupent au hasard, et « d’état » n'a pas la même
     frontière que « d'etat » selon la source. Le découpage sur l'espace est
     la seule règle qui donne le même résultat pour les deux. */
  if (label.split(/\s+/).some((word) => word.startsWith(query))) return Rank.WordPrefix;

  if (label.includes(query)) return Rank.LabelInfix;
  if (normalize(page.title).includes(query)) return Rank.TitleInfix;
  const terms = page.searchTerms?.map(normalize) ?? [];
  if (terms.some((term) => term.includes(query))) return Rank.SearchTerms;
  if (query.includes(' ')) {
    const searchable = [label, normalize(page.title), ...terms].join(' ');
    if (query.split(/\s+/).every((word) => searchable.includes(word))) return Rank.SearchTerms;
  }
  if ((GROUP_LABELS.get(page.group) ?? '').includes(query)) return Rank.GroupInfix;

  return null;
}

/** Ce que rend une recherche : les suggestions à afficher, et le total trouvé. */
export interface SearchResult {
  /** Au plus `MAX_SUGGESTIONS`, classées. */
  readonly suggestions: readonly Suggestion[];
  /** Le nombre de pages qui correspondent, plafond non appliqué. */
  readonly total: number;
}

const EMPTY: SearchResult = { suggestions: [], total: 0 };

/**
 * Les pages qui correspondent à `query`, classées et plafonnées. Une requête
 * vide ou faite d'espaces ne rend rien : le sommaire liste déjà tout. Le tri
 * est stable, donc un même rang garde l'ordre du registre.
 */
export function searchPages(pages: readonly DocPage[], query: string): SearchResult {
  const needle = normalize(query.trim());
  if (needle.length === 0) return EMPTY;

  const matches: Suggestion[] = [];

  for (const page of pages) {
    const rank = rankOf(page, needle);
    if (rank === null) continue;

    matches.push({
      page,
      groupLabel: GROUPS.find((group) => group.id === page.group)?.label ?? page.group,
      rank,
    });
  }

  matches.sort((left, right) => left.rank - right.rank);

  return { suggestions: matches.slice(0, MAX_SUGGESTIONS), total: matches.length };
}
