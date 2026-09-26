import type { DocPage } from '../doc-model';
import { currentDeploymentLabel } from '../deployment-environment';
import { hrefFor } from '../doc-model';
import { UI_VERSION } from '../version';
import { INSTALL_REF, INSTALL_REF_KIND } from '../install-ref';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';

const INSTALL = `npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#${INSTALL_REF}"`;

const IMPORTS = `import '@thomascaron/opale-ui/tokens.css';
import '@thomascaron/opale-ui/opale.css';

import { Button, Opale } from '@thomascaron/opale-ui';`;

const FIRST_COMPONENT = `import '@thomascaron/opale-ui/tokens.css';
import '@thomascaron/opale-ui/opale.css';
import { Opale } from '@thomascaron/opale-ui';

export function App() {
  return <Opale.Button variant="primary">Continuer</Opale.Button>;
}`;

export const installationPage: DocPage = {
  slug: 'installation',
  label: 'Installation',
  group: 'introduction',
  title: 'Installation',
  searchTerms: ['npm', 'import', 'tokens.css', 'opale.css', 'premier composant'],
  lede: (
    <>
      Installez Opale UI, chargez ses feuilles de style, puis utilisez les composants historiques ou
      le catalogue de composants Opale de la V3.
    </>
  ),
  render: () => (
    <PageBody>
      <p className="tc-doc-install-status">
        <span className="tc-doc-release__status">{currentDeploymentLabel()}</span>
      </p>
      <Specimen
        title={`Installer Opale UI ${UI_VERSION}`}
        note={
          INSTALL_REF_KIND === 'branch'
            ? 'Version de recette : installez la branche de revue. Le tag v3.3.0 sera créé lors de la publication.'
            : 'Cette version est installable depuis le tag GitHub correspondant.'
        }
      >
        <UsageBlock label="Commande d'installation" code={INSTALL} language="shell" defaultOpen />
      </Specimen>

      <Specimen title="Charger les styles">
        <UsageBlock label="Imports CSS et composants" code={IMPORTS} defaultOpen />
      </Specimen>

      <Specimen
        title="Afficher un premier composant"
        note="Un exemple minimal prêt à copier dans un composant React."
      >
        <UsageBlock label="Premier composant Opale" code={FIRST_COMPONENT} defaultOpen />
      </Specimen>

      <Specimen title="Choisir une brique">
        <p className="tc-doc-prose">
          Les exports historiques comme <code>Button</code> restent disponibles. Pour le catalogue
          V3 présenté ici, utilisez <code>Opale.Button</code> et les autres composants du namespace{' '}
          <code>Opale</code>.
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
