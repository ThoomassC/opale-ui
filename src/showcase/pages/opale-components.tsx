import { useState } from 'react';

import { type CatalogEntry, Opale } from '../../magic';
import { catalogComponentLabel } from '../doc-model';
import { UsageBlock } from './api';
import { CatalogPreview } from './catalog-preview';

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

/**
 * Ajoute ` liquidGlass` à chaque balise ouvrante `<Opale.X …>` d'un extrait.
 *
 * `[^>]*?` NE PEUT PAS FRANCHIR UN `>`, donc la substitution s'arrête à la fin
 * de la balise ouvrante et ne touche ni au contenu ni aux balises fermantes.
 * C'est aussi ce qui la rend sûre sur les exemples multilignes, où le `/>`
 * final se trouve plusieurs lignes plus bas.
 */
function withLiquidGlass(code: string): string {
  return code.replace(
    /(<Opale\.[A-Za-z]+[^>]*?)(\s*\/?>)/g,
    (_match, open: string, close: string) => `${open} liquidGlass${close}`,
  );
}

function exampleCode(name: string, liquidGlass = false): string {
  const displayName = catalogComponentLabel(name);
  const decorate = (code: string) =>
    liquidGlass && FORWARDS_LIQUID_GLASS.includes(name) ? withLiquidGlass(code) : code;

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
  <Opale.StatCard label="Composants" value="77" delta="+12 cette version" />
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
      return decorate('<Opale.FileCard name="design-system.fig" size="2,4 Mo" />');
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
<Opale.Dropzone onFiles={(files) => upload(files)}>
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
      return decorate(`<Opale.${displayName} />`);
  }
}

export function ComponentPage({ entry }: { entry: CatalogEntry }) {
  const displayName = catalogComponentLabel(entry.name);
  const supportsLiquidGlass = FORWARDS_LIQUID_GLASS.includes(entry.name);
  const [liquidGlass, setLiquidGlass] = useState(false);
  const code = exampleCode(entry.name, liquidGlass);

  return (
    <div className="tc-doc-opale-page">
      <p className="tc-doc-lede">{entry.description}</p>
      <div className="tc-doc-opale-meta">
        <Opale.Badge>{entry.category}</Opale.Badge>
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
        <div className="tc-doc-opale-preview" data-liquid-glass={liquidGlass ? 'true' : undefined}>
          <CatalogPreview name={entry.name} liquidGlass={liquidGlass} />
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
    </div>
  );
}
