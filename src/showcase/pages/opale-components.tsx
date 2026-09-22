import { useState } from 'react';

import { OPALE_CATALOG, type CatalogEntry, Opale } from '../../magic';
import { catalogComponentLabel, catalogComponentSlug } from '../doc-model';
import type { DocPage } from '../doc-model';
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
const FORWARDS_LIQUID_GLASS: readonly string[] = [
  'Autocomplete',
  'Badge',
  'Button',
  'Card',
  'CardGrid',
  'Checkbox',
  'InlineInput',
  'Input',
  'Pressable',
  'Select',
  'Slider',
  'StatCard',
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
      return decorate(`<Opale.Card title="Une surface Opale" subtitle="Carte, actions et élévation.">
  <p>Une surface claire, lisible et responsive.</p>
</Opale.Card>`);
    case 'CardGrid':
      return decorate(`<Opale.CardGrid>
  <Opale.StatCard label="Composants" value="77" delta="+12 cette version" />
  <Opale.StatCard label="Thèmes" value="2 globaux + 1 matériau" />
</Opale.CardGrid>`);
    case 'Badge':
      return decorate('<Opale.Badge tone="accent">Nouveau</Opale.Badge>');
    case 'StatCard':
      return decorate('<Opale.StatCard label="Disponibilité" value="99,9 %" delta="+0,4 %" />');
    case 'Heading':
      return decorate('<Opale.Heading level={2}>Titre de section</Opale.Heading>');
    case 'Text':
      return decorate('<Opale.Text variant="caption">Légende secondaire</Opale.Text>');
    case 'DataTable':
      return decorate(`<Opale.DataTable
  columns={[{ key: 'name', label: 'Nom' }, { key: 'status', label: 'Statut' }]}
  rows={[{ name: 'Button', status: 'Stable' }, { name: 'DataTable', status: 'Nouveau' }]}
/>`);
    case 'Feedback':
      return decorate(`<Opale.Feedback severity="success" title="En production">
  La dernière version est disponible.
</Opale.Feedback>`);
    case 'Toast':
      return decorate('<Opale.Toast message="Modifications enregistrées" />');
    case 'ProgressBar':
      return decorate('<Opale.ProgressBar label="Progression" value={72} />');
    case 'Link':
      return decorate('<Opale.Link href="/installation">Lire le guide</Opale.Link>');
    case 'FileCard':
      return decorate('<Opale.FileCard name="design-system.fig" size="2,4 Mo" />');
    case 'Clipboard':
      return decorate('<Opale.Clipboard value="npm install @thomascaron/opale-ui" />');
    default:
      return decorate(`<Opale.${displayName} />`);
  }
}

function ComponentPage({ entry }: { entry: CatalogEntry }) {
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
          <div>
            <span className="tc-doc-specimen__eyebrow">DÉMO INTERACTIVE</span>
            <h2>{displayName}</h2>
          </div>
          <Opale.Badge tone="accent">V3</Opale.Badge>
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

export const opaleComponentPages: readonly DocPage[] = OPALE_CATALOG.map((entry) => ({
  slug: catalogComponentSlug(entry.name),
  label: catalogComponentLabel(entry.name),
  group: 'composants',
  title: catalogComponentLabel(entry.name),
  render: () => <ComponentPage entry={entry} />,
}));
