import { useState } from 'react';

import { type CatalogEntry, OPALE_CATALOG, Opale } from '../../magic';
import { catalogComponentLabel, catalogComponentSlug } from '../doc-model';
import { PropsTable, UsageBlock } from './api';
import { CATALOG_API } from './opale-api-data';
import { CatalogPreview, type PlaygroundConfig } from './catalog-preview';

/* =============================================================================
   L'EXEMPLE DIT SI LE VERRE EST ACTIF, PARCE QU'IL NE LE DISAIT PAS.

   Le commutateur changeait la démonstration sans changer une ligne du code
   affiché. Qui basculait le verre, aimait ce qu'il voyait, puis cliquait
   « Afficher le code » repartait avec un extrait qui ne le reproduit PAS — il
   n'y avait aucune trace de la prop qui fait toute la différence. Une
   documentation dont l'exemple ne reproduit pas ce qu'il montre est pire
   qu'une documentation absente.

   LA PROP N'EST AJOUTÉE QU'AUX COMPOSANTS DONT L'APERÇU LA TRANSMET RÉELLEMENT.
   Dix sur soixante-dix-sept la reçoivent aujourd'hui ; l'écrire sur les autres
   donnerait un code qui compile et ne fait rien, ce qui est le second genre de
   mensonge qu'on veut éviter ici. La liste est vérifiée par un test, qui la
   compare à ce que `catalog-preview.tsx` transmet vraiment.

   LES QUATRE DERNIERS VENUS — `Badge`, `Checkbox`, `Select`, `Slider` — sont
   arrivés avec la suppression des doublons : leur homologue vendoré avait sa
   propre page, et il est devenu la matière de ce commutateur. */
/* LA LISTE DES COMPOSANTS QUI PORTENT VRAIMENT LE MATÉRIAU.

   ELLE COMMANDE DEUX CHOSES, et c'est nouveau : l'extrait de code affiché —
   qui ajoute ` liquidGlass` aux balises — ET la présence du commutateur
   lui-même.

   LE DÉFAUT QU'ON CORRIGE. La page montrait « Liquid Glass pour X » sur les
   quatre-vingt-cinq composants du catalogue. Onze rendent le matériau. Pour
   les autres, basculer l'interrupteur posait la photographie et le voile sous
   un composant qui ne changeait pas : une quarantaine se retrouvaient avec
   leur encre sombre sur un cliché sombre — la barre de progression, le
   tableau, le fil d'Ariane, l'état vide. Le commutateur ne mentait pas
   seulement, il ABÎMAIT la démonstration.

   POURQUOI CACHER PLUTÔT QUE GRISER. Un interrupteur désactivé pose la
   question « pourquoi ne puis-je pas ? » à quatre-vingts reprises. Son
   absence ne pose aucune question : le matériau est une option de certains
   composants, pas une propriété du catalogue. */
/* LES COMPOSANTS QUI PEIGNENT UNE SURFACE, ET DONC QUI PORTENT LE MATÉRIAU.

   Cette liste a triplé avec l'audit d'utilité : le matériau est une propriété
   des SURFACES, et tout ce qui en peint une — une carte, un panneau, une
   piste, un rail, un encart — doit pouvoir la rendre en verre. Ce qui n'en
   peint pas n'y est pas, et la raison est dans `material-default.test.tsx` :
   `Heading` rend un `<h2>`, `Divider` un `<hr>`, `Stack` une boîte sans
   peinture. Leur donner la prop obligerait à inventer une plaque que personne
   n'a demandée, ou à ne rien faire — c'est-à-dire à mentir. */
const FORWARDS_LIQUID_GLASS: readonly string[] = [
  'Autocomplete',
  'Badge',
  'Button',
  'Card',
  'CardGrid',
  'Checkbox',
  'Clipboard',
  'CommandPalette',
  'ConfirmDialog',
  'CookieBanner',
  'DataTable',
  'Dropzone',
  'EmptyState',
  'Feedback',
  'FileCard',
  'IconActionButton',
  'InlineInput',
  'Input',
  'Lightbox',
  'Menu',
  'MultiSelect',
  'Navbar',
  'Pressable',
  'ProgressBar',
  'SegmentedControl',
  'Select',
  'SelectionBar',
  'SidePanel',
  'Slider',
  'StatCard',
  'SvgMap',
  'Toast',
  'Toggle',
];

/** Ajoute la prop à la balise ouvrante ciblée, y compris avec des callbacks `=>` dans les attributs. */
function withLiquidGlass(code: string, name: string): string {
  const target = name === 'CardGrid' ? 'StatCard' : catalogComponentLabel(name);
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

/** Chaque fiche du catalogue possède un exemple qui montre son usage réel. */
const REPRESENTATIVE_EXAMPLES: Readonly<Record<string, string>> = {
  Pressable: '<Opale.Pressable onClick={() => alert("Action")}>Ouvrir</Opale.Pressable>',
  MultiSelect: `<Opale.MultiSelect
  label="Domaines"
  values={['design']}
  options={[{ value: 'design', label: 'Design' }, { value: 'code', label: 'Code' }]}
  onChange={(event) => console.log([...event.currentTarget.selectedOptions].map((item) => item.value))}
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
  { term: 'Version', description: '3.2.0' },
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
      onCancel={() => setOpen(false)}
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
]} activeId="projects" />`,
  Menu: `<Opale.Menu label="Actions" items={[
  { id: 'duplicate', label: 'Dupliquer' },
  { id: 'archive', label: 'Archiver' },
]} />`,
  SidePanel: `import { useState } from 'react';

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  return <>
    <Opale.Button onClick={() => setOpen(true)}>Réglages</Opale.Button>
    <Opale.SidePanel open={open} title="Réglages" onClose={() => setOpen(false)}>
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
    <Opale.CommandPalette open={open} value={query} onChange={setQuery}
      onClose={() => setOpen(false)}>
      <Opale.Button variant="text" onClick={() => setOpen(false)}>
        Fermer
      </Opale.Button>
    </Opale.CommandPalette>
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
  BackgroundSurface: `<Opale.Background>
  <Opale.Card title="Contenu au premier plan">Bienvenue</Opale.Card>
</Opale.Background>`,
  Lightbox: `import { useState } from 'react';

export function ImagePreview() {
  const [open, setOpen] = useState(false);
  return <>
    <Opale.Button onClick={() => setOpen(true)}>Voir l’image</Opale.Button>
    <Opale.Lightbox src="/visuel.png" alt="Aperçu du projet" open={open}
      onClose={() => setOpen(false)} />
  </>;
}`,
  RatingInput: `import { useState } from 'react';

export function ReviewRating() {
  const [rating, setRating] = useState(3);
  return <Opale.RatingInput label="Qualité de l’expérience" value={rating} onChange={setRating} />;
}`,
  Pagination: `import { useState } from 'react';

export function ResultsPagination() {
  const [page, setPage] = useState(2);
  return <Opale.Pagination page={page} pageCount={8} onChange={setPage} />;
}`,
  Skeleton: `<div role="status" aria-label="Chargement de la fiche">
  <Opale.Skeleton width="45%" height="1.5rem" />
  <Opale.Skeleton height="5rem" />
</div>`,
  SvgMap: `<Opale.SvgMap>
  <circle cx="205" cy="75" r="12" fill="currentColor">
    <title>Étape active</title>
  </circle>
</Opale.SvgMap>`,
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
  value="all"
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
  <Opale.StatCard label="Composants" value="${OPALE_CATALOG.length}" delta="Catalogue Opale" />
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
  columns={[
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'uses', label: 'Usages', sortable: true },
    { key: 'status', label: 'Statut' },
  ]}
  rows={[
    { name: 'DataTable', uses: 4, status: 'Nouveau' },
    { name: 'Button', uses: 128, status: 'Stable' },
  ]}
  onSortChange={({ key, direction }) => console.log(key, direction)}
/>`);
    case 'Feedback':
      return decorate(`<Opale.Feedback severity="success" title="En production">
  La dernière version est disponible.
</Opale.Feedback>`);
    case 'Rating':
      /* L'EXTRAIT PAR DÉFAUT — `<Opale.Rating />` — NE MONTRAIT AUCUNE PROP.
         On y lisait un composant sans réglage, alors que la note et le barème
         sont exactement ce qu'on vient y régler : la page ne disait nulle part
         OÙ le développeur pose son nombre d'étoiles. */
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
  onClose={() => setOpen(false)}
/>`);
    case 'ProgressBar':
      return decorate('<Opale.ProgressBar label="Progression" value={72} />');
    case 'Link':
      return decorate('<Opale.Link href="/installation">Lire le guide</Opale.Link>');
    case 'FileCard':
      return decorate(`import { useState } from 'react';

export function FileSelection() {
  const [selected, setSelected] = useState(false);
  return <Opale.FileCard name="design-system.fig" size="2,4 Mo"
    selected={selected} onClick={() => setSelected((value) => !value)} />;
}`);
    case 'Clipboard':
      return decorate('<Opale.Clipboard value="npm install @thomascaron/opale-ui" />');
    case 'CookieBanner':
      return decorate(`// Le choix est mémorisé dans localStorage, sous storageKey
// ('opale-cookie-consent' par défaut ; null coupe la mémoire).
// Sans open, le bandeau ne revient plus une fois le choix fait ;
// open={true} le rouvre, pour un lien « Gérer mes cookies ».

// Au démarrage : onAccept ne part qu'au clic, le choix mémorisé se lit ici
// (import { readCookieConsent } from '@thomascaron/opale-ui').
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

export function ComponentPage({ entry }: { entry: CatalogEntry }) {
  const displayName = catalogComponentLabel(entry.name);
  const supportsLiquidGlass = FORWARDS_LIQUID_GLASS.includes(entry.name);
  const [liquidGlass, setLiquidGlass] = useState(false);
  const [buttonVariant, setButtonVariant] = useState<PlaygroundConfig['buttonVariant']>('primary');
  const [buttonSize, setButtonSize] = useState<PlaygroundConfig['buttonSize']>('medium');
  const [buttonLoading, setButtonLoading] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [tableMode, setTableMode] = useState<PlaygroundConfig['tableMode']>('filled');
  const playground: PlaygroundConfig = {
    buttonVariant,
    buttonSize,
    buttonLoading,
    inputError,
    inputDisabled,
    tableMode,
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
  { key: 'uses', label: 'Usages', sortable: true },
  { key: 'status', label: 'Statut' },
];
const rows = [
  { name: 'DataTable', uses: 4, status: 'Nouveau' },
  { name: 'Button', uses: 128, status: 'Stable' },
  { name: 'Autocomplete', uses: 17, status: 'Stable' },
];
<Opale.DataTable
  caption="Composants"
  columns={columns}
  rowKey={(row) => String(row.name)}
  rows={${tableMode === 'empty' ? '[]' : 'rows'}}${tableMode === 'loading' ? '\n  loading' : ''}${liquidGlass ? '\n  liquidGlass' : ''}
/>`
          : baseCode;
  const api = CATALOG_API[entry.name];

  if (!api) throw new Error(`API manquante pour ${entry.name}`);

  return (
    <div className="tc-doc-opale-page">
      <p className="tc-doc-lede">{entry.description}</p>
      <div className="tc-doc-opale-meta">
        <Opale.Badge>
          {entry.category === 'Inputs'
            ? 'Saisie'
            : entry.category === 'Feedback'
              ? 'Retours'
              : entry.category}
        </Opale.Badge>
        <span>Composant Opale · TypeScript strict</span>
      </div>
      <section
        className="tc-doc-specimen tc-doc-specimen--opale"
        aria-label={`Démonstration ${displayName}`}
      >
        <div className="tc-doc-specimen__header">
          <h2>Aperçu interactif</h2>
        </div>
        {supportsLiquidGlass && (
          <div className="tc-doc-opale-material-toggle">
            <div className="tc-doc-opale-material-toggle__text">
              <strong>Rendu Liquid Glass</strong>
              <span>Appliquer le matériau uniquement à ce composant.</span>
            </div>
            <Opale.Toggle
              label={`Liquid Glass pour ${displayName}`}
              checked={liquidGlass}
              onChange={(event) => setLiquidGlass(event.currentTarget.checked)}
            />
          </div>
        )}
        {/* LE SUPPORT S'ASSOMBRIT AVEC LE MATÉRIAU, et ce n'est pas un effet de
            mise en scène : un verre RÉFRACTE ce qui est derrière lui. Posé sur
            la carte blanche, il n'avait rien à réfracter — on voyait un
            rectangle pâle, et l'encre claire du bouton « Primaire » disparaissait
            purement et simplement dans le fond. Le commutateur pose donc la
            scène en même temps que la matière. */}
        {(entry.name === 'Button' || entry.name === 'Input' || entry.name === 'DataTable') && (
          <fieldset className="tc-doc-opale-playground" aria-label={`Réglages de ${displayName}`}>
            <legend>Essayer les états</legend>
            {entry.name === 'Button' && (
              <>
                <label>
                  Variante{' '}
                  <select
                    value={buttonVariant}
                    onChange={(event) =>
                      setButtonVariant(
                        event.currentTarget.value as PlaygroundConfig['buttonVariant'],
                      )
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
                <label className="tc-doc-opale-playground__check">
                  <input
                    type="checkbox"
                    checked={buttonLoading}
                    onChange={(event) => setButtonLoading(event.currentTarget.checked)}
                  />{' '}
                  Chargement
                </label>
              </>
            )}
            {entry.name === 'Input' && (
              <>
                <label className="tc-doc-opale-playground__check">
                  <input
                    type="checkbox"
                    checked={inputError}
                    onChange={(event) => setInputError(event.currentTarget.checked)}
                  />{' '}
                  Erreur
                </label>
                <label className="tc-doc-opale-playground__check">
                  <input
                    type="checkbox"
                    checked={inputDisabled}
                    onChange={(event) => setInputDisabled(event.currentTarget.checked)}
                  />{' '}
                  Désactivé
                </label>
              </>
            )}
            {entry.name === 'DataTable' && (
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
            )}
          </fieldset>
        )}
        <div className="tc-doc-opale-preview" data-liquid-glass={liquidGlass ? 'true' : undefined}>
          <CatalogPreview name={entry.name} liquidGlass={liquidGlass} playground={playground} />
        </div>
        {/* LA LIGNE D'`import` EST REMONTÉE ICI, ET CE N'EST PAS UN DÉTAIL DE
            DÉPLACEMENT. La page affichait le même extrait DEUX fois : une plaque
            figée en tête, et ce bloc dépliable — la première ne servait plus
            qu'à occuper le haut de page avec ce que la seconde donne déjà, en
            mieux (copiable, et suivant le commutateur de matériau).

            Elle avait toutefois une chose que le bloc dépliable n'avait pas :
            l'`import`. Sans lui, un extrait copié ne compile pas chez qui le
            colle. Il part donc avec le reste plutôt que de disparaître avec la
            plaque. */}
        <UsageBlock
          label={`Exemple ${displayName}`}
          code={`import { Opale } from '@thomascaron/opale-ui';\n\n${code}`}
        />
      </section>
      <PropsTable
        id={catalogComponentSlug(entry.name).replace('/', '-')}
        title="API et états"
        note={api.states}
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
    </div>
  );
}
