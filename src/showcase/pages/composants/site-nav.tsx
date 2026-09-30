import { SiteNav } from '../../../opale';
import { Specimen } from '../../section';
import { PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { ComponentPageLayout } from '../component-page';
import { MaterialSwitch } from './material-switch';

const USAGE = `import { SiteNav } from '@thomascaron/opale-ui';

<SiteNav
  items={[
    { id: 'example-1', href: '#', label: 'Exemple 1' },
    { id: 'example-2', href: '#', label: 'Exemple 2' },
  ]}
  value="example-1"
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
    description: 'Les destinations, pensées pour quatre entrées. À passer toujours.',
  },
  {
    name: 'value',
    type: 'string',
    description:
      'Identifiant de l’entrée qui porte l’unique bulle active. Remplace activeItem, déprécié depuis 3.6.',
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

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `site-nav.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function SiteNavContent() {
  return (
    <ComponentPageLayout
      id="site-nav"
      imports={['SiteNav']}
      demo={
        <Specimen
          title="La barre — originale ou en verre liquide"
          note="Cliquez une destination : la bulle unique se déplace et se déforme pendant le trajet. La version originale pose un aplat opaque ; en verre liquide, la barre devient transparente et laisse le matériau réfracter la photographie."
        >
          <MaterialSwitch name="SiteNav" stack>
            {(liquidGlass) => (
              <SiteNav
                liquidGlass={liquidGlass}
                items={DEMO_ITEMS}
                value="example-1"
                /* Pas « Navigation principale » : c'est déjà le nom de la barre
                   du site, et deux repères de même nom ne se distinguent pas. */
                navLabel="Navigation de l’exemple"
                onNavigate={() => undefined}
              />
            )}
          </MaterialSwitch>
        </Specimen>
      }
      examples={<UsageBlock label="Import et appel représentatif de SiteNav" code={USAGE} />}
      props={
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
      }
      accessibility={{
        keyboard: [
          <>
            Des liens <code>&lt;a href&gt;</code> natifs : un arrêt de tabulation par destination,{' '}
            <kbd>Entrée</kbd> suit le lien. Pas de déplacement aux flèches.
          </>,
          <>
            Avec <code>onNavigate</code>, un clic simple est intercepté ; un clic avec modificateur
            ou vers <code>target=&quot;_blank&quot;</code> ne l’est pas.
          </>,
        ],
        semantics: [
          <>
            La racine est un <code>&lt;header&gt;</code> ; la navigation est un{' '}
            <code>&lt;nav&gt;</code> nommé par <code>navLabel</code> (« Navigation principale » par
            défaut), puis une liste <code>&lt;ul&gt;</code>.
          </>,
          <>
            L’entrée active porte <code>aria-current=&quot;page&quot;</code>.
          </>,
          <>
            La bulle est <code>aria-hidden</code> ; son animation est coupée sous{' '}
            <code>prefers-reduced-motion</code>.
          </>,
        ],
      }}
      limits={[
        <>
          Sans <code>value</code>, la première entrée reçoit{' '}
          <code>aria-current=&quot;page&quot;</code>.
        </>,
        <>
          La bulle est un enfant direct du <code>&lt;ul&gt;</code>, hors d’un{' '}
          <code>&lt;li&gt;</code>, même masquée.
        </>,
        <>
          La barre est collante par défaut (<code>position: sticky</code>).
        </>,
        <>
          <code>aria-current</code> change au clic, avant que le routage n’aboutisse.
        </>,
      ]}
    />
  );
}
