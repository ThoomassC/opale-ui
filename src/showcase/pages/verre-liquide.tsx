import Glass from '../../magic/components/glass/Glass';

/* CETTE PAGE DOCUMENTE LE MATÉRIAU, donc elle appelle `Glass` directement —
   c'est la seule qui en ait besoin, pour montrer ses crochets propres
   (`rootClassName`, `rootStyle`) que la façade d'Opale ne transmet pas.

   ELLE L'IMPORTE PAR CHEMIN, ET PLUS PAR LE BARRIL. `Glass` n'est plus un
   composant publié : c'est le matériau, atteint partout ailleurs par la prop
   `liquidGlass`. La page du matériau reste la seule à ouvrir le capot, et elle
   le fait par la porte de service — celle qu'`opale.tsx` emprunte déjà.

   LE BOUTON DE DÉMONSTRATION EST CELUI D'OPALE. Il venait d'une librairie
   tierce, dont ce dépôt n'embarque plus une ligne : un bouton de verre EST
   désormais `<Glass as="button">` avec les classes d'Opale, ce que la page
   montre au lieu de le raconter. */
import type { CSSProperties } from 'react';
import type { DocPage } from '../doc-model';
import { UI_VERSION } from '../version';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';
import { MagicCell, MagicStage } from './composants/stage';

const LANDSCAPE_GROUND =
  "linear-gradient(0deg, rgba(7, 28, 43, 0.65), rgba(7, 28, 43, 0.65)), url('/glass-landscape.jpg') center / cover no-repeat";

const TRANSPARENT_MODAL_STYLE = {
  '--opale-glass-tint': 'rgba(255, 255, 255, 0.06)',
  '--opale-glass-edge': 'rgba(255, 255, 255, 0.32)',
} as CSSProperties;

const SQUIRE_CIRCLE_STYLE = {
  ...TRANSPARENT_MODAL_STYLE,
  width: 'var(--target-min)',
  height: 'var(--target-min)',
  borderRadius: '0.75rem',
} as CSSProperties;

function LiquidGlassFilter() {
  return (
    <svg className="tc-doc-liquid-filter" aria-hidden="true">
      <filter id="tc-doc-liquid-modal-dist" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.025 0.018"
          numOctaves="2"
          seed="18"
          result="liquidNoise"
        />
        <feGaussianBlur in="liquidNoise" stdDeviation="0.7" result="softNoise" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softNoise"
          scale="12"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

const USAGE = `npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v${UI_VERSION}"

import { Opale } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

<Opale.Card liquidGlass title="Liquid Glass" />
<Opale.Button liquidGlass>Continuer</Opale.Button>`;

export const verreLiquidePage: DocPage = {
  slug: 'verre-liquide',
  label: 'Le verre liquide',
  group: 'introduction',
  title: 'Le verre liquide',
  render: () => (
    <PageBody>
      <Specimen title="Verre liquide">
        <MagicStage background={LANDSCAPE_GROUND}>
          <LiquidGlassFilter />

          <MagicCell label="Modale + déformation">
            <Glass
              enableLiquidAnimation={false}
              rootClassName="tc-doc-liquid-modal"
              rootStyle={TRANSPARENT_MODAL_STYLE}
            >
              <div
                style={{
                  display: 'grid',
                  gap: '10px',
                  minInlineSize: 'min(260px, 100%)',
                  padding: '22px 26px',
                }}
              >
                <strong style={{ fontSize: '18px' }}>Liquid Glass</strong>
                <span>Une surface nette, légèrement déformée.</span>
              </div>
            </Glass>
          </MagicCell>

          <MagicCell label="Bouton + déformation">
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                minBlockSize: '108px',
              }}
            >
              <Glass
                as="button"
                type="button"
                className="tc-doc-liquid-action-button"
                /* LA RACINE A SA PROPRE CLASSE, en plus de celle de la scène :
                   c'est elle qui porte la silhouette du bouton d'Opale — le
                   rayon du verre et le découpage en squircle — que la modale
                   voisine, elle, ne doit pas prendre. */
                rootClassName="tc-doc-liquid-modal tc-doc-liquid-action-button__root"
                rootStyle={TRANSPARENT_MODAL_STYLE}
                enableLiquidAnimation
              >
                Continuer
              </Glass>
            </div>
          </MagicCell>

          <MagicCell label="squire-circle">
            <div className="tc-doc-squire-circle__stage">
              <Glass
                as="button"
                type="button"
                aria-label="squire-circle"
                className="tc-doc-squire-circle__button"
                rootClassName="tc-doc-liquid-modal tc-doc-squire-circle__root"
                rootStyle={SQUIRE_CIRCLE_STYLE}
                enableLiquidAnimation
              >
                <svg
                  className="tc-doc-squire-circle__app-icon"
                  aria-hidden="true"
                  viewBox="0 0 32 32"
                >
                  <defs>
                    <linearGradient
                      id="tc-doc-squire-drop-surface"
                      x1="20%"
                      y1="0%"
                      x2="82%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.88" />
                      <stop offset="32%" stopColor="#ffffff" stopOpacity="0.5" />
                      <stop offset="68%" stopColor="#ffffff" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.14" />
                    </linearGradient>
                    <linearGradient id="tc-doc-squire-drop-edge" x1="12%" y1="8%" x2="88%" y2="94%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                      <stop offset="48%" stopColor="#ffffff" stopOpacity="0.58" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.82" />
                    </linearGradient>
                    <radialGradient id="tc-doc-squire-drop-glow" cx="28%" cy="18%" r="74%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.64" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                    <clipPath id="tc-doc-squire-drop-clip">
                      <path d="M16 3.25c5.75 5.25 9.1 9.5 9.1 15.1a9.1 9.1 0 0 1-18.2 0c0-5.6 3.35-9.85 9.1-15.1Z" />
                    </clipPath>
                    <filter
                      id="tc-doc-squire-drop-soft"
                      x="-30%"
                      y="-30%"
                      width="160%"
                      height="160%"
                    >
                      <feGaussianBlur stdDeviation="0.45" />
                    </filter>
                  </defs>
                  <path
                    d="M16 3.25c5.75 5.25 9.1 9.5 9.1 15.1a9.1 9.1 0 0 1-18.2 0c0-5.6 3.35-9.85 9.1-15.1Z"
                    fill="url(#tc-doc-squire-drop-surface)"
                    stroke="url(#tc-doc-squire-drop-edge)"
                    strokeWidth="1.35"
                  />
                  <g clipPath="url(#tc-doc-squire-drop-clip)">
                    <ellipse
                      cx="11.8"
                      cy="10.8"
                      rx="5.8"
                      ry="8.1"
                      fill="url(#tc-doc-squire-drop-glow)"
                      filter="url(#tc-doc-squire-drop-soft)"
                    />
                    <path
                      d="M12.5 8.25c-2.45 3.05-3.65 5.85-3.65 8.45a7.45 7.45 0 0 0 3.65 6.45"
                      fill="none"
                      stroke="#ffffff"
                      strokeLinecap="round"
                      strokeOpacity="0.78"
                      strokeWidth="1.35"
                    />
                    <path
                      d="M10.3 24.15c2.95 1.55 6.65 1.15 8.95-0.85"
                      fill="none"
                      stroke="#ffffff"
                      strokeLinecap="round"
                      strokeOpacity="0.34"
                      strokeWidth="1.15"
                    />
                  </g>
                </svg>
              </Glass>
            </div>
          </MagicCell>
        </MagicStage>
      </Specimen>

      <UsageBlock label="Installation et activation du matériau" code={USAGE} />
    </PageBody>
  ),
};
