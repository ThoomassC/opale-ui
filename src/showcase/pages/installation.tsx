import type { DocPage } from '../doc-model';
import { hrefFor } from '../doc-model';
import { UI_VERSION } from '../version';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';

const INSTALL_PRODUCTION = 'npm install opale';
const INSTALL = `npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v${UI_VERSION}"`;

const IMPORTS = `import '@thomascaron/opale-ui/tokens.css';
import '@thomascaron/opale-ui/opale.css';

import { Button, Opale } from '@thomascaron/opale-ui';`;

export const installationPage: DocPage = {
  slug: 'installation',
  label: 'Installation',
  group: 'introduction',
  title: 'Installation',
  lede: (
    <>
      Installez Opale UI, chargez ses feuilles de style, puis utilisez les composants historiques ou
      le catalogue de composants Opale de la V3.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen
        title="Installer la dernière version en production"
        note="La version stable publiée pour la production se récupère automatiquement depuis npm."
      >
        <UsageBlock
          label="Installation de la version stable"
          code={INSTALL_PRODUCTION}
          language="shell"
          defaultOpen
        />
      </Specimen>

      <Specimen
        title="Installer une version précise"
        note="La V3 reste disponible depuis le dépôt GitHub, avec son numéro de version explicite."
      >
        <UsageBlock label="Commande d'installation" code={INSTALL} language="shell" defaultOpen />
      </Specimen>

      <Specimen title="Charger les styles">
        <UsageBlock label="Imports CSS et composants" code={IMPORTS} defaultOpen />
      </Specimen>

      <Specimen title="Choisir une brique">
        <p className="tc-doc-prose">
          Les composants publiés gardent leurs exports habituels. Les nouveaux composants Opale sont
          disponibles via le namespace <code>Opale</code>.
        </p>
        <ul className="tc-doc-checklist">
          <li>
            <a className="tc-doc-link" href={hrefFor('composants/opale-button')}>
              Voir Button
            </a>{' '}
            pour les variantes principales.
          </li>
          <li>
            Activez Liquid Glass uniquement sur le spécimen du composant que vous souhaitez
            comparer.
          </li>
        </ul>
      </Specimen>
    </PageBody>
  ),
};
