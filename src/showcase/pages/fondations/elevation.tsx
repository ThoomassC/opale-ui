import type { CSSProperties } from 'react';

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

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `elevation.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function ElevationContent() {
  return (
    <PageBody>
      <Specimen
        title="Les quatre crans"
        note={
          <>
            Les plaques sont neutres et écrites à la main : aucun composant publié ne consomme ces
            jetons, la Card d’Opale ayant sa propre échelle.
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

      {/* LA PHRASE A CHANGÉ PARCE QUE LE CODE A CHANGÉ. Elle disait, à juste
        titre, que la prop `elevation` de la Card ne posait qu'une classe
        qu'aucune feuille ne servait. `opale.css` sert désormais les quatre
        crans — sur l'échelle d'ombres d'Opale, `--opale-shadow-*`, et non sur
        ces jetons-ci, que la feuille autonome d'Opale ne charge pas. Le
        paragraphe dit donc les deux : la carte a ses crans, et les jetons de
        cette page restent ceux de qui compose ses propres surfaces. */}
      <p className="tc-doc-prose tc-doc-aside">
        <strong>La Card d’Opale a ses propres crans.</strong> Sa prop <code>elevation</code>, de{' '}
        <code>0</code> à <code>3</code>, pose l’ombre correspondante de l’échelle d’Opale (
        <code>--opale-shadow-*</code>) : à plat, posée, soulevée, détachée. Voir la{' '}
        <a className="tc-doc-link" href={hrefFor('composants/opale-card')}>
          Card
        </a>
        . Les jetons <code>--elevation-*</code> de cette page restent publiés pour qui compose ses
        propres surfaces avec <code>tokens.css</code>.
      </p>
    </PageBody>
  );
}
