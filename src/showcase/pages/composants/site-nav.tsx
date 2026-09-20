import { SiteNav } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MagicStage } from './stage';

const USAGE = `import { SiteNav } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

<SiteNav
  items={[
    { id: 'example-1', href: '#', label: 'Exemple 1' },
    { id: 'example-2', href: '#', label: 'Exemple 2' },
  ]}
  activeItem="example-1"
  navLabel="Navigation principale"
  onNavigate={() => undefined}
/>`;

const DEMO_ITEMS = [
  { id: 'example-1', href: '#', label: 'Exemple 1' },
  { id: 'example-2', href: '#', label: 'Exemple 2' },
] as const;

const PROPS: readonly PropRow[] = [
  {
    name: 'brand',
    type: 'ReactNode',
    description: 'Optionnel : une marque à gauche de la navigation.',
  },
  {
    name: 'items',
    type: 'readonly SiteNavItem[]',
    description: 'Optionnel : Carte, Pays, Villes et À propos par défaut.',
  },
  {
    name: 'activeItem',
    type: 'string',
    description: 'Identifiant de l’entrée qui porte l’unique bulle active.',
  },
  {
    name: 'navLabel',
    type: 'string',
    defaultValue: "'Navigation principale'",
    description: 'Nom accessible du repère de navigation.',
  },
  {
    name: 'onNavigate',
    type: '(item, event) => void',
    description:
      'Intercepte une navigation client. Le clic déplace la bulle et le callback prend le relais pour le routage.',
  },
];

export const siteNavPage: DocPage = {
  slug: 'composants/site-nav',
  label: 'SiteNav',
  group: 'composants',
  title: 'SiteNav',
  lede: (
    <>
      Une démonstration de barre liquid glass centrée. Les onglets sont cliquables sans changer de
      page ; <strong>une seule bulle</strong> glisse entre eux.
    </>
  ),
  render: () => (
    <PageBody>
      <UsageBlock label="Import et appel représentatif de SiteNav" code={USAGE} />

      <Specimen
        title="La barre liquid glass — deux exemples"
        note="Cliquez une destination : la bulle unique se déplace et se déforme pendant le trajet."
      >
        <MagicStage stack>
          <SiteNav
            items={DEMO_ITEMS}
            activeItem="example-1"
            navLabel="Navigation principale"
            onNavigate={() => undefined}
            style={{ background: '#31466b' }}
          />
        </MagicStage>
      </Specimen>

      <PropsTable
        id="site-nav"
        note={
          <>
            <code>SiteNav</code> porte uniquement la structure de navigation. La marque et les
            routes restent configurables ; la recherche est un composant séparé :{' '}
            <code>SearchBar</code>.
          </>
        }
        rows={PROPS}
      />
    </PageBody>
  ),
};
