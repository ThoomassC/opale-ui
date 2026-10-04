/* =============================================================================
   LES NOMS RETIRÉS D'OPALE, ET LE CANAL DES AVERTISSEMENTS DE DÉVELOPPEMENT.

   De 2.6 à 2.10, une quarantaine de props et d'exports ont porté
   `@deprecated`. La 4.0.0 les a retirés : ils ne compilent plus. Ce module
   en garde la liste figée (`REMOVED_PROPS`, `REMOVED_EXPORTS`), que lisent la
   page « Migrer vers la 4.0 » de la vitrine, le garde des extraits de la
   vitrine et `removed-api.structure.test.ts`.

   Il porte aussi les deux avertissements de développement qui restent : le
   contrôle sans nom accessible et le défaut de démonstration.

   CE MODULE N'EST PAS RÉEXPORTÉ PAR `index.ts`. Il sert la librairie et sa
   vitrine ; un consommateur n'a rien à y importer.

   L'AVERTISSEMENT NE PART QU'EN DÉVELOPPEMENT, et le test est écrit pour
   survivre au build de la librairie. `import.meta.env` serait figé par Vite au
   moment où NOUS construisons `dist/` ; `process.env.NODE_ENV`, lui, traverse
   le mode librairie intact et c'est le bundler de l'APPLICATION qui le
   remplace — comme pour React. Voir `isDevelopment`.
   ========================================================================== */

import { isDevelopment, resetWarnings, warnOnce } from './shared/dev-warning';

/** La version qui avait déprécié un nom retiré. */
export type DeprecatedSince = '2.6' | '2.7' | '2.10';

/* =============================================================================
   CE QUE LA 4.0.0 RETIRE.

   Une copie FIGÉE des anciennes tables de dépréciation, prise avant le
   retrait : elle survit aux noms qu'elle décrit. La page « Migrer vers la 4.0 » la lit, le
   garde de la vitrine (`no-deprecated-api.structure.test.ts`) y cherche les
   anciens noms dans les extraits, et `removed-api.structure.test.ts` vérifie
   que chaque nom listé a bien quitté la surface publique.
   ========================================================================== */

/** La version qui a retiré les noms dépréciés de la 2.x. */
export const REMOVAL_VERSION = '4.0.0';

/** Une prop retirée : son composant, son ancien nom et celui qui le remplace. */
export interface RemovedPropEntry {
  /** Le composant (ou l'appel) qui acceptait la prop. */
  readonly component: string;
  readonly prop: string;
  /** Le nom à utiliser, tel qu'il s'écrit dans le code. */
  readonly replacement: string;
  /** Une précision, quand le passage demande plus qu'un renommage. */
  readonly note?: string;
  /** La version qui l'avait dépréciée. */
  readonly since: DeprecatedSince;
}

/** Un export retiré, type ou valeur. */
export interface RemovedExportEntry {
  /** Le nom tel qu'on l'écrivait : `OpaleUI`, `Opale.Background`. */
  readonly name: string;
  readonly kind: 'type' | 'value';
  /** L'export qui le remplace, ou `null` quand il n'y en a pas. */
  readonly replacement: string | null;
  readonly note?: string;
  /** La version qui l'avait déprécié. */
  readonly since: DeprecatedSince;
}

export const REMOVED_PROPS: readonly RemovedPropEntry[] = Object.freeze([
  {
    component: 'Modal',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '2.6',
  },
  {
    component: 'Modal',
    prop: 'triggerAnimation',
    replacement: 'enableLiquidAnimation',
    note: 'l’onde d’ouverture est programmée par la modale',
    since: '2.7',
  },
  {
    component: 'Modal',
    prop: 'as',
    replacement: 'className',
    note: 'la balise du panneau est interne au verre',
    since: '2.7',
  },
  {
    component: 'Modal',
    prop: 'pressFeedback',
    replacement: 'liquidGlass',
    note: 'le rebond est interne au matériau',
    since: '2.7',
  },
  {
    component: 'Tabs',
    prop: 'as',
    replacement: 'className',
    note: 'la balise du contenu est interne au verre',
    since: '2.7',
  },
  {
    component: 'Tabs',
    prop: 'pressFeedback',
    replacement: 'liquidGlass',
    note: 'le rebond est interne au matériau',
    since: '2.7',
  },
  {
    component: 'Tabs',
    prop: 'enableLiquidAnimation',
    replacement: 'liquidGlass',
    note: 'une surface ne fait pas naître d’onde au clic',
    since: '2.7',
  },
  {
    component: 'Tabs',
    prop: 'triggerAnimation',
    replacement: 'liquidGlass',
    note: 'l’onde programmée est interne au matériau',
    since: '2.7',
  },
  {
    component: 'Sidebar',
    prop: 'enableLiquidAnimation',
    replacement: 'liquidGlass',
    note: 'une surface ne fait pas naître d’onde au clic',
    since: '2.7',
  },
  {
    component: 'Sidebar',
    prop: 'triggerAnimation',
    replacement: 'liquidGlass',
    note: 'l’onde programmée est interne au matériau',
    since: '2.7',
  },
  {
    component: 'Topbar',
    prop: 'enableLiquidAnimation',
    replacement: 'liquidGlass',
    note: 'une surface ne fait pas naître d’onde au clic',
    since: '2.7',
  },
  {
    component: 'Topbar',
    prop: 'triggerAnimation',
    replacement: 'liquidGlass',
    note: 'l’onde programmée est interne au matériau',
    since: '2.7',
  },
  {
    component: 'Sidebar',
    prop: 'onToggle',
    replacement: 'onCollapsedChange',
    since: '2.6',
  },
  {
    component: 'Sidebar',
    prop: 'activeItemId',
    replacement: 'value',
    since: '2.6',
  },
  {
    component: 'Sidebar',
    prop: 'defaultActiveItemId',
    replacement: 'defaultValue',
    since: '2.6',
  },
  {
    component: 'Sidebar',
    prop: 'onSelectItem',
    replacement: 'onValueChange',
    note: '`onValueChange(id)`, sans l’événement du clic',
    since: '2.6',
  },
  {
    component: 'Sidebar.useSidebar',
    prop: 'activeItemId',
    replacement: 'value',
    note: 'le champ du contexte, lu par `Sidebar.useSidebar()`',
    since: '2.6',
  },
  {
    component: 'SearchBar',
    prop: 'enableClickAnimation',
    replacement: 'enableLiquidAnimation',
    since: '2.7',
  },
  {
    component: 'SiteNav',
    prop: 'activeItem',
    replacement: 'value',
    since: '2.6',
  },
  {
    component: 'showToast',
    prop: 'variant',
    replacement: 'tone',
    note: '`default` → `neutral`',
    since: '2.6',
  },
  {
    component: 'DataTable',
    prop: 'emptyMessage',
    replacement: 'labels.empty',
    since: '2.6',
  },
  {
    component: 'DataTable',
    prop: 'density',
    replacement: 'size',
    note: '`compact` → `small`',
    since: '2.6',
  },
  {
    component: 'FileCard',
    prop: 'size',
    replacement: 'fileSize',
    since: '2.10',
  },
  {
    component: 'Lightbox',
    prop: 'onClose',
    replacement: 'onOpenChange',
    note: 'reçoit `false`, et non plus l’événement du clic',
    since: '2.6',
  },
  {
    component: 'Feedback',
    prop: 'severity',
    replacement: 'tone',
    since: '2.6',
  },
  {
    component: 'Toast',
    prop: 'onClose',
    replacement: 'onOpenChange',
    note: 'reçoit `false`, et non plus l’événement du clic',
    since: '2.6',
  },
  {
    component: 'ConfirmDialog',
    prop: 'onCancel',
    replacement: 'onOpenChange',
    note: 'reçoit `false`, et non plus l’événement du clic',
    since: '2.6',
  },
  {
    component: 'MultiSelect',
    prop: 'values',
    replacement: 'value',
    since: '2.6',
  },
  {
    component: 'SegmentedControl',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '2.6',
  },
  {
    component: 'Navbar',
    prop: 'activeId',
    replacement: 'value',
    since: '2.6',
  },
  {
    component: 'Navbar',
    prop: 'onSelect',
    replacement: 'onValueChange',
    since: '2.6',
  },
  {
    component: 'SidePanel',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '2.6',
  },
  {
    component: 'CommandPalette',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '2.6',
  },
  {
    component: 'CommandPalette',
    prop: 'onClose',
    replacement: 'onOpenChange',
    note: 'reçoit `false`, et non plus l’événement du clic',
    since: '2.6',
  },
  {
    component: 'Pagination',
    prop: 'page',
    replacement: 'value',
    since: '2.6',
  },
  {
    component: 'Pagination',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '2.6',
  },
  {
    component: 'RatingInput',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '2.6',
  },
]);

export const REMOVED_EXPORTS: readonly RemovedExportEntry[] = Object.freeze([
  {
    name: 'OpaleUI',
    kind: 'value',
    replacement: null,
    note: 'importez chaque composant par son nom',
    since: '2.6',
  },
  {
    name: 'Opale.Background',
    kind: 'value',
    replacement: 'BackgroundSurface',
    since: '2.6',
  },
  {
    name: 'OPALE_CATALOG',
    kind: 'value',
    replacement: null,
    note: 'métadonnée de la vitrine, sans remplaçant public',
    since: '2.6',
  },
  {
    name: 'CatalogEntry',
    kind: 'type',
    replacement: null,
    note: 'métadonnée de la vitrine, sans remplaçant public',
    since: '2.6',
  },
  {
    name: 'ToastPlacement',
    kind: 'type',
    replacement: 'OpalePlacement',
    since: '2.6',
  },
  {
    name: 'ToastTone',
    kind: 'type',
    replacement: 'OpaleTone',
    since: '2.6',
  },
  {
    name: 'FieldProps',
    kind: 'type',
    replacement: 'InputProps',
    since: '2.6',
  },
  {
    name: 'DEFAULT_SITE_NAV_ITEMS',
    kind: 'value',
    replacement: 'items',
    note: 'passez vos destinations à `SiteNav`',
    since: '2.6',
  },
]);

/* ---- L'interrupteur sans nom.

   Une fois, en développement. Le
   nom est lu dans le DOM et non dans les props, parce qu'un `<label for>`
   posé par l'appelant hors du composant nomme l'élément sans qu'aucune prop
   ne le dise. */

function hasAccessibleName(element: HTMLElement): boolean {
  if (element.getAttribute('aria-label')?.trim()) return true;
  if (element.getAttribute('title')?.trim()) return true;
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const named = labelledBy
      .split(/\s+/)
      .some((id) => element.ownerDocument.getElementById(id)?.textContent?.trim());
    if (named) return true;
  }
  const labels = 'labels' in element ? (element as HTMLInputElement).labels : null;
  return Array.from(labels ?? []).some((label) => label.textContent?.trim());
}

/* LE MÊME CONTRÔLE POUR LES AUTRES COMPOSANTS (ACC-21). Seul l'interrupteur
   était vérifié ; une ProgressBar sans `label`, un Modal sans titre, une case,
   une liste ou un curseur sans libellé passaient sans un mot. Chaque entrée
   donne le nom de l'objet, tel qu'on le dit en français, et les props qui le
   nomment. */
const UNNAMED_CONTROLS = {
  Toggle: { noun: 'l’interrupteur', hint: '`label`, `aria-label` ou `aria-labelledby`' },
  ProgressBar: {
    noun: 'la barre de progression',
    hint: '`label`, `aria-label` ou `aria-labelledby`',
  },
  Modal: { noun: 'le dialogue', hint: '`title`, `aria-label` ou `aria-labelledby`' },
  Checkbox: { noun: 'la case', hint: '`label`, `aria-label` ou `aria-labelledby`' },
  MultiSelect: { noun: 'la liste de choix', hint: '`label`, `aria-label` ou `aria-labelledby`' },
  Slider: { noun: 'le curseur', hint: '`label`, `aria-label` ou `aria-labelledby`' },
  Select: { noun: 'la liste déroulante', hint: '`label`, `aria-label` ou `aria-labelledby`' },
  Textarea: { noun: 'la zone de texte', hint: '`label`, `aria-label` ou `aria-labelledby`' },
  RadioGroup: {
    noun: 'le groupe de boutons radio',
    hint: '`label`, `aria-label` ou `aria-labelledby`',
  },
} as const;

/** Les composants dont le nom accessible est vérifié en développement. */
export type NamedControl = keyof typeof UNNAMED_CONTROLS;

/** Avertit, une fois et en développement, qu'un contrôle n'a pas de nom accessible. */
export function warnIfUnnamed(component: NamedControl, element: HTMLElement): void {
  if (!isDevelopment() || hasAccessibleName(element)) return;
  const { noun, hint } = UNNAMED_CONTROLS[component];
  warnOnce(
    `${component}#name`,
    `[Opale] ${component} : ${noun} n’a pas de nom accessible — donnez-lui ${hint}.`,
  );
}

/* ---- Les défauts surprenants (DX-21).

   Le même canal : une fois, en développement. `<Icon />` dessine une
   étincelle et `<Donut />` affiche 60 % : deux valeurs de démonstration qui
   passent en production sans que rien ne les signale. */
const IMPLICIT_DEFAULTS = {
  Icon: '`name` n’est passé — l’icône `sparkle` est dessinée par défaut. Passez `name` pour choisir l’icône',
  Donut:
    '`value` n’est passée — l’anneau affiche 60 % par défaut. Passez `value` pour afficher la vôtre',
} as const;

/** Les composants dont un défaut de démonstration est signalé en développement. */
export type ImplicitDefaultComponent = keyof typeof IMPLICIT_DEFAULTS;

/**
 * Avertit, une fois et en développement, qu'un composant s'appuie sur un
 * défaut de démonstration. S'appelle pendant le rendu : c'est idempotent.
 */
export function warnImplicitDefault(component: ImplicitDefaultComponent): void {
  const article = component === 'Donut' ? 'aucune' : 'aucun';
  warnOnce(
    `${component}#default`,
    `[Opale] ${component} : ${article} ${IMPLICIT_DEFAULTS[component]}.`,
  );
}

/** Oublie les avertissements déjà émis. Réservé aux tests. */
export function resetDeprecationWarnings(): void {
  resetWarnings();
}
