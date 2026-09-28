import { SiteNav } from '../../../magic';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MaterialSwitch } from './material-switch';

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

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `site-nav.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function SiteNavContent() {
  return (
    <PageBody>
      <UsageBlock label="Import et appel représentatif de SiteNav" code={USAGE} />

      <Specimen
        title="La barre — originale ou en verre liquide"
        note="Cliquez une destination : la bulle unique se déplace et se déforme pendant le trajet. La version originale pose un aplat opaque ; en verre liquide, la barre devient transparente et laisse le matériau réfracter la photographie."
      >
        <MaterialSwitch name="SiteNav" stack>
          {(liquidGlass) => (
            <SiteNav
              liquidGlass={liquidGlass}
              items={DEMO_ITEMS}
              activeItem="example-1"
              /* PAS « Navigation principale » ICI : c'est déjà le nom de la
                 barre du site, et deux repères de même nom sur une page ne se
                 distinguent pas dans la liste d'un lecteur d'écran. */
              navLabel="Navigation de l’exemple"
              onNavigate={() => undefined}
            />
          )}
        </MaterialSwitch>
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
  );
}
