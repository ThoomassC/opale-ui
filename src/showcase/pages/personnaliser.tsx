import type { ReactNode } from 'react';

import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';
import { BrandChecker } from './brand-checker';
import { EXAMPLE_BRAND } from './personnaliser-data';
import { TokenTable } from './token-table';

/* =============================================================================
   « PERSONNALISER » : LA SURFACE DE PERSONNALISATION D'OPALE, EN UNE PAGE.

   La table des jetons est générée depuis `src/opale/tokens-manifest.ts`, ses
   valeurs lues dans `opale.css`. La marque d'exemple vient de
   `personnaliser-data.ts`, que le test passe à `checkBrand` : une recette qui
   ne tiendrait pas ses contrastes rougirait.
   ========================================================================== */

const { light, dark } = EXAMPLE_BRAND;

const ROOT_BRAND = `/* Dans la feuille de l'application, chargée après opale.css. */
:root {
  --opale-primary: ${light.primary};
  --opale-primary-on-surface: ${light.primaryOnSurface};
  --opale-focus: ${light.focus};
  /* L'encre des boutons primaires, mesurée par checkBrand. */
  --opale-on-primary: ${light.onPrimary};
}`;

const DERIVE = `<html data-opale-brand="derive">

:root {
  --opale-primary: ${light.primary};
}`;

const DARK_BRAND = `:root[data-theme='dark'] {
  --opale-primary: ${dark.primary};
  --opale-primary-light: ${dark.primaryOnSurface};
  --opale-on-primary: ${dark.onPrimary};
}`;

const SCOPE = `<section
  data-opale-scope
  style="--opale-primary: #ea580c; --opale-on-primary: #14100b"
>
  …
</section>`;

const ROOT_CLASS = `<html data-theme="dark">
  <body class="opale-root">…</body>
</html>`;

const CHECK_IN_CI = `import { checkBrand } from '@thomascaron/opale-ui/contract';
import { expect, it } from 'vitest';

it('la marque tient ses contrastes en clair', () => {
  const report = checkBrand({
    primary: '${light.primary}',
    primaryOnSurface: '${light.primaryOnSurface}',
    focus: '${light.focus}',
    onPrimary: '${light.onPrimary}',
  });
  expect(report.failures).toEqual([]);
});

it('et en sombre', () => {
  const report = checkBrand(
    { primary: '${dark.primary}', primaryOnSurface: '${dark.primaryOnSurface}', onPrimary: '${dark.onPrimary}' },
    { theme: 'dark' },
  );
  expect(report.failures).toEqual([]);
});`;

const POINTS: readonly { readonly key: string; readonly text: ReactNode }[] = [
  {
    key: 'public',
    text: 'Surchargez seulement les jetons publics : ce sont les noms stables de la 3.x.',
  },
  {
    key: 'theme',
    text: (
      <>
        Une marque se pose par thème : sur <code>:root</code> pour le clair, sur{' '}
        <code>:root[data-theme='dark']</code> pour le sombre.
      </>
    ),
  },
  {
    key: 'ink',
    text: (
      <>
        Chaque remplissage a son encre : <code>--opale-on-primary</code>,{' '}
        <code>--opale-on-secondary</code>, <code>--opale-on-danger</code>,{' '}
        <code>--opale-on-accent</code>.
      </>
    ),
  },
  {
    key: 'check',
    text: (
      <>
        Mesurez la marque avec <code>checkBrand</code> avant de la publier, dans un test du projet.
      </>
    ),
  },
];

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées vivent dans
   `personnaliser.page.tsx`. */
export default function PersonnaliserContent() {
  return (
    <PageBody>
      <Specimen title="À retenir">
        <p className="tc-doc-prose">
          Opale se personnalise par ses jetons <code>--opale-*</code>, surchargés dans la feuille de
          l’application. Aucune classe à réécrire : les composants lisent les jetons en vigueur là
          où ils sont posés.
        </p>
        <ul className="tc-doc-checklist">
          {POINTS.map((point) => (
            <li key={point.key}>{point.text}</li>
          ))}
        </ul>
      </Specimen>

      <Specimen title="Poser sa marque">
        <p className="tc-doc-prose">
          Le primaire suffit à changer la couleur des actions. Quand il ne tient pas 4,5:1 sous
          l’encre claire des boutons, donnez-lui la sienne ; quand il ne tient pas sur la surface,
          donnez une version plus foncée à <code>--opale-primary-on-surface</code>, qui écrit les
          liens et les boutons à lavis.
        </p>
        <UsageBlock label="Une marque sur la racine" code={ROOT_BRAND} actions={false} />
      </Specimen>

      <Specimen title="Dériver les états">
        <p className="tc-doc-prose">
          Sans rien de plus, le survol, l’éclairci et l’anneau de focus gardent les valeurs du
          saphir. L’attribut <code>data-opale-brand="derive"</code> les calcule depuis{' '}
          <code>--opale-primary</code> : une seule couleur habille tous les états. Il est
          facultatif, et les valeurs d’Opale restent exactes pour qui ne le pose pas.
        </p>
        <UsageBlock label="Des états dérivés du primaire" code={DERIVE} actions={false} />
      </Specimen>

      <Specimen title="Le thème sombre">
        <p className="tc-doc-prose">
          Le sombre a ses propres valeurs : un primaire plus clair, et une encre de bouton sombre.
          En sombre, Opale écrit le primaire sur les surfaces avec{' '}
          <code>--opale-primary-light</code>.
        </p>
        <UsageBlock label="La marque en thème sombre" code={DARK_BRAND} actions={false} />
      </Specimen>

      <Specimen title="Une marque sur une partie de la page">
        <p className="tc-doc-prose">
          Posée sur un conteneur, une couleur de marque atteint les remplissages, mais pas les
          jetons composés — encre du primaire sur surface, bord des champs, contour des boutons —,
          calculés une fois à la racine. <code>data-opale-scope</code> les recalcule dans le
          sous-arbre.
        </p>
        <UsageBlock label="Une marque limitée à une section" code={SCOPE} actions={false} />
      </Specimen>

      <Specimen title="Peindre la page">
        <p className="tc-doc-prose">
          Opale ne touche ni <code>html</code> ni <code>body</code>. La classe{' '}
          <code>.opale-root</code>, posée sur la racine de l’application, peint le fond, l’encre, la
          police et le schéma de couleurs depuis les jetons du thème en vigueur.
        </p>
        <UsageBlock label="La racine d’une page Opale" code={ROOT_CLASS} actions={false} />
      </Specimen>

      <Specimen title="Valider sa marque en CI">
        <p className="tc-doc-prose">
          <code>checkBrand</code>, publié dans <code>@thomascaron/opale-ui/contract</code>, mesure
          l’encre de chaque rôle sur son remplissage, le rôle écrit sur la surface et sur le fond,
          et l’anneau de focus. Chaque échec nomme la paire et, quand elle existe, l’encre à poser.
        </p>
        <UsageBlock label="Un test de contraste de la marque" code={CHECK_IN_CI} actions={false} />
      </Specimen>

      <BrandChecker />

      <TokenTable />
    </PageBody>
  );
}
