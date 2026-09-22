import type { ReactNode } from 'react';

/* =============================================================================
   LE MODÈLE DE LA VITRINE — une page par sujet, une entrée de nav par page.

   La vitrine était UNE page de charte qui déroulait sept sections ; elle est
   désormais un site de documentation : une barre de navigation à gauche, une
   page à droite, et une entrée de navigation par composant publié. Le routage
   passe par le FRAGMENT (`#/composants/button`) et non par l'historique
   `pushState` : la vitrine est servie en statique depuis `dist-showcase/`, sans
   serveur capable de réécrire une URL profonde vers `index.html`. Un chemin
   réel se casserait donc au premier rechargement, et au premier lien partagé.

   Ce fichier ne contient que le MODÈLE — les types, les groupes, la lecture du
   fragment. Les pages elles-mêmes vivent dans `pages/`, la coquille dans
   `doc-shell.tsx` : aucun des deux n'a besoin de connaître l'autre.
   ========================================================================== */

/** Les trois familles de la barre de gauche, dans l'ordre où elle les sert. */
export type DocGroupId = 'introduction' | 'fondations' | 'composants';

export interface DocGroup {
  readonly id: DocGroupId;
  readonly label: string;
}

export const GROUPS: readonly DocGroup[] = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'fondations', label: 'Fondations' },
  { id: 'composants', label: 'Composants' },
];

export interface DocPage {
  /** Le fragment sans son préfixe. `''` est l'accueil. */
  readonly slug: string;
  /** Le libellé dans la barre de gauche — court, c'est une colonne étroite. */
  readonly label: string;
  readonly group: DocGroupId;
  /** Le `<h1>` de la page, et le titre du document. */
  readonly title: string;
  /** Le chapeau, rendu par la coquille juste sous le titre. */
  readonly lede?: ReactNode;
  /**
   * Le corps de la page. Une FONCTION et non un `ReactNode` : le registre est
   * un module de premier niveau, donc évalué à l'import — un nœud construit
   * là rendrait les vingt pages non affichées à chaque chargement.
   */
  readonly render: () => ReactNode;
}

/** Une entrée de la navigation visuelle inspirée de la référence V3. */
export interface DocNavEntry {
  readonly label: string;
  readonly page: DocPage;
}

/** Une famille du sommaire, résolue contre le registre réel des pages. */
export interface DocNavSection {
  readonly id: string;
  readonly label: string;
  readonly entries: readonly DocNavEntry[];
}

/* Ces pages sont accessibles depuis les onglets permanents du header. Elles
   ne doivent donc pas être répétées dans le rail latéral. */
const HEADER_NAV_SLUGS = new Set(['', 'installation', 'notes-de-versions']);

interface DocNavEntryDefinition {
  readonly label: string;
  readonly slug: string;
}

interface DocNavSectionDefinition {
  readonly id: string;
  readonly label: string;
  readonly entries: readonly DocNavEntryDefinition[];
}

function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function normalizeCatalogLabel(value: string): string {
  return value === 'BackgroundSurface' ? 'Background' : value;
}

/* LE PRÉFIXE A DISPARU AVEC LE NOM DE L'AUTRE LIBRAIRIE, ET LE DÉCAPAGE AVEC.

   Les composants portaient un préfixe hérité de la librairie amont dont ce
   catalogue est issu, et cette fonction le retirait pour afficher « Button ».
   Ils s'appellent désormais `Button` et `Card` tout court : il n'y a plus rien
   à retirer, et garder un `replace(/^Opale/, '')` aurait été pire qu'inutile —
   il aurait mangé le début du premier composant dont le nom commence par
   « Opale ». */
export function catalogComponentLabel(name: string): string {
  return normalizeCatalogLabel(name);
}

export function catalogComponentSlug(name: string): string {
  return `composants/opale-${kebabCase(catalogComponentLabel(name))}`;
}

function opaleEntry(name: string, label = name): DocNavEntryDefinition {
  return { label: normalizeCatalogLabel(label), slug: catalogComponentSlug(name) };
}

/**
 * Le plan du sommaire V3, relevé dans l'application de référence.
 *
 * Les pages restent libres de leur groupe historique (`GROUPS`) : cette liste
 * décrit seulement l'ordre éditorial du rail. C'est ce qui permet de copier
 * le sommaire sans déplacer ni supprimer les pages déjà publiées par Opale.
 */
export const OPALE_NAV_SECTIONS: readonly DocNavSectionDefinition[] = [
  {
    id: 'prise-en-main',
    label: 'PRISE EN MAIN',
    entries: [
      { label: 'Utilisation', slug: 'utilisation' },
      /* « Thèmes » et non « Theming » : le sommaire tient ses libellés à part
         de ceux des pages, donc renommer la page ne suffisait pas — la
         navigation aurait gardé l'anglicisme. Le slug reste `theming`, déjà
         dans les signets et dans les tables de traduction. */
      { label: 'Thèmes', slug: 'theming' },
      { label: 'Typographie', slug: 'typographie' },
      { label: 'Icônes', slug: 'icones' },
    ],
  },
  {
    id: 'fondations',
    label: 'FONDATIONS',
    entries: [
      { label: 'La palette', slug: 'palette' },
      { label: 'Espacement et rayons', slug: 'espacement' },
      { label: 'Élévation', slug: 'elevation' },
      { label: 'Verre', slug: 'verre' },
      { label: 'Le verre liquide', slug: 'verre-liquide' },
      { label: 'Accessibilité', slug: 'accessibilite' },
    ],
  },
  {
    id: 'inputs',
    label: 'INPUTS',
    entries: [
      opaleEntry('Button', 'Button'),
      opaleEntry('Pressable', 'Pressable'),
      opaleEntry('InlineInput', 'InlineInput'),
      opaleEntry('Input', 'Input'),
      opaleEntry('Checkbox', 'Checkbox'),
      opaleEntry('Toggle', 'Toggle'),
      opaleEntry('Slider', 'Slider'),
      opaleEntry('MultiSelect', 'MultiSelect'),
      opaleEntry('Select', 'Select'),
      opaleEntry('Autocomplete', 'Autocomplete'),
      opaleEntry('Form', 'Form'),
      opaleEntry('LanguageSelector', 'LanguageSelector'),
      opaleEntry('SegmentedControl', 'SegmentedControl'),
      opaleEntry('ThemeToggle', 'ThemeToggle'),
      /* SIX ENTRÉES VENDORÉES ONT QUITTÉ CETTE SECTION — `Button`, `Input`,
         `Checkbox`, `Slider`, `Select` et `Switch`. Chacune doublonnait la
         `opaleEntry` qui la précède : le rail affichait « Input » puis
         « Input » sans dire lequel prendre. Leurs composants sont désormais la
         matière derrière `liquidGlass`, documentée sur la page Opale, et leurs
         pages sont supprimées.

         `composants/button` ÉTAIT DÉJÀ MORTE AVANT CE NETTOYAGE, et personne ne
         l'avait vu : `navSectionsForPages` résout chaque slug par un
         `bySlug.get()` et SAUTE EN SILENCE ceux qu'aucune page ne sert. Une
         entrée fantôme ne rougit donc nulle part et ne s'affiche pas non plus —
         elle se contente de mentir à qui lit cette liste. C'est la raison pour
         laquelle les cinq autres partent ici et pas « plus tard ».

         `SearchBar` reste : il n'a pas de jumeau Opale. */
      { label: 'SearchBar', slug: 'composants/search-bar' },
    ],
  },
  {
    id: 'boutons-specialises',
    label: 'BOUTONS SPÉCIALISÉS',
    entries: [
      opaleEntry('AddButton', 'AddButton'),
      opaleEntry('SaveButton', 'SaveButton'),
      opaleEntry('ApproveButton', 'ApproveButton'),
      opaleEntry('EditButton', 'EditButton'),
      opaleEntry('DeleteButton', 'DeleteButton'),
      opaleEntry('IconActionButton', 'IconActionButton'),
    ],
  },
  {
    id: 'affichage-de-donnees',
    label: 'AFFICHAGE DE DONNÉES',
    entries: [
      opaleEntry('Card', 'Card'),
      opaleEntry('CardGrid', 'CardGrid'),
      opaleEntry('DataTable', 'DataTable'),
      opaleEntry('DescriptionList', 'DescriptionList'),
      opaleEntry('BulletList', 'BulletList'),
      opaleEntry('StatusChip', 'StatusChip'),
      opaleEntry('Badge', 'Badge'),
      opaleEntry('Rating', 'Rating'),
      opaleEntry('StatCard', 'StatCard'),
      opaleEntry('Donut', 'Donut'),
      opaleEntry('LegalLinks', 'LegalLinks'),
      opaleEntry('Legend', 'Legend'),
      opaleEntry('Heading', 'Heading'),
      opaleEntry('Text', 'Text'),
      opaleEntry('Icon', 'Icon'),
      /* `Badge` et `Card` vendorés sont partis pour la même raison que les six
         d'INPUTS : ils doublonnaient `opaleEntry('Badge')` et
         `opaleEntry('Card')` juste au-dessus. `Glass` est parti à son tour :
         ce n'est pas un composant mais le matériau des autres, et la page
         « Le verre liquide » le documente en tant que tel. */
    ],
  },
  {
    id: 'feedback',
    label: 'FEEDBACK',
    entries: [
      opaleEntry('Feedback', 'Feedback'),
      opaleEntry('Toast', 'Toast'),
      opaleEntry('Spinner', 'Spinner'),
      opaleEntry('ProgressBar', 'ProgressBar'),
      opaleEntry('ConfirmDialog', 'ConfirmDialog'),
      opaleEntry('EmptyState', 'EmptyState'),
      { label: 'Modal', slug: 'composants/modal' },
      /* « ToastProvider » ET NON « Toast » : le doublon de cette section
         n'était pas un composant mais un NOM. Le vendoré n'expose pas de
         `Toast` — il expose une file (`ToastProvider` + `useToast`) portaillée
         sur `document.body`, là où `opaleEntry('Toast')` ci-dessus
         documente une notification rendue en place. Les deux restent, sous
         deux noms qui les distinguent enfin. */
      { label: 'ToastProvider', slug: 'composants/toast-provider' },
    ],
  },
  {
    id: 'navigation',
    label: 'NAVIGATION',
    entries: [
      opaleEntry('Navbar', 'Navbar'),
      opaleEntry('Menu', 'Menu'),
      opaleEntry('Link', 'Link'),
      opaleEntry('SidePanel', 'SidePanel'),
      opaleEntry('SettingsMenu', 'SettingsMenu'),
      opaleEntry('CommandPalette', 'CommandPalette'),
      opaleEntry('Breadcrumb', 'Breadcrumb'),
      opaleEntry('Toolbar', 'Toolbar'),
      opaleEntry('CookieBanner', 'CookieBanner'),
      opaleEntry('Scrollbar', 'Scrollbar'),
      opaleEntry('SelectionBar', 'SelectionBar'),
      { label: 'Tabs', slug: 'composants/tabs' },
      { label: 'Sidebar', slug: 'composants/sidebar' },
      { label: 'SiteNav', slug: 'composants/site-nav' },
      { label: 'Topbar', slug: 'composants/topbar' },
    ],
  },
  {
    id: 'mise-en-page',
    label: 'MISE EN PAGE',
    entries: [
      opaleEntry('Stack', 'Stack'),
      opaleEntry('Layout', 'Layout'),
      opaleEntry('PageScaffold', 'PageScaffold'),
      opaleEntry('PageContent', 'PageContent'),
      opaleEntry('Divider', 'Divider'),
      opaleEntry('Separator', 'Separator'),
      opaleEntry('BackgroundSurface', 'Background'),
    ],
  },
  {
    id: 'modules',
    label: 'MODULES',
    entries: [
      opaleEntry('FileCard', 'FileCard'),
      opaleEntry('Dropzone', 'Dropzone'),
      opaleEntry('Lightbox', 'Lightbox'),
      opaleEntry('Map', 'Map'),
      opaleEntry('RouteGuard', 'Auth'),
      opaleEntry('I18n', 'i18n'),
      opaleEntry('Http', 'HTTP'),
      opaleEntry('Validation', 'Validation'),
      opaleEntry('Sound', 'Sound'),
      opaleEntry('LocalStore', 'Local store'),
      opaleEntry('Countdown', 'Countdown'),
      opaleEntry('Game', 'Game'),
      opaleEntry('Clipboard', 'Clipboard'),
      opaleEntry('SvgMap', 'SVG map'),
    ],
  },
];

const OPALE_NAV_MARKER_SLUG = 'composants/opale-button';

function legacyNavSectionsForPages(pages: readonly DocPage[]): readonly DocNavSection[] {
  return GROUPS.flatMap((group) => {
    const entries = pages
      .filter((page) => page.group === group.id)
      .map((page) => ({ label: page.label, page }));

    return entries.length > 0 ? [{ id: group.id, label: group.label, entries }] : [];
  });
}

/**
 * Résout le plan V3 contre le registre fourni.
 *
 * Les petits registres de test et les intégrations historiques qui ne
 * contiennent pas le catalogue V3 gardent l'ancien classement par
 * familles. Le registre de la vitrine V3, lui, contient le marqueur du
 * catalogue et reçoit le plan thématique complet ci-dessus. Les pages
 * historiques sont volontairement intégrées à la famille qui correspond à
 * leur rôle : il n'existe pas de catégorie « Opale » fourre-tout.
 */
export function navSectionsForPages(pages: readonly DocPage[]): readonly DocNavSection[] {
  if (!pages.some((page) => page.slug === OPALE_NAV_MARKER_SLUG)) {
    return legacyNavSectionsForPages(pages);
  }

  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const assignedSlugs = new Set<string>();
  const sections = OPALE_NAV_SECTIONS.flatMap((section) => {
    const entries = section.entries.flatMap((definition) => {
      const page = bySlug.get(definition.slug);

      if (!page) return [];

      assignedSlugs.add(page.slug);
      return [{ label: definition.label, page }];
    });

    return entries.length > 0 ? [{ ...section, entries }] : [];
  });

  const unassignedEntries = pages
    .filter((page) => !assignedSlugs.has(page.slug) && !HEADER_NAV_SLUGS.has(page.slug))
    .map((page) => ({ label: page.label, page }));

  return unassignedEntries.length > 0
    ? [...sections, { id: 'autres', label: 'AUTRES', entries: unassignedEntries }]
    : sections;
}

/** Les entrées dans l'ordre visuel du rail — utile aux contrôles de registre. */
export function navEntriesForPages(pages: readonly DocPage[]): readonly DocNavEntry[] {
  return navSectionsForPages(pages).flatMap((section) => section.entries);
}

/** L'accueil. Sert aussi de repli pour un fragment qu'on ne connaît pas. */
export const HOME_SLUG = '';

/**
 * Le fragment d'une page, lu sans confiance.
 *
 * Tolérant par nécessité : les spécimens contiennent des liens écrits à la
 * main du temps où la vitrine tenait sur une page — `href="#palette"` — et
 * un visiteur qui tape une adresse ajoute ou oublie la barre oblique. Les
 * quatre formes `#/palette`, `#palette`, `#/palette/` et `palette` désignent
 * donc la même page.
 */
export function parseSlug(hash: string): string {
  let raw = hash.trim();

  if (raw.startsWith('#')) raw = raw.slice(1);

  /* Le fragment arrive percent-encodé quand le navigateur l'a normalisé. Un
     fragment malformé (`%E0%`) fait lever `decodeURIComponent` : la vitrine
     doit alors servir l'accueil, pas une page blanche. */
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return HOME_SLUG;
  }

  return raw.replace(/^\/+/, '').replace(/\/+$/, '');
}

/** L'adresse d'une page. Toujours préfixée `#/` : c'est la forme canonique. */
export function hrefFor(slug: string): string {
  return `#/${slug}`;
}

/** La page d'un fragment, ou `undefined` — la coquille décide du repli. */
export function findPage(pages: readonly DocPage[], slug: string): DocPage | undefined {
  return pages.find((page) => page.slug === slug);
}
