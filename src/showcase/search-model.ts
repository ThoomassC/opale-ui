import type { DocGroupId, DocPage } from './doc-model';
import { GROUPS } from './doc-model';

/* =============================================================================
   LA CORRESPONDANCE DE RECHERCHE, EN FONCTIONS PURES.

   Séparée du composant, et ce n'est pas de la mise en ordre : c'est la seule
   moitié de la recherche qui soit VÉRIFIABLE sans navigateur. Le classement,
   la normalisation et le plafond se testent ici sur des tableaux ; le
   composant, lui, n'a plus qu'à câbler un clavier sur le résultat.

   AUCUN INDEX, AUCUNE DÉPENDANCE. Le registre reste assez petit pour un
   balayage linéaire. Les termes API et anciens noms sont déclarés sur les pages
   concernées, sans charger leur corps React ni ajouter un moteur de recherche.
   ========================================================================== */

/**
 * La forme normalisée d'une chaîne : minuscules ET SANS DIACRITIQUES.
 *
 * LES ACCENTS NE SONT PAS UN DÉTAIL DANS UNE DOC EN FRANÇAIS. Sans cette
 * décomposition, « elevation » ne trouve pas « Élévation », « espacement » ne
 * trouve pas « Espacement et rayons » dès qu'on tape l'accent de travers, et
 * « acces » ne trouve pas « Accessibilité ». Or personne ne tape les accents
 * dans une barre de recherche.
 *
 * `NFD` sépare une lettre accentuée en lettre + marque combinante, puis
 * `\p{Diacritic}` retire les marques. Les échappements de propriétés Unicode
 * demandent le drapeau `u`, et sont dans le langage depuis ES2018 — le dépôt
 * cible des navigateurs qui ont `backdrop-filter`, la question ne se pose pas.
 *
 * `toLowerCase()` AVANT la décomposition : l'ordre est indifférent pour le
 * français, il ne l'est pas pour le turc ou le grec final, et la casse d'abord
 * est la forme que les tests épinglent.
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
 * Le nombre de suggestions affichées au plus.
 *
 * HUIT, ET C'EST UNE CONTRAINTE DE HAUTEUR — mais le calcul écrit ici était
 * FAUX. Il affirmait qu'à huit rangées le panneau « mesure environ 400 px, ce
 * qui tient dans la moitié haute d'une fenêtre de téléphone en paysage ».
 * Mesuré, en paysage 667 × 375 : le panneau contient **382 px** de rangées dans
 * une lucarne de **223 px** — quatre options visibles sur huit. Sur 375 × 667 :
 * 499 px de contenu pour 398 px de lucarne, six sur huit. La raison de l'erreur
 * est que le champ descend à son plancher de 8 rem sur ces largeurs, donc les
 * rangées passent à deux lignes : 58 px, et 80 px pour « Espacement et rayons ».
 *
 * Le plafond reste à huit, et il tient par un autre bout : le panneau DÉFILE
 * (`max-block-size: 60dvh; overflow-y: auto`) et le composant amène l'option
 * désignée dans la lucarne à chaque flèche. Ce qui est borné n'est donc pas ce
 * qu'on voit, c'est ce qu'on parcourt — huit rangées se parcourent aux flèches
 * sans qu'on perde le compte, vingt et une non.
 *
 * Une requête d'une lettre peut évidemment correspondre à plus de huit pages :
 * le composant annonce alors le TOTAL et affiche les huit premières, plutôt que
 * de laisser croire qu'il n'y en a que huit.
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
 * Les pages qui correspondent à `query`, classées et plafonnées.
 *
 * UNE REQUÊTE VIDE NE REND RIEN, et surtout pas les vingt et une pages. Le
 * sommaire de gauche est déjà la liste complète : un panneau qui l'aurait
 * recopiée sous la barre de recherche aurait mis deux navigations concurrentes
 * à l'écran, dont une qui recouvre le contenu. Une requête d'espaces est vide
 * elle aussi — on ne cherche pas un espace.
 *
 * LE TRI EST STABLE, et c'est ce qui rend l'ordre prévisible : `Array.sort` est
 * garanti stable depuis ES2019, donc deux pages de même rang sortent dans
 * l'ordre du REGISTRE, c'est-à-dire celui du sommaire. Une recherche qui
 * réordonne à chaque frappe des entrées de rang égal est une recherche dont on
 * n'apprend jamais la place des choses.
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
