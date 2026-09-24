import { describe, expect, it } from 'vitest';

import { stripComments } from './stylesheet';
import { OPALE_CATALOG } from '../magic/opale';
import opaleCss from '../magic/opale.css?raw';
import opaleSource from '../magic/opale.tsx?raw';

/* ============================================================================
   UNE FICHE DIT CE QUE LE COMPOSANT FAIT, PAS CE QU'IL POURRAIT FAIRE.

   La fiche d'`OPALE_CATALOG` est la première phrase qu'on lit sous le titre de
   chaque page de composant. Relues une à une contre leur implémentation, une
   trentaine promettaient ce que le code ne faisait pas : « tri, sélection et
   clavier » pour un `<table>` statique, « glisser-déposer » pour une zone sans
   `onDrop`, « mémorisation » sans un octet de stockage, « fermeture
   automatique » sans minuterie. Rien ne cassait à l'exécution : c'est
   précisément pourquoi personne ne l'a vu.

   Le garde ne lit pas le français, il cherche des TRACES. Chaque règle associe
   une promesse — un mot de la fiche — à ce que le code doit contenir pour la
   tenir. Promettre « clavier » exige un `onKeyDown` dans le corps du
   composant ; promettre « animé » exige une transition sur l'une de ses
   classes. Une trace n'est pas une preuve de bon fonctionnement, seulement
   d'existence — mais c'est l'absence d'existence qui s'était installée.

   CE QUE LE GARDE NE VOIT PAS : une promesse formulée avec un mot absent de la
   table. Ajouter une règle quand une fiche en invente un est le prix de ce
   garde, et il est faible à côté d'une documentation qui ment.

   CE QU'IL REFUSE À TORT, ET C'EST VOULU : il ne lit que le corps du
   composant. L'interface de props déclarée au-dessus, le composant auquel il
   délègue (`Pressable` → `Button`, `ConfirmDialog` → `Modal`) et les classes
   construites par gabarit lui échappent. Une fiche honnête qui en dépend doit
   se reformuler — un garde qui refuse trop se contourne en une phrase, un
   garde qui accepte trop ne se remarque pas.
   ========================================================================== */

type Where = 'code' | 'css';

interface Claim {
  /** Ce que la fiche affirme. */
  readonly says: RegExp;
  /** Une fiche qui fait cette promesse : prouve que `says` se déclenche. */
  readonly sample: string;
  /** Ce qui doit exister pour que l'affirmation tienne. */
  readonly needs: RegExp;
  /** `code` : le corps du composant ; `css` : une règle de l'une de ses classes. */
  readonly in: Where;
}

const PROMISES: readonly Claim[] = [
  { says: /\btri\b|triable/i, sample: 'Table avec tri', needs: /\bsort/i, in: 'code' },
  { says: /clavier/i, sample: 'Carte accessible au clavier', needs: /onKeyDown/, in: 'code' },
  {
    says: /mémoris/i,
    sample: 'Bandeau avec mémorisation',
    needs: /localStorage|sessionStorage|document\.cookie/,
    in: 'code',
  },
  {
    says: /automatique|minuterie|fugace|éphémère/i,
    sample: 'Notification avec fermeture automatique',
    needs: /setTimeout|setInterval/,
    in: 'code',
  },
  { says: /glisser/i, sample: 'Zone de dépôt par glisser-déposer', needs: /onDrop/, in: 'code' },
  {
    says: /sous-menu/i,
    sample: 'Barre avec sous-menus',
    needs: /submenu|subItems|item\.items/i,
    in: 'code',
  },
  {
    says: /graduation/i,
    sample: 'Curseur avec graduations',
    needs: /<datalist|\bticks?\b/i,
    in: 'code',
  },
  {
    says: /vertical/i,
    sample: 'Séparateur horizontal ou vertical',
    needs: /vertical|orientation/,
    in: 'code',
  },
  { says: /icône/i, sample: 'Carte avec icône', needs: /icon/i, in: 'code' },
  {
    says: /illustré/i,
    sample: 'Options illustrées',
    needs: /<img|<svg|<Icon\b|<IconGlyph\b/,
    in: 'code',
  },
  { says: /indéterminé/i, sample: "Case à l'état indéterminé", needs: /indeterminate/, in: 'code' },
  {
    says: /entrée|échap/i,
    sample: 'entrée valide, échap abandonne',
    needs: /'Enter'|'Escape'/,
    in: 'code',
  },
  { says: /segmenté/i, sample: 'Anneau segmenté', needs: /segment/i, in: 'code' },
  { says: /repli/i, sample: "Fil d'Ariane avec repli", needs: /collapse|maxItems/i, in: 'code' },
  {
    says: /sélection/i,
    sample: 'Carte avec sélection',
    needs: /selected|aria-pressed|aria-selected/i,
    in: 'code',
  },
  {
    says: /positionnable/i,
    sample: 'Menu positionnable',
    needs: /position|placement|anchor/i,
    in: 'code',
  },
  { says: /aperçu/i, sample: 'Carte avec aperçu', needs: /<img|preview|thumbnail/i, in: 'code' },
  {
    says: /\bdocuments?\b/i,
    sample: "Visionneuse d'images et documents",
    needs: /<iframe|<object|pdf/i,
    in: 'code',
  },
  {
    says: /validation/i,
    sample: 'Champ avec validation',
    needs: /validat|checkValidity/i,
    in: 'code',
  },
  { says: /dossier/i, sample: 'Carte de fichier ou dossier', needs: /folder/i, in: 'code' },
  {
    says: /routeur/i,
    sample: 'Lien compatible avec les routeurs',
    needs: /\bas\?:|component\?:|render\?:/,
    in: 'code',
  },
  { says: /coulissant/i, sample: 'Panneau coulissant', needs: /slide|translate/i, in: 'code' },
  {
    says: /geste|gestuelle/i,
    sample: 'Carte gestuelle',
    needs: /onPointer|onTouch|onWheel/,
    in: 'code',
  },
  {
    says: /présélection/i,
    sample: 'Suggestions avec présélection',
    needs: /aria-activedescendant|highlight/i,
    in: 'code',
  },
  { says: /filtrage/i, sample: 'Champ avec filtrage', needs: /\.filter\(/, in: 'code' },
  { says: /compteur/i, sample: 'Pastille de compteur', needs: /count/i, in: 'code' },
  {
    says: /point de notification/i,
    sample: 'Point de notification',
    needs: /\bdot\b/i,
    in: 'code',
  },
  { says: /menu contextuel/i, sample: 'Menu contextuel', needs: /onContextMenu/, in: 'code' },
  { says: /\bchips?\b/i, sample: 'Sélection avec chips', needs: /chip/i, in: 'code' },
  {
    says: /déroulante/i,
    sample: 'Liste déroulante',
    needs: /aria-expanded|popover|<details/,
    in: 'code',
  },
  {
    says: /plusieurs tailles/i,
    sample: 'Icônes en plusieurs tailles',
    needs: /\bsize\??:/,
    in: 'code',
  },
  { says: /anim/i, sample: 'Fond animé', needs: /transition|animation/, in: 'css' },
  {
    says: /responsive|auto-adaptati/i,
    sample: 'Barre responsive',
    needs: /@media[^{]*width|auto-fit|auto-fill/,
    in: 'css',
  },
];

/* `stripComments` est écrit pour le CSS : il ôte les blocs, pas les `//`. Un
   « // tri à venir » dans un composant suffirait sinon à tenir la promesse du
   tri. Le `[^:]` épargne les URL. */
const SOURCE = stripComments(opaleSource).replace(/(^|[^:])\/\/.*$/gm, '$1');
const CSS = stripComments(opaleCss);

/* Le corps d'un composant va de sa déclaration à la déclaration suivante de
   premier niveau. Les commentaires sont retirés AVANT, sans quoi l'en-tête qui
   raconte pourquoi le tri n'existe pas suffirait à satisfaire la règle. */
function bodyOf(name: string): string | undefined {
  const start = SOURCE.search(new RegExp(`^export (?:function ${name}\\b|const ${name} = )`, 'm'));
  if (start < 0) return undefined;
  const rest = SOURCE.slice(start + 1);
  const end = rest.search(/^(?:export |function |const |interface |type )/m);
  return end < 0 ? rest : rest.slice(0, end);
}

/* LES CLASSES PROPRES AU COMPOSANT, ET ELLES SEULES. Une règle groupée —
   `.opale-surface, .opale-card, .opale-panel { transition: … }` pour le survol
   — donnait une transition à tout composant qui porte l'une de ces classes :
   « table animée » passait parce que la table vit dans un `opale-panel`. Une
   classe que deux corps partagent ne prouve donc rien pour aucun des deux. */
function classesOf(body: string): Set<string> {
  return new Set(body.match(/opale-[a-z0-9_-]+/g) ?? []);
}

const SHARED = (() => {
  const seen = new Map<string, number>();
  for (const { name } of OPALE_CATALOG) {
    for (const cls of classesOf(bodyOf(name) ?? '')) seen.set(cls, (seen.get(cls) ?? 0) + 1);
  }
  return new Set([...seen].filter(([, count]) => count > 1).map(([cls]) => cls));
})();

const names = (selector: string, cls: string) => new RegExp(`\\.${cls}(?![\\w-])`).test(selector);

/* Les règles d'une feuille dont le sélecteur nomme l'une de ces classes. Le
   motif ne franchit aucune accolade : il saisit la règle intérieure d'un
   `@media` avec son seul sélecteur, et le bloc `@media` est repris à part pour
   que sa condition reste lisible. */
function cssFor(body: string): string {
  const own = [...classesOf(body)].filter((cls) => !SHARED.has(cls));
  const rules = [...CSS.matchAll(/([^{}]+)\{[^{}]*\}/g)]
    .filter(([, selector]) => own.some((cls) => names(selector, cls)))
    .map(([rule]) => rule);
  const media = [...CSS.matchAll(/@media[^{]*\{((?:[^{}]*\{[^{}]*\})*)[^{}]*\}/g)]
    .filter(([, inner]) => own.some((cls) => names(inner, cls)))
    .map(([block]) => block);
  return [...rules, ...media].join('\n');
}

describe('le catalogue d’Opale', () => {
  it.each(OPALE_CATALOG.map((entry) => [entry.name]))(
    'devrait trouver le composant %s dans opale.tsx',
    (name) => {
      expect(bodyOf(name)).toBeDefined();
    },
  );

  it.each(OPALE_CATALOG.map((entry) => [entry.name, entry.description]))(
    'devrait tenir chaque promesse de la fiche de %s',
    (name, description) => {
      const body = bodyOf(name) ?? '';
      const broken = PROMISES.filter(({ says }) => says.test(description))
        .filter(({ needs, in: where }) => !needs.test(where === 'code' ? body : cssFor(body)))
        .map(({ says, needs, in: where }) => `« ${says.source} » exige ${needs.source} (${where})`);

      expect(broken, `${name} : « ${description} »`).toEqual([]);
    },
  );
});

/* LE GARDE DOIT MORDRE, PAR SES DEUX MÂCHOIRES. Chaque règle est rejouée
   contre une fiche qui fait sa promesse — sans quoi un `says` sensible à la
   casse laissait passer « entrée valide, échap abandonne » — et contre un corps
   qui n'en porte pas la trace. Une règle qui ne se déclenche jamais, ou ne
   refuse rien, serait morte, et la table donnerait une assurance qu'elle ne
   fournit pas. */
describe('les règles du garde', () => {
  it.each(PROMISES.map((promise) => [promise.says.source, promise]))(
    'devrait reconnaître « %s » et la refuser sans sa trace',
    (_, { says, sample, needs }) => {
      expect(says.test(sample)).toBe(true);
      expect(needs.test('return <div className="x">{children}</div>;')).toBe(false);
      expect(needs.test('')).toBe(false);
    },
  );
});
