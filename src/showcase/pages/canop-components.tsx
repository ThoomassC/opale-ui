import { useState } from 'react';

import { CANOP_CATALOG, type CanopCatalogEntry, Opale } from '../../magic';
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
   Six sur soixante-dix-sept la reçoivent aujourd'hui ; l'écrire sur les autres
   donnerait un code qui compile et ne fait rien, ce qui est le second genre de
   mensonge qu'on veut éviter ici. La liste est vérifiée par un test, qui la
   compare à ce que `catalog-preview.tsx` transmet vraiment. */
const FORWARDS_LIQUID_GLASS: readonly string[] = [
  'CanopButton',
  'CanopCard',
  'CanopCardGrid',
  'CanopInput',
  'CanopStatCard',
  'CanopToggle',
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
    case 'CanopButton':
      return decorate(`<Opale.Button variant="primary">Primaire</Opale.Button>
<Opale.Button variant="secondary">Secondaire</Opale.Button>
<Opale.Button variant="accent">Accent</Opale.Button>
<Opale.Button variant="danger">Danger</Opale.Button>`);
    case 'CanopInput':
      return decorate(`<Opale.Input
  label="Email"
  placeholder="thomas@crn-studio.com"
  helperText="Une adresse valide est requise."
/>`);
    case 'CanopCheckbox':
      return decorate(`<Opale.Checkbox
  label="Recevoir les notifications"
  description="Les nouveautés du design system."
  defaultChecked
/>`);
    case 'CanopToggle':
      return decorate('<Opale.Toggle label="Activées" defaultChecked />');
    case 'CanopSlider':
      return decorate('<Opale.Slider label="Volume" defaultValue={64} min={0} max={100} />');
    case 'CanopSegmentedControl':
      return decorate(`<Opale.SegmentedControl
  value="all"
  options={[
    { value: 'all', label: 'Tout' },
    { value: 'active', label: 'Actifs' },
    { value: 'archived', label: 'Archivés' },
  ]}
/>`);
    case 'CanopCard':
      return decorate(`<Opale.Card title="Une surface Opale" subtitle="Carte, actions et élévation.">
  <p>Une surface claire, lisible et responsive.</p>
</Opale.Card>`);
    case 'CanopCardGrid':
      return decorate(`<Opale.CardGrid>
  <Opale.StatCard label="Composants" value="77" delta="+12 cette version" />
  <Opale.StatCard label="Thèmes" value="2 globaux + 1 matériau" />
</Opale.CardGrid>`);
    case 'CanopBadge':
      return decorate('<Opale.Badge tone="accent">Nouveau</Opale.Badge>');
    case 'CanopStatCard':
      return decorate('<Opale.StatCard label="Disponibilité" value="99,9 %" delta="+0,4 %" />');
    case 'CanopHeading':
      return decorate('<Opale.Heading level={2}>Titre de section</Opale.Heading>');
    case 'CanopText':
      return decorate('<Opale.Text variant="caption">Légende secondaire</Opale.Text>');
    case 'CanopDataTable':
      return decorate(`<Opale.DataTable
  columns={[{ key: 'name', label: 'Nom' }, { key: 'status', label: 'Statut' }]}
  rows={[{ name: 'Button', status: 'Stable' }, { name: 'DataTable', status: 'Nouveau' }]}
/>`);
    case 'CanopFeedback':
      return decorate(`<Opale.Feedback severity="success" title="En production">
  La dernière version est disponible.
</Opale.Feedback>`);
    case 'CanopToast':
      return decorate('<Opale.Toast message="Modifications enregistrées" />');
    case 'CanopProgressBar':
      return decorate('<Opale.ProgressBar label="Progression" value={72} />');
    case 'CanopLink':
      return decorate('<Opale.Link href="/installation">Lire le guide</Opale.Link>');
    case 'CanopFileCard':
      return decorate('<Opale.FileCard name="design-system.fig" size="2,4 Mo" />');
    case 'CanopClipboard':
      return decorate('<Opale.Clipboard value="npm install @thomascaron/opale-ui" />');
    default:
      return decorate(`<Opale.${displayName} />`);
  }
}

function CanopComponentPage({ entry }: { entry: CanopCatalogEntry }) {
  const displayName = catalogComponentLabel(entry.name);
  const [liquidGlass, setLiquidGlass] = useState(false);
  const code = exampleCode(entry.name, liquidGlass);

  return (
    <div className="tc-doc-canop-page">
      <p className="tc-doc-lede">{entry.description}</p>
      <div className="tc-doc-canop-meta">
        <Opale.Badge>{entry.category}</Opale.Badge>
        <span>Composant Opale · TypeScript strict</span>
      </div>
      <div className="tc-doc-code tc-doc-code--canop">
        <code>{`import { Opale } from '@thomascaron/opale-ui';\n\n${code}`}</code>
      </div>
      <section
        className="tc-doc-specimen tc-doc-specimen--canop"
        aria-label={`Démonstration ${displayName}`}
      >
        <div className="tc-doc-specimen__header">
          <div>
            <span className="tc-doc-specimen__eyebrow">DÉMO INTERACTIVE</span>
            <h2>{displayName}</h2>
          </div>
          <Opale.Badge tone="accent">V3</Opale.Badge>
        </div>
        <div className="tc-doc-canop-material-toggle">
          <div className="tc-doc-canop-material-toggle__text">
            <strong>Rendu Liquid Glass</strong>
            <span>Appliquer le matériau uniquement à ce composant.</span>
          </div>
          <Opale.Toggle
            label={`Liquid Glass pour ${displayName}`}
            checked={liquidGlass}
            onChange={(event) => setLiquidGlass(event.currentTarget.checked)}
          />
        </div>
        {/* LE SUPPORT S'ASSOMBRIT AVEC LE MATÉRIAU, et ce n'est pas un effet de
            mise en scène : un verre RÉFRACTE ce qui est derrière lui. Posé sur
            la carte blanche, il n'avait rien à réfracter — on voyait un
            rectangle pâle, et l'encre claire du bouton « Primaire » disparaissait
            purement et simplement dans le fond. Le commutateur pose donc la
            scène en même temps que la matière. */}
        <div className="tc-doc-canop-preview" data-liquid-glass={liquidGlass ? 'true' : undefined}>
          <CatalogPreview name={entry.name} liquidGlass={liquidGlass} />
        </div>
        <UsageBlock label={`Exemple ${displayName}`} code={code} />
      </section>
    </div>
  );
}

export const opaleComponentPages: readonly DocPage[] = CANOP_CATALOG.map((entry) => ({
  slug: catalogComponentSlug(entry.name),
  label: catalogComponentLabel(entry.name),
  group: 'composants',
  title: catalogComponentLabel(entry.name),
  render: () => <CanopComponentPage entry={entry} />,
}));
