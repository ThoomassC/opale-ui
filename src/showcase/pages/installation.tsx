import type { DocPage } from '../doc-model';
import { currentDeploymentLabel } from '../deployment-environment';
import { hrefFor } from '../doc-model';
import { UI_VERSION } from '../version';
import { INSTALL_REF, INSTALL_REF_KIND } from '../install-ref';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';

/* Démarrer avec Opale en cinq étapes ordonnées : prérequis, installation,
   styles et polices, thème, premier composant (plus la frontière client de
   Next.js). */

const INSTALL = `npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#${INSTALL_REF}"`;

const STYLES = `// Une seule fois, à la racine de l'application.
import '@thomascaron/opale-ui/opale.css'; // les jetons --opale-*, les composants et leurs polices`;

const THEME = `// Clair par défaut. Le thème sombre se pose sur <html> :
document.documentElement.dataset.theme = 'dark';

// ou directement dans le HTML servi :
// <html lang="fr" data-theme="dark">`;

const NEXT = `// app/layout.tsx — un Server Component
import '@thomascaron/opale-ui/opale.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="light">
      <body>{children}</body>
    </html>
  );
}

// app/page.tsx — Opale porte déjà "use client" :
// ses composants s'importent tels quels, même depuis un Server Component.
import { Button } from '@thomascaron/opale-ui';

export default function Page() {
  return <Button variant="primary">Continuer</Button>;
}`;

const FIRST_COMPONENT = `import { Button } from '@thomascaron/opale-ui';

export function App() {
  return <Button variant="primary">Continuer</Button>;
}`;

export const installationPage: DocPage = {
  slug: 'installation',
  label: 'Installation',
  group: 'introduction',
  title: 'Installation',
  searchTerms: [
    'npm',
    'import',
    'fonts.css',
    'opale.css',
    'thème',
    'Next.js',
    'App Router',
    'use client',
    'premier composant',
  ],
  lede: (
    <>
      De l’installation au premier composant, tout ce qu’une application de production doit mettre
      en place : prérequis, styles et polices, thème, et Next.js.
    </>
  ),
  render: () => (
    <PageBody>
      <p className="tc-doc-install-status">
        <span className="tc-doc-release__status">{currentDeploymentLabel()}</span>
      </p>

      <Specimen title="Une seule convention d’import">
        <ul className="tc-doc-checklist">
          <li>
            Les composants, leurs types et leurs crochets s’importent <strong>par leur nom</strong>{' '}
            depuis <code>@thomascaron/opale-ui</code> :{' '}
            <code>
              import {'{'} Button, Modal {'}'} from '@thomascaron/opale-ui';
            </code>
          </li>
          <li>
            La feuille <code>@thomascaron/opale-ui/opale.css</code> s’importe{' '}
            <strong>une seule fois</strong>, à la racine de l’application (étape 3). Les exemples
            des autres pages la supposent chargée et ne la répètent pas.
          </li>
          <li>
            Les exemples de la documentation suivent tous cette convention : un nom importé, une
            balise du même nom.
          </li>
        </ul>
      </Specimen>

      <Specimen title="1. Prérequis">
        <ul className="tc-doc-checklist">
          <li>
            <strong>React 19</strong> et <strong>react-dom 19</strong>, déclarés en dépendances
            paires : Opale ne les embarque pas.
          </li>
          <li>
            <strong>Node 20.19</strong> (ou 22.12 et plus) sur la machine qui installe : le paquet
            se compile à l’installation.
          </li>
          <li>
            Un bundler qui résout les imports CSS et les polices : Vite, Next.js, webpack ou
            équivalent.
          </li>
        </ul>
      </Specimen>

      <Specimen
        title={`2. Installer Opale UI ${UI_VERSION}`}
        note={
          INSTALL_REF_KIND === 'branch'
            ? 'Version de recette : cette commande installe la branche recette, qui avance. Pour une application de production, installez un tag de version.'
            : 'Cette commande installe un tag de version : le code ne bouge plus sous vos pieds.'
        }
      >
        <UsageBlock label="Commande d'installation" code={INSTALL} language="shell" defaultOpen />
        <p className="tc-doc-prose">
          Opale n’est pas publié sur npm : il s’installe depuis GitHub et se compile à
          l’installation par son script <code>prepare</code>. Deux cas l’empêchent de tourner, et le
          paquet arrive alors sans son dossier <code>dist</code> :{' '}
          <code>npm ci --ignore-scripts</code>, et pnpm 10, qui bloque par défaut les scripts des
          dépendances — autorisez-le dans <code>onlyBuiltDependencies</code>.
        </p>
      </Specimen>

      <Specimen
        title="3. Charger les styles et les polices"
        note="opale.css relie ses polices (Chivo et Bricolage Grotesque) par un @import vers fonts.css : votre bundler les émet en fichiers woff2, que le navigateur charge à part et met en cache. Importez fonts.css vous-même seulement si vous voulez placer ce chargement ailleurs."
      >
        <UsageBlock label="Imports CSS" code={STYLES} defaultOpen />
      </Specimen>

      <Specimen
        title="4. Choisir le thème"
        note="Les jetons --opale-* basculent tous ensemble. Pour une seule section de page dans l’autre thème, PageScaffold accepte sa propre prop theme."
      >
        <UsageBlock label="Thème clair ou sombre" code={THEME} defaultOpen />
      </Specimen>

      <Specimen
        title="Avec Next.js (App Router)"
        note="La feuille s’importe dans le layout racine, un Server Component. Les composants portent déjà la directive « use client » : inutile de les envelopper."
      >
        <UsageBlock label="Next.js App Router" code={NEXT} defaultOpen />
      </Specimen>

      <Specimen
        title="5. Afficher un premier composant"
        note="Le composant s’importe par son nom, la feuille est déjà chargée à la racine."
      >
        <UsageBlock label="Premier composant Opale" code={FIRST_COMPONENT} defaultOpen />
        <ul className="tc-doc-checklist">
          <li>
            <a className="tc-doc-link" href={hrefFor('composants/opale-button')}>
              Voir Button
            </a>{' '}
            pour les variantes principales.
          </li>
          <li>
            <code>liquidGlass</code> s’active composant par composant ; prévoyez un fond riche
            derrière, le verre n’a rien à réfracter sur un aplat.
          </li>
        </ul>
      </Specimen>
    </PageBody>
  ),
};
