import type { CSSProperties } from 'react';

import { Specimen } from '../../section';
import { PageBody } from '../api';

/* =============================================================================
   LA TYPOGRAPHIE DE LA 3.0 — CELLE DE LA PLANCHE DE DA.

   Trois voix, deux échelles. Les voix sont les familles `--opale-font-*` ;
   l'échelle de la planche est celle de l'accueil et des titres de la
   documentation ; l'échelle `--opale-text-*` est celle que les composants
   emploient. Chaque échantillon est rendu dans son vrai style, pas décrit.
   ========================================================================== */

interface Voice {
  readonly token: string;
  readonly name: string;
  readonly use: string;
  readonly style: CSSProperties;
  readonly sample: string;
}

const VOICES: readonly Voice[] = [
  {
    token: '--opale-font-title',
    name: 'Bricolage Grotesque · 500 · −3,5 %',
    use: 'Les titres : l’affiche de l’accueil, les titres de page et de section.',
    style: {
      fontFamily: 'var(--opale-font-title)',
      fontWeight: 500,
      letterSpacing: '-0.035em',
      fontSize: '2rem',
      lineHeight: 1.05,
    },
    sample: 'Des interfaces qui bougent',
  },
  {
    token: '--opale-font-body',
    name: 'Chivo · 400 à 700',
    use: 'Pour lire : le texte courant, les contrôles, le sommaire.',
    style: { fontFamily: 'var(--opale-font-body)', fontSize: '1.0625rem', lineHeight: 1.6 },
    sample: 'Chaque composant reste lisible sans JavaScript et en mouvement réduit.',
  },
  {
    token: '--opale-font-mono',
    name: 'Hack',
    use: 'Le code, les jetons, les légendes et les sur-titres en capitales.',
    style: { fontFamily: 'var(--opale-font-mono)', fontSize: '0.8125rem', lineHeight: 1.5 },
    sample: 'npm i @thomascaron/opale-ui — 0123456789',
  },
];

interface Step {
  readonly name: string;
  readonly value: string;
  readonly use: string;
  readonly style: CSSProperties;
  readonly sample: string;
}

/* L'échelle de la planche : les mêmes `clamp()` que l'accueil (`doc-v3.css`)
   et que la documentation (`doc-da.css`). */
const BOARD_STEPS: readonly Step[] = [
  {
    name: 'Affiche',
    value: '48 → 132 px',
    use: 'Le titre de l’accueil, un seul par page.',
    style: {
      fontFamily: 'var(--opale-font-title)',
      fontWeight: 500,
      letterSpacing: '-0.035em',
      fontSize: 'clamp(3rem, 1.2rem + 7.6vw, 8.25rem)',
      lineHeight: 0.98,
    },
    sample: 'Affiche',
  },
  {
    name: 'Titre de section',
    value: '36 → 72 px',
    use: 'Les bandes de l’accueil.',
    style: {
      fontFamily: 'var(--opale-font-title)',
      fontWeight: 500,
      letterSpacing: '-0.035em',
      fontSize: 'clamp(2.25rem, 1.4rem + 3.6vw, 4.5rem)',
      lineHeight: 1,
    },
    sample: 'Les composants',
  },
  {
    name: 'Titre de page',
    value: '40 → 64 px',
    use: 'Le titre de chaque page de la documentation.',
    style: {
      fontFamily: 'var(--opale-font-title)',
      fontWeight: 500,
      letterSpacing: '-0.035em',
      fontSize: 'clamp(2.5rem, 1.6rem + 2.8vw, 4rem)',
      lineHeight: 1,
    },
    sample: 'Typographie',
  },
  {
    name: 'Sous-titre',
    value: '22 → 30 px',
    use: 'Les sections d’une page, les spécimens.',
    style: {
      fontFamily: 'var(--opale-font-title)',
      fontWeight: 500,
      letterSpacing: '-0.02em',
      fontSize: 'clamp(1.375rem, 1.1rem + 1vw, 1.875rem)',
      lineHeight: 1.1,
    },
    sample: 'Import et démo',
  },
  {
    name: 'Chapô',
    value: '18 → 22 px',
    use: 'La phrase qui ouvre une page ou une bande.',
    style: {
      fontFamily: 'var(--opale-font-body)',
      fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.375rem)',
      lineHeight: 1.45,
    },
    sample: 'Bouton d’action avec variantes, tailles et état de chargement.',
  },
  {
    name: 'Texte',
    value: '17 px · 1,6',
    use: 'Le texte courant de la documentation.',
    style: { fontFamily: 'var(--opale-font-body)', fontSize: '1.0625rem', lineHeight: 1.6 },
    sample: 'Le rail défile dans sa zone : donnez-lui une hauteur.',
  },
  {
    name: 'Légende et code',
    value: '13 px · mono',
    use: 'Les sur-titres en capitales, le code, les mesures.',
    style: {
      fontFamily: 'var(--opale-font-mono)',
      fontSize: '0.8125rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    sample: 'Prise en main',
  },
];

/* L'échelle des composants : les six pas de `opale.css`, que les composants
   lisent. Elle ne change pas avec la DA du site. */
const COMPONENT_STEPS: readonly { token: string; size: string; use: string }[] = [
  { token: '--opale-text-xs', size: '12 px', use: 'badges, compteurs, sur-titres du rail' },
  {
    token: '--opale-text-sm',
    size: '14 px',
    use: 'contrôles compacts, aide de champ, entrées du rail',
  },
  {
    token: '--opale-text-md',
    size: '16 px',
    use: 'contrôles et texte des composants — le pas de référence',
  },
  { token: '--opale-text-lg', size: '20 px', use: 'titres de carte et de dialogue' },
  { token: '--opale-text-xl', size: '24 px', use: 'titres de section d’un composant' },
  { token: '--opale-text-2xl', size: '32 px', use: 'chiffres de métrique, titres d’en-tête' },
];

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `typographie.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function TypographieContent() {
  return (
    <PageBody>
      <Specimen
        title="Trois voix"
        note="Bricolage Grotesque, Chivo et Hack sont servis localement."
      >
        <ul className="tc-doc-scale">
          {VOICES.map((voice) => (
            <li className="tc-doc-scale__row" key={voice.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{voice.token}</code>
                <span className="tc-doc-scale__value">{voice.name}</span>
                <span className="tc-doc-scale__usage">{voice.use}</span>
              </div>
              <p className="tc-doc-scale__sample" style={voice.style}>
                {voice.sample}
              </p>
            </li>
          ))}
        </ul>
      </Specimen>

      <Specimen
        title="L’échelle de la planche"
        note="Celle de l’accueil et de la documentation : des tailles fluides, qui suivent la largeur de l’écran."
      >
        <ul className="tc-doc-scale">
          {BOARD_STEPS.map((step) => (
            <li className="tc-doc-scale__row" key={step.name}>
              <div className="tc-doc-scale__meta">
                <span className="tc-doc-scale__token">{step.name}</span>
                <span className="tc-doc-scale__value">{step.value}</span>
                <span className="tc-doc-scale__usage">{step.use}</span>
              </div>
              <p className="tc-doc-scale__sample" style={step.style}>
                {step.sample}
              </p>
            </li>
          ))}
        </ul>
      </Specimen>

      <Specimen
        title="L’échelle des composants"
        note="Six pas et trois interlignes (1,1 · 1,4 · 1,6), lus par tous les composants d’Opale."
      >
        <ul className="tc-doc-scale">
          {COMPONENT_STEPS.map((step) => (
            <li className="tc-doc-scale__row" key={step.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{step.token}</code>
                <span className="tc-doc-scale__value">{step.size}</span>
                <span className="tc-doc-scale__usage">{step.use}</span>
              </div>
              <p className="tc-doc-scale__sample" style={{ fontSize: `var(${step.token})` }}>
                Opale UI
              </p>
            </li>
          ))}
        </ul>
      </Specimen>
    </PageBody>
  );
}
