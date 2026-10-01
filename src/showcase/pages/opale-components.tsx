import { useState } from 'react';

import { Opale } from '../../opale';
import type { ShowcaseCatalogEntry } from '../../opale/catalog';
import { SHOWCASE_CATALOG } from '../showcase-catalog';
import { catalogCategoryLabel } from '../catalog-category';
import { catalogComponentLabel, catalogComponentSlug } from '../doc-model';
import { PropsTable, UsageBlock } from './api';
import { COMPONENT_ALTERNATIVES } from './component-alternatives';
import { ComponentPageLayout, InlineCode } from './component-page';
import { CATALOG_A11Y } from './opale-a11y-data';
import { CATALOG_API } from './opale-api-data';
import { CatalogPreview, type PlaygroundConfig } from './catalog-preview';
import { MaterialToggle } from './composants/material-switch';

/* Les composants qui peignent une surface, et donc qui portent le matériau.
   Cette liste commande à la fois le commutateur de la démo et l'ajout de
   ` liquidGlass` à l'extrait affiché : un composant qui ne rend pas le verre
   n'a ni l'un ni l'autre. Un test la compare à ce que `catalog-preview.tsx`
   transmet vraiment. */
const FORWARDS_LIQUID_GLASS: readonly string[] = [
  'Autocomplete',
  'Badge',
  'Breadcrumb',
  'Button',
  'Card',
  'CardGrid',
  'Checkbox',
  'Clipboard',
  'CommandPalette',
  'ConfirmDialog',
  'CookieBanner',
  'DataTable',
  'DropdownMenu',
  'Dropzone',
  'EmptyState',
  'Feedback',
  'FileCard',
  'IconActionButton',
  'InlineInput',
  'Input',
  'Lightbox',
  'Link',
  'Menu',
  'MultiSelect',
  'Navbar',
  'Pagination',
  'Popover',
  'Pressable',
  'RadioGroup',
  'ProgressBar',
  'Rating',
  'SegmentedControl',
  'Select',
  'SelectionBar',
  'SidePanel',
  'Slider',
  'StatCard',
  'SvgMap',
  'Textarea',
  'Toast',
  'Toggle',
  'Tooltip',
];

/* La balise qui reçoit le matériau quand ce n'est pas celle du composant : les
   cartes de la grille, le panneau du popover, la liste du menu. */
const LIQUID_GLASS_TARGET: Readonly<Record<string, string>> = {
  CardGrid: 'StatCard',
  DropdownMenu: 'DropdownMenuContent',
  Popover: 'PopoverContent',
};

/* Les pièces à importer avec le composant, quand il se compose de plusieurs
   exports. La première est celle de la page. */
const PAGE_IMPORTS: Readonly<Record<string, readonly string[]>> = {
  Carousel: ['Carousel', 'CarouselSlide'],
  DropdownMenu: [
    'DropdownMenu',
    'DropdownMenuTrigger',
    'DropdownMenuContent',
    'DropdownMenuItem',
    'DropdownMenuCheckboxItem',
    'DropdownMenuRadioGroup',
    'DropdownMenuRadioItem',
    'DropdownMenuSeparator',
  ],
  Field: ['Field', 'useFieldProps'],
  Popover: ['Popover', 'PopoverTrigger', 'PopoverContent'],
  RadioGroup: ['RadioGroup', 'Radio'],
};

/** Ajoute la prop à la balise ouvrante ciblée, y compris avec des callbacks `=>` dans les attributs. */
function withLiquidGlass(code: string, name: string): string {
  const target = LIQUID_GLASS_TARGET[name] ?? catalogComponentLabel(name);
  const starts = [...code.matchAll(new RegExp(`<Opale\\.${target}(?=[\\s/>])`, 'g'))];
  const insertions: number[] = [];

  for (const match of starts) {
    const start = match.index;
    let braces = 0;
    let quote: string | null = null;
    for (let index = start + match[0].length; index < code.length; index += 1) {
      const char = code[index];
      if (quote) {
        if (char === '\\') {
          index += 1;
          continue;
        }
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'" || char === '`') {
        quote = char;
      } else if (char === '{') {
        braces += 1;
      } else if (char === '}') {
        braces -= 1;
      } else if (char === '>' && braces === 0) {
        const tag = code.slice(start, index);
        if (!/\bliquidGlass\b/.test(tag))
          insertions.push(code[index - 1] === '/' ? index - 1 : index);
        break;
      }
    }
  }
  return insertions
    .reverse()
    .reduce((result, index) => `${result.slice(0, index)} liquidGlass${result.slice(index)}`, code);
}

/** Les fonctions du paquet qu'un extrait appelle directement, sans namespace. */
const PACKAGE_FUNCTIONS = ['readCookieConsent', 'useFieldProps'];

/* Les exemples sont écrits avec `Opale.X` pour viser une balise sans
   ambiguïté (voir `withLiquidGlass`) ; l'extrait affiché importe `X` par nom. */
function withNamedImports(code: string): string {
  const used = new Set([...code.matchAll(/\bOpale\.([A-Z]\w*)/g)].map(([, member]) => member));
  for (const name of PACKAGE_FUNCTIONS) {
    if (new RegExp(`\\b${name}\\(`).test(code)) used.add(name);
  }
  const body = code.replace(/\bOpale\.([A-Z]\w*)/g, '$1');
  const names = [...used].sort((a, b) => a.localeCompare(b));
  return `import { ${names.join(', ')} } from '@thomascaron/opale-ui';\n\n${body}`;
}

/** Chaque fiche du catalogue possède un exemple qui montre son usage réel. */
const REPRESENTATIVE_EXAMPLES: Readonly<Record<string, string>> = {
  Pressable: '<Opale.Pressable onClick={() => alert("Action")}>Ouvrir</Opale.Pressable>',
  MultiSelect: `<Opale.MultiSelect
  label="Domaines"
  defaultValue={['design']}
  options={[{ value: 'design', label: 'Design' }, { value: 'code', label: 'Code' }]}
  onValueChange={(value) => console.log(value)}
/>`,
  Select: `<Opale.Select
  label="Domaine"
  defaultValue="design"
  options={[{ value: 'design', label: 'Design' }, { value: 'code', label: 'Code' }]}
/>`,
  Autocomplete: `<Opale.Autocomplete
  label="Composant"
  options={['Button', 'Card', 'Select']}
  placeholder="Commencez à saisir…"
/>`,
  Form: `<Opale.Form onSubmit={(event) => { event.preventDefault(); alert('Envoyé'); }}>
  <Opale.Input label="Projet" name="project" required />
  <Opale.Button type="submit">Envoyer</Opale.Button>
</Opale.Form>`,
  IconActionButton: `<Opale.IconActionButton
  icon="share"
  label="Partager cette page"
  onClick={() => void navigator.clipboard?.writeText(location.href)}
/>`,
  DescriptionList: `<Opale.DescriptionList items={[
  { term: 'Version', description: '2.2.0' },
  { term: 'Licence', description: 'MIT' },
]} />`,
  BulletList: `<Opale.BulletList items={['Clavier', 'Thème sombre', 'TypeScript']} />`,
  Donut: '<Opale.Donut value={72} label="72 % des tâches terminées" />',
  LegalLinks: `<Opale.LegalLinks links={[
  { id: 'legal', label: 'Mentions légales', href: '/mentions-legales' },
  { id: 'privacy', label: 'Confidentialité', href: '/confidentialite' },
]} />`,
  Icon: '<Opale.Icon name="compass" label="Boussole" />',
  Spinner: '<Opale.Spinner label="Chargement des projets" />',
  ConfirmDialog: `import { useState } from 'react';

export function DeleteAction() {
  const [open, setOpen] = useState(false);
  return <>
    <Opale.Button variant="danger" onClick={() => setOpen(true)}>Supprimer</Opale.Button>
    <Opale.ConfirmDialog open={open} title="Supprimer ce projet ?"
      onOpenChange={setOpen}
      onConfirm={() => { setOpen(false); console.log('Projet supprimé'); }}>
      Cette action est irréversible.
    </Opale.ConfirmDialog>
  </>;
}`,
  EmptyState: `<Opale.EmptyState
  title="Aucun projet"
  description="Créez votre premier projet."
  action={<Opale.Link href="/projets/nouveau">Créer un projet</Opale.Link>}
/>`,
  Navbar: `<Opale.Navbar items={[
  { id: 'home', label: 'Accueil', href: '/' },
  { id: 'projects', label: 'Projets', href: '/projets' },
]} value="projects" />`,
  Menu: `<Opale.Menu label="Actions" items={[
  { id: 'duplicate', label: 'Dupliquer' },
  { id: 'archive', label: 'Archiver' },
]} />`,
  SidePanel: `import { useState } from 'react';

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  return <>
    <Opale.Button onClick={() => setOpen(true)}>Réglages</Opale.Button>
    <Opale.SidePanel open={open} title="Réglages" onOpenChange={setOpen}>
      <Opale.Toggle label="Notifications" defaultChecked />
    </Opale.SidePanel>
  </>;
}`,
  CommandPalette: `import { useState } from 'react';

export function Commands() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  return <>
    <Opale.Button onClick={() => setOpen(true)}>Commandes</Opale.Button>
    <Opale.CommandPalette open={open} value={query} onValueChange={setQuery}
      onOpenChange={setOpen} />
  </>;
}`,
  Breadcrumb: `<Opale.Breadcrumb items={[
  { id: 'home', label: 'Accueil', href: '/' },
  { id: 'projects', label: 'Projets', href: '/projets' },
  { id: 'current', label: 'Opale' },
]} />`,
  SelectionBar: `<Opale.SelectionBar selectedCount={3}>
  <Opale.Button size="small" variant="danger">Supprimer la sélection</Opale.Button>
</Opale.SelectionBar>`,
  Stack: `<Opale.Stack direction="row" wrap>
  <Opale.Badge>Design</Opale.Badge><Opale.Badge>Code</Opale.Badge>
</Opale.Stack>`,
  Layout: `<Opale.Layout navigation={<Opale.Navbar items={[{ id: 'home', label: 'Accueil', href: '/' }]} />}>
  <Opale.Heading level={2}>Contenu principal</Opale.Heading>
</Opale.Layout>`,
  Divider: `<Opale.Text>Avant</Opale.Text>
<Opale.Divider />
<Opale.Text>Après</Opale.Text>`,
  BackgroundSurface: `<Opale.BackgroundSurface>
  <Opale.Card title="Contenu au premier plan">Bienvenue</Opale.Card>
</Opale.BackgroundSurface>`,
  Lightbox: `import { useState } from 'react';

export function ImagePreview() {
  const [open, setOpen] = useState(false);
  return <>
    <Opale.Button onClick={() => setOpen(true)}>Voir l’image</Opale.Button>
    <Opale.Lightbox src="/visuel.png" alt="Aperçu du projet" open={open}
      onOpenChange={setOpen} />
  </>;
}`,
  RatingInput: `import { useState } from 'react';

export function ReviewRating() {
  const [rating, setRating] = useState(3);
  return <Opale.RatingInput label="Qualité de l’expérience" value={rating} onValueChange={setRating} />;
}`,
  Pagination: `import { useState } from 'react';

export function ResultsPagination() {
  const [page, setPage] = useState(2);
  return <Opale.Pagination value={page} pageCount={8} onValueChange={setPage} />;
}`,
  Skeleton: `<div role="status" aria-label="Chargement de la fiche">
  <Opale.Skeleton width="45%" height="1.5rem" />
  <Opale.Skeleton height="5rem" />
</div>`,
  SvgMap: `<Opale.SvgMap
  label="Trois zones"
  viewBox="0 0 300 120"
  selectable
  onSelect={(id) => console.log(id)}
  regions={[
    { id: 'nord', path: 'M10 10 H140 V60 H10 Z', name: 'Nord' },
    { id: 'est', path: 'M150 10 H290 V110 H150 Z', name: 'Est' },
    { id: 'sud', path: 'M10 70 H140 V110 H10 Z', name: 'Sud' },
  ]}
/>`,
  Textarea: `// autoResize : de minRows (3) à maxRows lignes, puis le champ défile.
// showCount + maxLength : la limite est décrite, le reste annoncé après une pause.
<Opale.Textarea
  label="Commentaire"
  helperText="Le champ grandit avec le texte, jusqu’à six lignes."
  autoResize
  maxRows={6}
  showCount
  maxLength={200}
/>`,
  RadioGroup: `import { useState } from 'react';

export function PlanChoice() {
  const [plan, setPlan] = useState('');
  return <>
    <Opale.RadioGroup
      label="Formule"
      required
      value={plan}
      onValueChange={setPlan}
      error={plan === '' ? 'Choisissez une formule.' : undefined}
      options={[
        { value: 'free', label: 'Gratuit', description: 'Un projet, sans équipe.' },
        { value: 'pro', label: 'Pro', description: 'Projets illimités.' },
        { value: 'team', label: 'Équipe', disabled: true },
      ]}
    />
    <Opale.RadioGroup
      label="Facturation"
      orientation="horizontal"
      size="small"
      defaultValue="yearly"
      options={[{ value: 'monthly', label: 'Mensuel' }, { value: 'yearly', label: 'Annuel' }]}
    />
  </>;
}`,
  Field: `// 1. La fonction enfant reçoit id et aria-* : à étaler sur l'élément focalisable.
<Opale.Field label="Nombre de places" description="De 1 à 9." required>
  {(fieldProps) => (
    <span {...fieldProps} role="spinbutton" tabIndex={0} aria-valuenow={seats}>{seats}</span>
  )}
</Opale.Field>

// 2. Un contrôle réutilisable lit les mêmes props par useFieldProps().
function SeatStepper({ value }) {
  const fieldProps = useFieldProps();
  return <span {...fieldProps} role="spinbutton" tabIndex={0} aria-valuenow={value}>{value}</span>;
}

<Opale.Field label="Nombre de places">
  <SeatStepper value={seats} />
</Opale.Field>`,
  Grid: `// Un nombre : autant de colonnes égales, qui rétrécissent sans déborder.
<Opale.Grid columns={3} gap="sm">
  <div>Design</div><div>Code</div><div>Tests</div>
</Opale.Grid>

// Une longueur : la largeur minimale d'une piste ; une seule colonne en dessous.
<Opale.Grid columns="9rem">
  <div>Design</div><div>Code</div><div>Tests</div>
</Opale.Grid>`,
  Carousel: `// Le défilement est natif : doigt, trackpad, molette ; glisser à la souris.
<Opale.Carousel label="Composants d'Opale">
  <Opale.CarouselSlide>
    <h3>Button</h3>
    <p>Saisie · tons, tailles, verre liquide en option</p>
  </Opale.CarouselSlide>
  <Opale.CarouselSlide>
    <h3>Textarea</h3>
    <p>Formulaires · grandit avec le texte, compteur annoncé</p>
  </Opale.CarouselSlide>
</Opale.Carousel>

// autoPlay : rend un bouton pause, s'arrête sous le pointeur et au focus.
<Opale.Carousel label="À la une" autoPlay={5000} slideSize="100%">
  …
</Opale.Carousel>`,
  Reveal: `// Visible au repos, sans script ; la montée suit l'entrée dans la vue.
<Opale.Reveal>
  <h2>Les qualités</h2>
</Opale.Reveal>

// Une cascade : chaque rang part 60 ms (--opale-reveal-stagger) après le précédent.
<ul>
  <Opale.Reveal as="li" delay={0}>Accessible</Opale.Reveal>
  <Opale.Reveal as="li" delay={1}>Sans dépendance</Opale.Reveal>
  <Opale.Reveal as="li" delay={2}>Rendu serveur</Opale.Reveal>
</ul>`,
  Tooltip: `// Une description courte, au survol et au focus : jamais une information essentielle.
<Opale.Tooltip content="Enregistre le brouillon sans le publier.">
  <Opale.Button variant="secondary">Enregistrer</Opale.Button>
</Opale.Tooltip>`,
  Popover: `import { useState } from 'react';

export function RenameProject() {
  const [open, setOpen] = useState(false);
  return (
    <Opale.Popover open={open} onOpenChange={setOpen}>
      <Opale.PopoverTrigger className="opale-button opale-button--secondary">
        Renommer le projet
      </Opale.PopoverTrigger>
      <Opale.PopoverContent placement="bottom" align="start">
        <form onSubmit={(event) => { event.preventDefault(); setOpen(false); }}>
          <Opale.Input label="Nom du projet" name="name" required />
          <Opale.Button type="submit" size="small">Enregistrer</Opale.Button>
        </form>
      </Opale.PopoverContent>
    </Opale.Popover>
  );
}`,
  DropdownMenu: `import { useState } from 'react';

export function ProjectActions() {
  const [grid, setGrid] = useState(true);
  const [sort, setSort] = useState('name');
  return (
    <Opale.DropdownMenu>
      <Opale.DropdownMenuTrigger className="opale-button opale-button--secondary">
        Actions
      </Opale.DropdownMenuTrigger>
      <Opale.DropdownMenuContent>
        <Opale.DropdownMenuItem onSelect={() => duplicate()}>Dupliquer</Opale.DropdownMenuItem>
        <Opale.DropdownMenuItem disabled>Archiver</Opale.DropdownMenuItem>
        <Opale.DropdownMenuSeparator />
        <Opale.DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
          Afficher la grille
        </Opale.DropdownMenuCheckboxItem>
        <Opale.DropdownMenuSeparator />
        <Opale.DropdownMenuRadioGroup label="Tri" value={sort} onValueChange={setSort}>
          <Opale.DropdownMenuRadioItem value="name">Trier par nom</Opale.DropdownMenuRadioItem>
          <Opale.DropdownMenuRadioItem value="date">Trier par date</Opale.DropdownMenuRadioItem>
        </Opale.DropdownMenuRadioGroup>
      </Opale.DropdownMenuContent>
    </Opale.DropdownMenu>
  );
}`,
};

function exampleCode(name: string, liquidGlass = false): string {
  const displayName = catalogComponentLabel(name);
  const decorate = (code: string) =>
    liquidGlass && FORWARDS_LIQUID_GLASS.includes(name) ? withLiquidGlass(code, name) : code;

  switch (name) {
    case 'Button':
      return decorate(`<Opale.Button variant="primary">Primaire</Opale.Button>
<Opale.Button variant="secondary">Secondaire</Opale.Button>
<Opale.Button variant="accent">Accent</Opale.Button>
<Opale.Button variant="danger">Danger</Opale.Button>`);
    case 'Input':
      return decorate(`<Opale.Input
  label="Email"
  placeholder="thomas@crn-studio.com"
  helperText="Une adresse valide est requise."
/>`);
    case 'Checkbox':
      return decorate(`<Opale.Checkbox
  label="Recevoir les notifications"
  description="Les nouveautés du design system."
  defaultChecked
/>`);
    case 'Toggle':
      return decorate('<Opale.Toggle label="Activées" defaultChecked />');
    case 'Slider':
      return decorate('<Opale.Slider label="Volume" defaultValue={64} min={0} max={100} />');
    case 'SegmentedControl':
      return decorate(`<Opale.SegmentedControl
  defaultValue="all"
  options={[
    { value: 'all', label: 'Tout' },
    { value: 'active', label: 'Actifs' },
    { value: 'archived', label: 'Archivés' },
  ]}
/>`);
    case 'Card':
      return decorate(`// elevation : 0 (à plat) à 3 (détachée) ; 1 par défaut.
<Opale.Card title="Une surface Opale" subtitle="Carte, actions et élévation." elevation={2}>
  <p>Une surface claire, lisible et responsive.</p>
</Opale.Card>`);
    case 'CardGrid':
      return decorate(`<Opale.CardGrid>
  <Opale.StatCard label="Composants" value="${SHOWCASE_CATALOG.length}" delta="Catalogue Opale" />
  <Opale.StatCard label="Thèmes" value="2 globaux + 1 matériau" />
</Opale.CardGrid>`);
    case 'Badge':
      return decorate(`<Opale.Badge tone="accent">Nouveau</Opale.Badge>
// dot : un point de notification ; le texte reste lu par les lecteurs d'écran.
<Opale.Badge tone="danger" dot>3 messages non lus</Opale.Badge>`);
    case 'StatCard':
      return decorate('<Opale.StatCard label="Disponibilité" value="99,9 %" delta="+0,4 %" />');
    case 'Heading':
      return decorate('<Opale.Heading level={2}>Titre de section</Opale.Heading>');
    case 'Text':
      return decorate('<Opale.Text variant="caption">Légende secondaire</Opale.Text>');
    case 'DataTable':
      return decorate(`// sortable : l'en-tête devient un bouton de tri.
// sortValue : la valeur de tri quand la cellule n'est pas du texte.
<Opale.DataTable
  caption="Composants"
  showRowCount
  striped
  columns={[
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'uses', label: 'Usages', sortable: true, align: 'end' },
    { key: 'status', label: 'Statut' },
  ]}
  rows={[
    { name: 'DataTable', uses: 4, status: 'Nouveau' },
    { name: 'Button', uses: 128, status: 'Stable' },
  ]}
  onSortChange={({ key, direction }) => console.log(key, direction)}
/>`);
    case 'Feedback':
      return decorate(`<Opale.Feedback tone="success" title="En production">
  La dernière version est disponible.
</Opale.Feedback>`);
    case 'Rating':
      return decorate(`// value : la note, au quart près — 0,25 / 0,5 / 0,75 / 1 par étoile.
// max   : le nombre d'étoiles (5 par défaut).
<Opale.Rating value={4.75} max={5} />`);
    case 'Toast':
      return decorate(`// Le ton choisit la couleur, la place choisit le coin de l'ÉCRAN.
// tone     : 'neutral' | 'success' | 'warning' | 'error' | 'info'
// position : 'top-left'    | 'top-center'    | 'top-right'
//            'bottom-left' | 'bottom-center' | 'bottom-right'
<Opale.Toast
  open={open}
  tone="success"
  position="bottom-right"
  message="Étape publiée sur le carnet"
  onOpenChange={setOpen}
/>`);
    case 'ProgressBar':
      return decorate('<Opale.ProgressBar label="Progression" value={72} />');
    case 'Link':
      return decorate('<Opale.Link href="/installation">Lire le guide</Opale.Link>');
    case 'FileCard':
      return decorate(`import { useState } from 'react';

export function FileSelection() {
  const [selected, setSelected] = useState(false);
  return <Opale.FileCard name="design-system.fig" fileSize="2,4 Mo"
    selected={selected} onClick={() => setSelected((value) => !value)} />;
}`);
    case 'Clipboard':
      return decorate('<Opale.Clipboard value="npm install @thomascaron/opale-ui" />');
    case 'CookieBanner':
      return decorate(`// Le choix est mémorisé dans localStorage, sous storageKey
// ('opale-cookie-consent' par défaut ; null coupe la mémoire).
// Sans open, le bandeau ne revient plus une fois le choix fait ;
// open={true} le rouvre, pour un lien « Gérer mes cookies ».

// Au démarrage : onAccept ne part qu'au clic, le choix mémorisé se lit ici.
if (readCookieConsent() === 'accepted') enableAnalytics();

<Opale.CookieBanner
  onAccept={() => enableAnalytics()}
  onDecline={() => disableAnalytics()}
/>`);
    case 'Dropzone':
      return decorate(`// Glisser-déposer ou sélecteur natif : les deux passent par onFiles.
<Opale.Dropzone accept="image/*" maxFiles={3} maxSizeBytes={5000000}
  onFiles={(files) => upload(files)} onError={(message) => announce(message)}>
  Déposez les maquettes ici
</Opale.Dropzone>`);
    case 'InlineInput':
      return decorate(`// Entrée appelle onCommit ; Échap rétablit la dernière valeur validée.
<Opale.InlineInput
  label="Nom du projet"
  defaultValue="Opale"
  onCommit={(value) => rename(value)}
/>`);
    default:
      if (!REPRESENTATIVE_EXAMPLES[name]) {
        throw new Error(`Exemple manquant pour ${displayName}`);
      }
      return decorate(REPRESENTATIVE_EXAMPLES[name]);
  }
}

export function ComponentPage({ entry }: { entry: ShowcaseCatalogEntry }) {
  const displayName = catalogComponentLabel(entry.name);
  const supportsLiquidGlass = FORWARDS_LIQUID_GLASS.includes(entry.name);
  const [liquidGlass, setLiquidGlass] = useState(false);
  const [buttonVariant, setButtonVariant] = useState<PlaygroundConfig['buttonVariant']>('primary');
  const [buttonSize, setButtonSize] = useState<PlaygroundConfig['buttonSize']>('medium');
  const [buttonLoading, setButtonLoading] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [tableMode, setTableMode] = useState<PlaygroundConfig['tableMode']>('filled');
  const [tableSize, setTableSize] = useState<PlaygroundConfig['tableSize']>('medium');
  const [tableStriped, setTableStriped] = useState(true);
  const playground: PlaygroundConfig = {
    buttonVariant,
    buttonSize,
    buttonLoading,
    inputError,
    inputDisabled,
    tableMode,
    tableSize,
    tableStriped,
  };
  const baseCode = exampleCode(entry.name, liquidGlass);
  const code =
    entry.name === 'Button'
      ? `${baseCode}\n\n// Essai configuré\n<Opale.Button variant="${buttonVariant}" size="${buttonSize}"${buttonLoading ? ' loading' : ''}${liquidGlass ? ' liquidGlass' : ''}>Essai configuré</Opale.Button>`
      : entry.name === 'Input'
        ? `<Opale.Input label="Email" placeholder="thomas@crn-studio.com" helperText="Une adresse valide est requise."${inputError ? ' error="Adresse invalide"' : ''}${inputDisabled ? ' disabled' : ''}${liquidGlass ? ' liquidGlass' : ''} />`
        : entry.name === 'DataTable'
          ? `const columns = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'uses', label: 'Usages', sortable: true, align: 'end' },
  { key: 'status', label: 'Statut' },
];
const rows = [
  { name: 'DataTable', uses: 4, status: 'Nouveau' },
  { name: 'Button', uses: 128, status: 'Stable' },
  { name: 'Autocomplete', uses: 17, status: 'Stable' },
];
<Opale.DataTable
  caption="Composants"
  showRowCount${tableStriped ? '\n  striped' : ''}${tableSize === 'small' ? '\n  size="small"' : ''}
  columns={columns}
  rowKey={(row) => String(row.name)}
  rows={${tableMode === 'empty' ? '[]' : 'rows'}}${tableMode === 'loading' ? '\n  loading' : ''}${liquidGlass ? '\n  liquidGlass' : ''}
/>`
          : baseCode;
  const playgroundControls =
    entry.name === 'Button' || entry.name === 'Input' || entry.name === 'DataTable' ? (
      <fieldset className="tc-doc-opale-playground" aria-label={`Réglages de ${displayName}`}>
        <legend>Essayer les états</legend>
        {entry.name === 'Button' && (
          <>
            <label>
              Variante{' '}
              <select
                value={buttonVariant}
                onChange={(event) =>
                  setButtonVariant(event.currentTarget.value as PlaygroundConfig['buttonVariant'])
                }
              >
                <option value="primary">Primaire</option>
                <option value="secondary">Secondaire</option>
                <option value="accent">Accent</option>
                <option value="danger">Danger</option>
              </select>
            </label>
            <label>
              Taille{' '}
              <select
                value={buttonSize}
                onChange={(event) =>
                  setButtonSize(event.currentTarget.value as PlaygroundConfig['buttonSize'])
                }
              >
                <option value="small">Petite</option>
                <option value="medium">Moyenne</option>
                <option value="large">Grande</option>
              </select>
            </label>
            <Opale.Checkbox
              className="tc-doc-opale-playground__check"
              label="Chargement"
              checked={buttonLoading}
              onChange={(event) => setButtonLoading(event.currentTarget.checked)}
            />
          </>
        )}
        {entry.name === 'Input' && (
          <>
            <Opale.Checkbox
              className="tc-doc-opale-playground__check"
              label="Erreur"
              checked={inputError}
              onChange={(event) => setInputError(event.currentTarget.checked)}
            />
            <Opale.Checkbox
              className="tc-doc-opale-playground__check"
              label="Désactivé"
              checked={inputDisabled}
              onChange={(event) => setInputDisabled(event.currentTarget.checked)}
            />
          </>
        )}
        {entry.name === 'DataTable' && (
          <>
            <label>
              État{' '}
              <select
                value={tableMode}
                onChange={(event) =>
                  setTableMode(event.currentTarget.value as PlaygroundConfig['tableMode'])
                }
              >
                <option value="filled">Avec données</option>
                <option value="empty">Vide</option>
                <option value="loading">Chargement</option>
              </select>
            </label>
            <label>
              Densité{' '}
              <select
                value={tableSize}
                onChange={(event) =>
                  setTableSize(event.currentTarget.value as PlaygroundConfig['tableSize'])
                }
              >
                <option value="medium">Confortable</option>
                <option value="small">Compacte</option>
              </select>
            </label>
            <Opale.Checkbox
              className="tc-doc-opale-playground__check"
              label="Lignes alternées"
              checked={tableStriped}
              onChange={(event) => setTableStriped(event.currentTarget.checked)}
            />
          </>
        )}
      </fieldset>
    ) : null;
  const api = CATALOG_API[entry.name];
  const a11y = CATALOG_A11Y[entry.name];

  if (!api) throw new Error(`API manquante pour ${entry.name}`);
  if (!a11y) throw new Error(`Accessibilité manquante pour ${entry.name}`);

  const namedCode = withNamedImports(code);

  return (
    <div className="tc-doc-opale-page">
      <ComponentPageLayout
        id={catalogComponentSlug(entry.name).replace('/', '-')}
        imports={PAGE_IMPORTS[entry.name] ?? [entry.name]}
        alternative={COMPONENT_ALTERNATIVES[catalogComponentSlug(entry.name)]}
        intro={
          <>
            <p className="tc-doc-lede">{entry.description}</p>
            <div className="tc-doc-opale-meta">
              <Opale.Badge>{catalogCategoryLabel(entry.category)}</Opale.Badge>
              <span>Composant Opale · TypeScript strict</span>
            </div>
          </>
        }
        demo={
          <section
            className="tc-doc-specimen tc-doc-specimen--opale"
            aria-label={`Démonstration ${displayName}`}
          >
            <p className="tc-doc-component-demo__note">{api.states}</p>
            {supportsLiquidGlass && (
              <MaterialToggle
                name={displayName}
                checked={liquidGlass}
                onCheckedChange={setLiquidGlass}
              />
            )}
            {playgroundControls}
            {/* Le support s'assombrit avec le matériau : un verre ne se voit
                qu'en réfractant ce qu'il y a derrière lui. */}
            <div
              className="tc-doc-opale-preview"
              data-liquid-glass={liquidGlass ? 'true' : undefined}
            >
              <CatalogPreview name={entry.name} liquidGlass={liquidGlass} playground={playground} />
            </div>
          </section>
        }
        examples={
          /* L'extrait suit le commutateur de matériau et les réglages de la démo. */
          <UsageBlock label={`Exemple ${displayName}`} code={namedCode} />
        }
        props={
          <>
            <PropsTable
              id={catalogComponentSlug(entry.name).replace('/', '-')}
              title={displayName}
              rows={[
                ...api.rows,
                ...(supportsLiquidGlass
                  ? [
                      {
                        name: 'liquidGlass',
                        type: 'boolean',
                        defaultValue: 'false',
                        description: 'Active le matériau en verre.',
                      },
                    ]
                  : []),
              ]}
            />
            {/* Les parties publiées sous leur nom, chacune sous son tableau. */}
            {api.parts?.map((part) => (
              <PropsTable
                key={part.name}
                id={`${catalogComponentSlug(entry.name).replace('/', '-')}-${part.name}`}
                title={part.name}
                rows={part.rows}
              />
            ))}
          </>
        }
        states={a11y.states.map(({ state, text }) => ({
          state,
          description: <InlineCode text={text} />,
        }))}
        accessibility={{
          keyboard: a11y.keyboard.map((text) => <InlineCode key={text} text={text} />),
          semantics: a11y.semantics.map((text) => <InlineCode key={text} text={text} />),
        }}
        limits={a11y.limits.map((text) => (
          <InlineCode key={text} text={text} />
        ))}
      />
    </div>
  );
}
