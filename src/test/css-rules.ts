/* =============================================================================
   LIRE UNE FEUILLE CSS PAR SON ARBRE, SANS MENTIR SUR LE CONTEXTE.

   POURQUOI CE FICHIER EXISTE. Trois tests de structure lisaient `doc.css` avec
   la même expression rationnelle, `/([^{}]+)\{([^}]*)\}/g`, et elle est fausse :
   `[^}]*` n'exclut pas `{`, donc la PREMIÈRE correspondance d'un bloc `@media`
   avale le prélude de l'at-rule ET la règle imbriquée entière. Une at-rule
   était lue comme une règle, et le sélecteur qui ouvre un bloc `@media` était
   INATTEIGNABLE. Échanger l'ordre de deux règles dans un bloc `@media` — CSS
   strictement équivalente — faisait rougir un garde sans qu'un seul octet de
   comportement ait changé.

   CE QUE CE MODULE APPORTE : un garde peut exiger le CONTEXTE d'une règle et
   pas seulement son existence. Une règle sortie de son `@media` est un défaut
   réel — mesuré, sortir les deux règles du pli du sommaire de leur bloc 60 rem
   passe la page en deux colonnes de 139,5 et 235,5 px sur un téléphone.

   L'ANALYSE EST CONFIÉE À POSTCSS (QA-01). Le balayage à accolades écrit ici
   ignorait les chaînes : un `content: "}"` refermait la règle. Et les gardes
   qui s'en servaient finissaient par une expression rationnelle sur le corps,
   qui réussit aussi sur une déclaration écrasée plus bas dans la même règle.
   `declarations()` rend ce que la feuille retient pour un sélecteur exact dans
   un contexte exact : la dernière valeur écrite.

   IL VIT DANS `src/test/`, ET C'EST DÉLIBÉRÉ : `tsconfig.lib.json` n'inclut
   que `src/contract`, donc ce module — et `postcss`, simple dépendance de
   développement — n'entrent pas dans le paquet publié. C'est aussi pourquoi
   `src/contract/stylesheet.ts` garde son propre lecteur : il est publié sous
   `./contract`, et le fonder sur `postcss` imposerait cette dépendance à tous
   les consommateurs.
   ========================================================================== */

import postcss, { type AtRule, type Container, type Rule } from 'postcss';

/** Une règle CSS, avec la pile d'at-rules qui la contient. */
export interface CssRule {
  /** Le prélude, tel qu'écrit, espaces en tête et en queue retirés. */
  readonly prelude: string;
  /** Les sélecteurs du prélude, découpés sur les virgules de premier niveau. */
  readonly selectors: readonly string[];
  /** Le corps de la règle, déclarations brutes. */
  readonly body: string;
  /**
   * Les préludes des at-rules qui l'entourent, du plus extérieur au plus
   * intérieur. Vide pour une règle de premier niveau.
   */
  readonly context: readonly string[];
}

/** Retire les commentaires : un sélecteur cité en prose n'est pas une règle. */
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Le texte entre les accolades d'un nœud, lu dans la source analysée. */
function bodyOf(node: Rule | AtRule, source: string): string {
  const start = node.source?.start?.offset ?? 0;
  const end = node.source?.end?.offset ?? source.length;
  const open = source.indexOf('{', start);
  return source.slice(open + 1, end - 1);
}

function atRulePrelude(node: AtRule): string {
  return `@${node.name} ${node.params}`.trim();
}

/** Un bloc contient des règles — et pas seulement des déclarations. */
function holdsRules(node: Container): boolean {
  return (node.nodes ?? []).some(
    (child) => child.type === 'rule' || (child.type === 'atrule' && child.nodes !== undefined),
  );
}

const cache = new Map<string, readonly CssRule[]>();

/**
 * Toutes les règles d'une feuille, avec leur contexte d'at-rules.
 *
 * Une at-rule qui contient des règles est parcourue, jamais rendue comme une
 * règle ; une at-rule qui ne porte que des déclarations (`@font-face`) est
 * rendue telle quelle, son prélude servant de sélecteur.
 *
 * Ce qui n'est PAS aplati : le CSS imbriqué (une règle dans une règle). Il
 * reste dans le corps de sa règle parente, ce qui permet au test de ce module
 * de constater qu'aucune feuille du dépôt n'en contient.
 */
export function parseRules(source: string): readonly CssRule[] {
  const cached = cache.get(source);
  if (cached) return cached;

  const clean = stripComments(source);
  const rules: CssRule[] = [];

  const walk = (container: Container, context: readonly string[]): void => {
    for (const node of container.nodes ?? []) {
      if (node.type === 'rule') {
        rules.push({
          prelude: node.selector.trim(),
          selectors: node.selectors.map((selector) => selector.trim()),
          body: bodyOf(node, clean),
          context,
        });
      } else if (node.type === 'atrule' && node.nodes !== undefined) {
        const prelude = atRulePrelude(node);
        if (holdsRules(node)) {
          walk(node, [...context, prelude]);
        } else {
          rules.push({
            prelude,
            selectors: prelude.split(',').map((part) => part.trim()),
            body: bodyOf(node, clean),
            context,
          });
        }
      }
    }
  };

  walk(postcss.parse(clean), []);
  cache.set(source, rules);
  return rules;
}

/** Ce qu'un garde peut exiger d'une règle en plus de son sélecteur. */
export interface RuleQuery {
  /**
   * Le prélude d'une at-rule qui DOIT entourer la règle, comparé sur le texte
   * normalisé. Pour `declarations`, une liste donne la pile complète, du plus
   * extérieur au plus intérieur.
   */
  readonly within?: string | readonly string[];
}

/**
 * Normalise un prélude pour la comparaison : TOUT espace retiré, minuscules.
 *
 * `@media (min-width:60rem)` et `@media (min-width: 60rem)` sont la même
 * at-rule ; un garde qui exige un contexte ne doit pas dépendre du formatage.
 */
function normalizePrelude(prelude: string): string {
  return prelude.replace(/\s+/g, '').toLowerCase();
}

/** Les sélecteurs se comparent par leur forme, pas par leurs espaces. */
function normalizeSelector(selector: string): string {
  return selector.replace(/\s+/g, ' ').trim();
}

function asStack(within: string | readonly string[]): readonly string[] {
  return (typeof within === 'string' ? [within] : within).map(normalizePrelude);
}

/**
 * Le corps de la première règle dont les sélecteurs contiennent EXACTEMENT
 * `selector`, ou `null`. Sans `within`, le contexte n'est pas regardé ; avec,
 * les at-rules demandées doivent toutes entourer la règle.
 *
 * Correspondance exacte et non `includes` : `.tc-doc-nav__all` est un préfixe de
 * `.tc-doc-nav__alltitle`.
 */
export function ruleBody(source: string, selector: string, query: RuleQuery = {}): string | null {
  const wanted = query.within === undefined ? undefined : asStack(query.within);
  const needle = normalizeSelector(selector);

  for (const rule of parseRules(source)) {
    if (!rule.selectors.some((candidate) => normalizeSelector(candidate) === needle)) continue;
    if (wanted === undefined) return rule.body;
    const context = rule.context.map(normalizePrelude);
    if (wanted.every((prelude) => context.includes(prelude))) return rule.body;
  }

  return null;
}

/**
 * Les déclarations que la feuille retient pour `selector` dans un contexte
 * EXACT : sans `within`, au premier niveau seulement ; avec, sous exactement
 * cette pile d'at-rules.
 *
 * Plusieurs règles du même sélecteur dans le même contexte se fusionnent, et
 * la dernière valeur écrite gagne — ce que fait la cascade à spécificité égale.
 * `!important` est conservé en suffixe de la valeur, parce qu'il change le
 * sens de la déclaration.
 */
export function declarations(
  source: string,
  selector: string,
  query: RuleQuery = {},
): ReadonlyMap<string, string> {
  const wanted = query.within === undefined ? [] : asStack(query.within);
  const needle = normalizeSelector(selector);
  const result = new Map<string, string>();

  const walk = (container: Container, context: readonly string[]): void => {
    for (const node of container.nodes ?? []) {
      if (node.type === 'atrule' && node.nodes !== undefined) {
        walk(node, [...context, normalizePrelude(atRulePrelude(node))]);
        continue;
      }
      if (node.type !== 'rule') continue;
      if (!node.selectors.some((candidate) => normalizeSelector(candidate) === needle)) continue;
      const sameContext =
        context.length === wanted.length && context.every((prelude, i) => prelude === wanted[i]);
      if (!sameContext) continue;
      for (const child of node.nodes) {
        if (child.type !== 'decl') continue;
        const value = child.value.replace(/\s+/g, ' ').trim();
        result.set(child.prop, child.important ? `${value} !important` : value);
      }
    }
  };

  walk(postcss.parse(stripComments(source)), []);
  return result;
}

/**
 * Chaque sélecteur, tous contextes confondus, dont une règle déclare
 * `property` — dans l'ordre de la feuille, listes de sélecteurs dépliées.
 *
 * C'est la forme juste d'un garde négatif (« aucune règle `.header` ne tire de
 * filet ») : une expression rationnelle sur la feuille entière ne voyait pas
 * les règles d'un `@media`, et lisait parfois un commentaire.
 */
export function selectorsDeclaring(source: string, property: string): readonly string[] {
  const found: string[] = [];
  postcss.parse(stripComments(source)).walkRules((rule) => {
    if (rule.nodes.some((child) => child.type === 'decl' && child.prop === property)) {
      found.push(...rule.selectors.map(normalizeSelector));
    }
  });
  return found;
}

/**
 * Les paramètres de chaque at-rule `@name`, tous contextes confondus, dans
 * l'ordre de la feuille — `@import` sans bloc compris. Une at-rule citée en
 * commentaire n'en est pas une.
 */
export function atRules(source: string, name: string): readonly string[] {
  const found: string[] = [];
  postcss.parse(stripComments(source)).walkAtRules(name, (node) => {
    found.push(node.params.trim());
  });
  return found;
}

/** La valeur retenue d'une propriété, ou `undefined`. Voir `declarations`. */
export function declaration(
  source: string,
  selector: string,
  property: string,
  query: RuleQuery = {},
): string | undefined {
  return declarations(source, selector, query).get(property);
}
