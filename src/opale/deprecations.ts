/* =============================================================================
   LES NOMS DÉPRÉCIÉS D'OPALE, EN UN SEUL ENDROIT.

   depuis 2.6 et 2.7, une quarantaine de props et d'exports portent
   `@deprecated` : ils compilent encore, gardent leur effet, et l'éditeur les
   barre. La 3.0.0 les retirera. Cette table est leur SOURCE DE VÉRITÉ :
   l'avertissement de développement la lit, la page « Migrer vers la 3.0 » de
   la vitrine s'en déduit, et `deprecations.structure.test.ts` la tient contre
   chaque `@deprecated` du code — une entrée sans JSDoc, ou un JSDoc sans
   entrée, fait rougir la suite.

   CE MODULE N'EST PAS RÉEXPORTÉ PAR `index.ts`. Il sert la librairie et sa
   vitrine ; un consommateur n'a rien à y importer.

   L'AVERTISSEMENT NE PART QU'EN DÉVELOPPEMENT, et le test est écrit pour
   survivre au build de la librairie. `import.meta.env` serait figé par Vite au
   moment où NOUS construisons `dist/` ; `process.env.NODE_ENV`, lui, traverse
   le mode librairie intact et c'est le bundler de l'APPLICATION qui le
   remplace — comme pour React. Voir `isDevelopment`.
   ========================================================================== */

import { isDevelopment, resetWarnings, warnOnce } from './shared/dev-warning';

/** La version où un nom a été déprécié. */
export type DeprecatedSince = '2.6' | '2.7' | '2.10';

/** La version qui retirera les noms dépréciés. */
export const DEPRECATION_REMOVAL = '3.0.0';

/** Une prop dépréciée : son composant, son ancien nom et celui qui le remplace. */
export interface DeprecatedPropEntry {
  /** Le composant (ou l'appel) qui accepte la prop. */
  readonly component: string;
  readonly prop: string;
  /** Le nom à utiliser, tel qu'il s'écrit dans le code. */
  readonly replacement: string;
  /** Une précision, quand le passage demande plus qu'un renommage. */
  readonly note?: string;
  readonly since: DeprecatedSince;
  readonly removal: typeof DEPRECATION_REMOVAL;
  /** Le fichier (relatif à `src/opale`) qui porte le `@deprecated`. */
  readonly source: string;
}

/**
 * Un export déprécié. Un alias de type ne s'exécute pas, et un export de valeur
 * ne peut pas avertir sans changer d'identité (`OpaleUI` EST `Opale`) : ceux-là
 * sont seulement listés, pour le guide de migration.
 */
export interface DeprecatedExportEntry {
  /** Le nom tel qu'on l'écrit : `OpaleUI`, `Opale.Background`. */
  readonly name: string;
  readonly kind: 'type' | 'value';
  /** L'export qui le remplace, ou `null` quand il n'y en a pas. */
  readonly replacement: string | null;
  readonly note?: string;
  readonly since: DeprecatedSince;
  readonly removal: typeof DEPRECATION_REMOVAL;
  readonly source: string;
}

/* L'onde des surfaces : `LegacySurfaceAnimationProps`, partagé par `Tabs`,
   `Sidebar` et `Topbar`. Un seul `@deprecated`, donc une fonction plutôt que
   trois copies — générique, pour que chaque entrée garde SON composant dans le
   type et que `warnDeprecated('Tabs', 'triggerAnimation')` compile. */
function legacySurfaceEntries<const C extends string>(component: C) {
  return [
    {
      component,
      prop: 'enableLiquidAnimation',
      replacement: 'liquidGlass',
      note: 'une surface ne fait pas naître d’onde au clic',
      since: '2.7',
      removal: '3.0.0',
      source: 'components/glass/Glass.tsx',
    },
    {
      component,
      prop: 'triggerAnimation',
      replacement: 'liquidGlass',
      note: 'l’onde programmée est interne au matériau',
      since: '2.7',
      removal: '3.0.0',
      source: 'components/glass/Glass.tsx',
    },
  ] as const satisfies readonly DeprecatedPropEntry[];
}

export const DEPRECATED_PROPS = [
  /* ---- Tabs */
  {
    component: 'Tabs',
    prop: 'as',
    replacement: 'className',
    note: 'la balise du contenu est interne au verre',
    since: '2.7',
    removal: '3.0.0',
    source: 'components/tabs/Tabs.tsx',
  },
  {
    component: 'Tabs',
    prop: 'pressFeedback',
    replacement: 'liquidGlass',
    note: 'le rebond est interne au matériau',
    since: '2.7',
    removal: '3.0.0',
    source: 'components/tabs/Tabs.tsx',
  },

  /* ---- L'onde des surfaces, pour les trois composants qui l'acceptent. */
  ...legacySurfaceEntries('Tabs'),
  ...legacySurfaceEntries('Sidebar'),
  ...legacySurfaceEntries('Topbar'),

  /* ---- Sidebar */
  {
    component: 'Sidebar',
    prop: 'onToggle',
    replacement: 'onCollapsedChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'components/sidebar/Sidebar.tsx',
  },
  {
    component: 'Sidebar',
    prop: 'activeItemId',
    replacement: 'value',
    since: '2.6',
    removal: '3.0.0',
    source: 'components/sidebar/Sidebar.tsx',
  },
  {
    component: 'Sidebar',
    prop: 'defaultActiveItemId',
    replacement: 'defaultValue',
    since: '2.6',
    removal: '3.0.0',
    source: 'components/sidebar/Sidebar.tsx',
  },
  {
    component: 'Sidebar',
    prop: 'onSelectItem',
    replacement: 'onValueChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'components/sidebar/Sidebar.tsx',
  },

  /* ---- SearchBar, SiteNav, file de notifications */
  {
    component: 'SearchBar',
    prop: 'enableClickAnimation',
    replacement: 'enableLiquidAnimation',
    since: '2.7',
    removal: '3.0.0',
    source: 'components/search-bar/SearchBar.tsx',
  },
  {
    component: 'SiteNav',
    prop: 'activeItem',
    replacement: 'value',
    since: '2.6',
    removal: '3.0.0',
    source: 'components/site-nav/site-nav.tsx',
  },
  {
    component: 'showToast',
    prop: 'variant',
    replacement: 'tone',
    note: '`default` → `neutral`',
    since: '2.6',
    removal: '3.0.0',
    source: 'components/toast/ToastProvider.tsx',
  },

  /* ---- Le catalogue */
  {
    component: 'DataTable',
    prop: 'emptyMessage',
    replacement: 'labels.empty',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/display.tsx',
  },
  {
    component: 'DataTable',
    prop: 'density',
    replacement: 'size',
    note: '`compact` → `small`',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/display.tsx',
  },
  {
    component: 'FileCard',
    prop: 'size',
    replacement: 'fileSize',
    since: '2.10',
    removal: '3.0.0',
    source: 'catalog/modules.tsx',
  },
  {
    component: 'Lightbox',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/modules.tsx',
  },
  {
    component: 'Feedback',
    prop: 'severity',
    replacement: 'tone',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/feedback.tsx',
  },
  {
    component: 'Toast',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/feedback.tsx',
  },
  {
    component: 'ConfirmDialog',
    prop: 'onCancel',
    replacement: 'onOpenChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/feedback.tsx',
  },
  {
    component: 'MultiSelect',
    prop: 'values',
    replacement: 'value',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/forms.tsx',
  },
  {
    component: 'SegmentedControl',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/forms.tsx',
  },
  {
    component: 'Navbar',
    prop: 'activeId',
    replacement: 'value',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/navigation.tsx',
  },
  {
    component: 'Navbar',
    prop: 'onSelect',
    replacement: 'onValueChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/navigation.tsx',
  },
  {
    component: 'SidePanel',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/navigation.tsx',
  },
  {
    component: 'CommandPalette',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/navigation.tsx',
  },
  {
    component: 'CommandPalette',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'catalog/navigation.tsx',
  },
  {
    component: 'Pagination',
    prop: 'page',
    replacement: 'value',
    since: '2.6',
    removal: '3.0.0',
    source: 'opale-extras.tsx',
  },
  {
    component: 'Pagination',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'opale-extras.tsx',
  },
  {
    component: 'RatingInput',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '2.6',
    removal: '3.0.0',
    source: 'opale-extras.tsx',
  },
] as const satisfies readonly DeprecatedPropEntry[];

/* Les huit exports dépréciés de la 2.x ont été retirés en 4.0.0 : voir
   `REMOVED_EXPORTS`. La table reste, vide, tant que la machinerie vit. */
export const DEPRECATED_EXPORTS: readonly DeprecatedExportEntry[] = [];

/* =============================================================================
   CE QUE LA 4.0.0 RETIRE.

   Une copie FIGÉE des deux tables ci-dessus, prise avant le retrait : elle
   survit aux noms qu'elle décrit. La page « Migrer vers la 4.0 » la lit, le
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
    since: '2.6',
  },
  {
    component: 'ConfirmDialog',
    prop: 'onCancel',
    replacement: 'onOpenChange',
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

type PropTable = (typeof DEPRECATED_PROPS)[number];

/** Un composant qui accepte au moins une prop dépréciée. */
export type DeprecatedComponent = PropTable['component'];

/** Les props dépréciées d'un composant, et seulement les siennes. */
export type DeprecatedPropOf<C extends DeprecatedComponent> = Extract<
  PropTable,
  { readonly component: C }
>['prop'];

function findProp(component: string, prop: string): DeprecatedPropEntry | undefined {
  return (DEPRECATED_PROPS as readonly DeprecatedPropEntry[]).find(
    (entry) => entry.component === component && entry.prop === prop,
  );
}

/** Le message d'une prop dépréciée, tel que la console l'affiche. */
export function deprecationMessage(entry: DeprecatedPropEntry): string {
  const note = entry.note ? ` (${entry.note})` : '';
  return (
    `[Opale] ${entry.component} : \`${entry.prop}\` est déprécié depuis ${entry.since} ` +
    `et sera retiré en ${entry.removal} — utilisez \`${entry.replacement}\`${note}.`
  );
}

/** Avertit, une fois et en développement, qu'une prop dépréciée est employée. */
export function warnDeprecated<C extends DeprecatedComponent>(
  component: C,
  prop: DeprecatedPropOf<C>,
): void {
  const entry = findProp(component, prop);
  if (entry) warnOnce(`${component}.${prop}`, deprecationMessage(entry));
}

/**
 * Avertit pour chaque prop dépréciée REÇUE : une valeur `undefined` vaut une
 * prop absente, comme pour le composant lui-même. S'appelle pendant le rendu —
 * c'est idempotent, donc sans risque sous `StrictMode` — avec les valeurs
 * brutes, avant tout défaut de déstructuration.
 */
export function warnDeprecatedProps<C extends DeprecatedComponent>(
  component: C,
  props: { readonly [P in DeprecatedPropOf<C>]?: unknown },
): void {
  for (const [prop, value] of Object.entries(props)) {
    if (value !== undefined) warnDeprecated(component, prop as DeprecatedPropOf<C>);
  }
}

/* ---- L'interrupteur sans nom.

   Pas une dépréciation, mais le même canal : une fois, en développement. Le
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

   Pas une dépréciation au sens de la table — aucune prop n'est renommée —,
   mais le même canal : une fois, en développement. `<Icon />` dessine une
   étincelle et `<Donut />` affiche 60 % : deux valeurs de démonstration qui
   passent en production sans que rien ne les signale. */
const IMPLICIT_DEFAULTS = {
  Icon: '`name` n’est passé — l’icône `sparkle` est dessinée par défaut. Passez `name`',
  Donut: '`value` n’est passée — l’anneau affiche 60 % par défaut. Passez `value`',
} as const;

/** Les composants dont un défaut de démonstration est signalé en développement. */
export type ImplicitDefaultComponent = keyof typeof IMPLICIT_DEFAULTS;

/**
 * Avertit, une fois et en développement, qu'un composant s'appuie sur un
 * défaut de démonstration. S'appelle pendant le rendu, comme
 * `warnDeprecatedProps` : c'est idempotent.
 */
export function warnImplicitDefault(component: ImplicitDefaultComponent): void {
  const article = component === 'Donut' ? 'aucune' : 'aucun';
  warnOnce(
    `${component}#default`,
    `[Opale] ${component} : ${article} ${IMPLICIT_DEFAULTS[component]} : ce défaut disparaîtra en ${DEPRECATION_REMOVAL}.`,
  );
}

/** Oublie les avertissements déjà émis. Réservé aux tests. */
export function resetDeprecationWarnings(): void {
  resetWarnings();
}
