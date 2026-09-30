/* =============================================================================
   LES NOMS DÉPRÉCIÉS D'OPALE, EN UN SEUL ENDROIT.

   Depuis 3.6 et 3.7, une quarantaine de props et d'exports portent
   `@deprecated` : ils compilent encore, gardent leur effet, et l'éditeur les
   barre. La 4.0.0 les retirera. Cette table est leur SOURCE DE VÉRITÉ :
   l'avertissement de développement la lit, la page « Migrer vers la 4.0 » de
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

/** La version où un nom a été déprécié. */
export type DeprecatedSince = '3.6' | '3.7';

/** La version qui retirera les noms dépréciés. */
export const DEPRECATION_REMOVAL = '4.0.0';

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
      since: '3.7',
      removal: '4.0.0',
      source: 'components/glass/Glass.tsx',
    },
    {
      component,
      prop: 'triggerAnimation',
      replacement: 'liquidGlass',
      note: 'l’onde programmée est interne au matériau',
      since: '3.7',
      removal: '4.0.0',
      source: 'components/glass/Glass.tsx',
    },
  ] as const satisfies readonly DeprecatedPropEntry[];
}

export const DEPRECATED_PROPS = [
  /* ---- Modal */
  {
    component: 'Modal',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'components/modal/Modal.tsx',
  },
  {
    component: 'Modal',
    prop: 'triggerAnimation',
    replacement: 'enableLiquidAnimation',
    note: 'l’onde d’ouverture est programmée par la modale',
    since: '3.7',
    removal: '4.0.0',
    source: 'components/modal/Modal.tsx',
  },
  {
    component: 'Modal',
    prop: 'as',
    replacement: 'className',
    note: 'la balise du panneau est interne au verre',
    since: '3.7',
    removal: '4.0.0',
    source: 'components/modal/Modal.tsx',
  },
  {
    component: 'Modal',
    prop: 'pressFeedback',
    replacement: 'liquidGlass',
    note: 'le rebond est interne au matériau',
    since: '3.7',
    removal: '4.0.0',
    source: 'components/modal/Modal.tsx',
  },

  /* ---- Tabs */
  {
    component: 'Tabs',
    prop: 'as',
    replacement: 'className',
    note: 'la balise du contenu est interne au verre',
    since: '3.7',
    removal: '4.0.0',
    source: 'components/tabs/Tabs.tsx',
  },
  {
    component: 'Tabs',
    prop: 'pressFeedback',
    replacement: 'liquidGlass',
    note: 'le rebond est interne au matériau',
    since: '3.7',
    removal: '4.0.0',
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
    since: '3.6',
    removal: '4.0.0',
    source: 'components/sidebar/Sidebar.tsx',
  },
  {
    component: 'Sidebar',
    prop: 'activeItemId',
    replacement: 'value',
    since: '3.6',
    removal: '4.0.0',
    source: 'components/sidebar/Sidebar.tsx',
  },
  {
    component: 'Sidebar',
    prop: 'defaultActiveItemId',
    replacement: 'defaultValue',
    since: '3.6',
    removal: '4.0.0',
    source: 'components/sidebar/Sidebar.tsx',
  },
  {
    component: 'Sidebar',
    prop: 'onSelectItem',
    replacement: 'onValueChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'components/sidebar/Sidebar.tsx',
  },

  /* ---- SearchBar, SiteNav, file de notifications */
  {
    component: 'SearchBar',
    prop: 'enableClickAnimation',
    replacement: 'enableLiquidAnimation',
    since: '3.7',
    removal: '4.0.0',
    source: 'components/search-bar/SearchBar.tsx',
  },
  {
    component: 'SiteNav',
    prop: 'activeItem',
    replacement: 'value',
    since: '3.6',
    removal: '4.0.0',
    source: 'components/site-nav/site-nav.tsx',
  },
  {
    component: 'showToast',
    prop: 'variant',
    replacement: 'tone',
    note: '`default` → `neutral`',
    since: '3.6',
    removal: '4.0.0',
    source: 'components/toast/ToastProvider.tsx',
  },

  /* ---- Le catalogue */
  {
    component: 'DataTable',
    prop: 'emptyMessage',
    replacement: 'labels.empty',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/display.tsx',
  },
  {
    component: 'DataTable',
    prop: 'density',
    replacement: 'size',
    note: '`compact` → `small`',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/display.tsx',
  },
  {
    component: 'Lightbox',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/modules.tsx',
  },
  {
    component: 'Feedback',
    prop: 'severity',
    replacement: 'tone',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/feedback.tsx',
  },
  {
    component: 'Toast',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/feedback.tsx',
  },
  {
    component: 'ConfirmDialog',
    prop: 'onCancel',
    replacement: 'onOpenChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/feedback.tsx',
  },
  {
    component: 'MultiSelect',
    prop: 'values',
    replacement: 'value',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/forms.tsx',
  },
  {
    component: 'SegmentedControl',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/forms.tsx',
  },
  {
    component: 'Navbar',
    prop: 'activeId',
    replacement: 'value',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/navigation.tsx',
  },
  {
    component: 'Navbar',
    prop: 'onSelect',
    replacement: 'onValueChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/navigation.tsx',
  },
  {
    component: 'SidePanel',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/navigation.tsx',
  },
  {
    component: 'CommandPalette',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/navigation.tsx',
  },
  {
    component: 'CommandPalette',
    prop: 'onClose',
    replacement: 'onOpenChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/navigation.tsx',
  },
  {
    component: 'Pagination',
    prop: 'page',
    replacement: 'value',
    since: '3.6',
    removal: '4.0.0',
    source: 'opale-extras.tsx',
  },
  {
    component: 'Pagination',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'opale-extras.tsx',
  },
  {
    component: 'RatingInput',
    prop: 'onChange',
    replacement: 'onValueChange',
    since: '3.6',
    removal: '4.0.0',
    source: 'opale-extras.tsx',
  },
] as const satisfies readonly DeprecatedPropEntry[];

export const DEPRECATED_EXPORTS = [
  {
    name: 'OpaleUI',
    kind: 'value',
    replacement: null,
    note: 'importez chaque composant par son nom',
    since: '3.6',
    removal: '4.0.0',
    source: 'opale-namespace.ts',
  },
  {
    name: 'Opale.Background',
    kind: 'value',
    replacement: 'BackgroundSurface',
    since: '3.6',
    removal: '4.0.0',
    source: 'opale-namespace.ts',
  },
  {
    name: 'OPALE_CATALOG',
    kind: 'value',
    replacement: null,
    note: 'métadonnée de la vitrine, sans remplaçant public',
    since: '3.6',
    removal: '4.0.0',
    source: 'opale.ts',
  },
  {
    name: 'CatalogEntry',
    kind: 'type',
    replacement: null,
    note: 'métadonnée de la vitrine, sans remplaçant public',
    since: '3.6',
    removal: '4.0.0',
    source: 'opale.ts',
  },
  {
    name: 'ToastPlacement',
    kind: 'type',
    replacement: 'OpalePlacement',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/feedback.tsx',
  },
  {
    name: 'ToastTone',
    kind: 'type',
    replacement: 'OpaleTone',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/feedback.tsx',
  },
  {
    name: 'FieldProps',
    kind: 'type',
    replacement: 'InputProps',
    since: '3.6',
    removal: '4.0.0',
    source: 'catalog/forms.tsx',
  },
  {
    name: 'DEFAULT_SITE_NAV_ITEMS',
    kind: 'value',
    replacement: 'items',
    note: 'passez vos destinations à `SiteNav`',
    since: '3.6',
    removal: '4.0.0',
    source: 'components/site-nav/default-items.ts',
  },
] as const satisfies readonly DeprecatedExportEntry[];

type PropTable = (typeof DEPRECATED_PROPS)[number];

/** Un composant qui accepte au moins une prop dépréciée. */
export type DeprecatedComponent = PropTable['component'];

/** Les props dépréciées d'un composant, et seulement les siennes. */
export type DeprecatedPropOf<C extends DeprecatedComponent> = Extract<
  PropTable,
  { readonly component: C }
>['prop'];

/* `typeof process` ne suffit pas : dans le navigateur, `process` n'existe pas,
   mais le bundler de l'application a déjà réécrit `process.env.NODE_ENV` en
   chaîne littérale. Un garde `typeof process !== 'undefined'` éteindrait donc
   l'avertissement dans tout serveur de développement Vite. On lit l'expression
   telle quelle — c'est elle que les bundlers remplacent — et une
   `ReferenceError` (aucun bundler, aucun Node) vaut « on ne sait pas », donc
   silence. */
declare const process: { readonly env: { readonly NODE_ENV?: string } };

function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

/* UNE FOIS PAR CHARGEMENT DE PAGE, et par couple composant + prop. Une liste
   rendue cent fois ne doit pas écrire cent lignes. */
const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (!isDevelopment() || warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

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

/* LE MÊME CONTRÔLE POUR SIX AUTRES COMPOSANTS (ACC-21). Seul l'interrupteur
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

/** Oublie les avertissements déjà émis. Réservé aux tests. */
export function resetDeprecationWarnings(): void {
  warned.clear();
}
