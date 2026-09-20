import { useState } from 'react';

import { CANOP_CATALOG, type CanopCatalogEntry, Opale } from '../../magic';
import { catalogComponentLabel, catalogComponentSlug } from '../doc-model';
import type { DocPage } from '../doc-model';
import { UsageBlock } from './api';
import { CatalogPreview } from './catalog-preview';

function exampleCode(name: string): string {
  const displayName = catalogComponentLabel(name);

  switch (name) {
    case 'CanopButton':
      return `<Opale.Button variant="primary">Primaire</Opale.Button>
<Opale.Button variant="secondary">Secondaire</Opale.Button>
<Opale.Button variant="accent">Accent</Opale.Button>
<Opale.Button variant="danger">Danger</Opale.Button>`;
    case 'CanopInput':
      return `<Opale.Input
  label="Email"
  placeholder="thomas@crn-studio.com"
  helperText="Une adresse valide est requise."
/>`;
    case 'CanopCheckbox':
      return `<Opale.Checkbox
  label="Recevoir les notifications"
  description="Les nouveautés du design system."
  defaultChecked
/>`;
    case 'CanopToggle':
      return '<Opale.Toggle label="Activées" defaultChecked />';
    case 'CanopSlider':
      return '<Opale.Slider label="Volume" defaultValue={64} min={0} max={100} />';
    case 'CanopSegmentedControl':
      return `<Opale.SegmentedControl
  value="all"
  options={[
    { value: 'all', label: 'Tout' },
    { value: 'active', label: 'Actifs' },
    { value: 'archived', label: 'Archivés' },
  ]}
/>`;
    case 'CanopCard':
      return `<Opale.Card title="Une surface Opale" subtitle="Carte, actions et élévation.">
  <p>Une surface claire, lisible et responsive.</p>
</Opale.Card>`;
    case 'CanopCardGrid':
      return `<Opale.CardGrid>
  <Opale.StatCard label="Composants" value="77" delta="+12 cette version" />
  <Opale.StatCard label="Thèmes" value="2 globaux + 1 matériau" />
</Opale.CardGrid>`;
    case 'CanopBadge':
      return '<Opale.Badge tone="accent">Nouveau</Opale.Badge>';
    case 'CanopStatCard':
      return '<Opale.StatCard label="Disponibilité" value="99,9 %" delta="+0,4 %" />';
    case 'CanopHeading':
      return '<Opale.Heading level={2}>Titre de section</Opale.Heading>';
    case 'CanopText':
      return '<Opale.Text variant="caption">Légende secondaire</Opale.Text>';
    case 'CanopDataTable':
      return `<Opale.DataTable
  columns={[{ key: 'name', label: 'Nom' }, { key: 'status', label: 'Statut' }]}
  rows={[{ name: 'Button', status: 'Stable' }, { name: 'DataTable', status: 'Nouveau' }]}
/>`;
    case 'CanopFeedback':
      return `<Opale.Feedback severity="success" title="En production">
  La dernière version est disponible.
</Opale.Feedback>`;
    case 'CanopToast':
      return '<Opale.Toast message="Modifications enregistrées" />';
    case 'CanopProgressBar':
      return '<Opale.ProgressBar label="Progression" value={72} />';
    case 'CanopLink':
      return '<Opale.Link href="/installation">Lire le guide</Opale.Link>';
    case 'CanopFileCard':
      return '<Opale.FileCard name="design-system.fig" size="2,4 Mo" />';
    case 'CanopClipboard':
      return '<Opale.Clipboard value="npm install @thomascaron/opale-ui" />';
    default:
      return `<Opale.${displayName} />`;
  }
}

function CanopComponentPage({ entry }: { entry: CanopCatalogEntry }) {
  const displayName = catalogComponentLabel(entry.name);
  const [liquidGlass, setLiquidGlass] = useState(false);
  const code = exampleCode(entry.name);

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
