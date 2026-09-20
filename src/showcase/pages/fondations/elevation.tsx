import type { CSSProperties } from 'react';

import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody } from '../api';

/* =============================================================================
   POURQUOI CETTE PAGE NE REND PLUS DE `Card`.

   Elle montrait les quatre crans sur quatre `<Card elevation={n}>`, ce qui
   était le bon spécimen tant que la librairie publiait une carte : le jeton
   était démontré PAR SON CONSOMMATEUR. La 2.0 ne publie plus `Card`, ni la
   feuille `ui.css` qui posait `.tc-card--elev-*`.

   LES JETONS, EUX, SURVIVENT : `--elevation-0` à `--elevation-3` sont déclarés
   dans `src/tokens/primitives.css` et publiés par `tokens.css`. La page
   documente donc désormais le JETON NU, peint sur une plaque neutre écrite en
   style en ligne.

   LE STYLE EN LIGNE PLUTÔT QU'UNE CLASSE DE `doc.css`, et ce n'est pas de la
   paresse : quatre crans demandent quatre `box-shadow`, donc quatre entrées
   dans la liste blanche de `doc-focus.structure.test.ts` — une liste qui existe
   pour forcer une décision sur les anneaux de focus, et qu'on ne remplit pas de
   plaques décoratives. Une `box-shadow` posée en ligne n'entre dans aucune
   cascade de feuille et ne peut donc écraser aucun anneau. Même précédent que
   les plaques de la page palette et que les scènes des composants.

   AUCUNE COULEUR LITTÉRALE ICI NON PLUS : la plaque est faite de `--surface` et
   `--border-subtle`, l'ombre est le jeton lui-même.
   ========================================================================== */

const ELEVATIONS: readonly { level: 0 | 1 | 2 | 3; token: string; usage: string }[] = [
  {
    level: 0,
    token: '--elevation-0',
    usage: 'au sol — la plaque ne se détache que par son liseré',
  },
  { level: 1, token: '--elevation-1', usage: 'posé — liste de cartes, vignette' },
  { level: 2, token: '--elevation-2', usage: 'soulevé — panneau flottant, menu' },
  { level: 3, token: '--elevation-3', usage: 'détaché — modale, calque' },
];

/** La plaque de spécimen, sans son ombre : le cran est passé à part. */
const PLATE: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-5)',
};

export const elevationPage: DocPage = {
  slug: 'elevation',
  label: 'Élévation',
  group: 'fondations',
  title: 'Élévation',
  lede: (
    <>
      Quatre crans, et une inversion de polarité :{' '}
      <strong>en clair, c’est l’ombre qui sépare</strong> la plaque du sol (ΔE 20,6 ; un liseré
      blanc y plafonne à ΔE 4,0), <strong>en sombre, c’est le liseré</strong> (une ombre composée y
      mesure ΔE 2,2). Les deux sont donc toujours posés ensemble.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen
        title="Les quatre crans"
        note={
          <>
            Les plaques sont neutres et écrites à la main : la 2.0 ne publie plus de composant qui
            consomme ces jetons.
          </>
        }
      >
        <div className="tc-doc-grid tc-doc-grid--elev">
          {ELEVATIONS.map((elevation) => (
            <div key={elevation.token} style={{ ...PLATE, boxShadow: `var(${elevation.token})` }}>
              {/* `<h3>` et non `<h4>` : le titre du spécimen est un `<h2>`
                  depuis que la coquille rend le `<h1>` de la page. */}
              <h3 className="tc-doc-cardtitle">Cran {elevation.level}</h3>
              <p className="tc-doc-cardmeta">
                <code className="tc-doc-scale__token">{elevation.token}</code>
              </p>
              <p className="tc-doc-cardtext">{elevation.usage}</p>
            </div>
          ))}
        </div>
      </Specimen>

      {/* LE LIEN VISAIT LA PAGE DE LA `Card` VENDORÉE, QUI N'EXISTE PLUS : ce
          composant est devenu la matière derrière `Opale.Card liquidGlass`. Le
          renvoi pointe donc la page d'Opale — mais la PHRASE ne pouvait pas
          suivre telle quelle. Elle disait « une carte de verre, sans cran », ce
          qui était vrai de la vendorée et ne l'est plus : `CanopCardProps`
          déclare bel et bien `elevation?: 0 | 1 | 2 | 3`. Vérifié avant
          réécriture : la prop ne pose que la classe `canop-card--e{n}`, et
          aucune feuille du dépôt ne sert cette classe ni ne lit
          `--elevation-*`. Le titre du paragraphe reste donc exact, et c'est le
          détail qui devient plus précis, pas moins. */}
      <p className="tc-doc-prose tc-doc-aside">
        <strong>Plus aucun composant publié ne consomme ces quatre jetons.</strong> La 1.0 les
        exposait par la prop <code>elevation</code> de sa <code>Card</code>. La 2.0 publie bien une{' '}
        <a className="tc-doc-link" href={hrefFor('composants/opale-card')}>
          Card
        </a>{' '}
        qui garde une prop <code>elevation</code> à quatre crans, mais celle-ci ne pose qu’une
        classe — <code>canop-card--e{'{n}'}</code> — qu’aucune feuille ne sert : elle ne lit aucun
        de ces jetons et ne peint donc aucune ombre. Les jetons restent publiés pour qui compose ses
        propres surfaces.
      </p>
    </PageBody>
  ),
};
