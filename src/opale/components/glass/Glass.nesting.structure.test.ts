import { describe, expect, it } from 'vitest';

import { declarations } from '../../../test/css-rules';
import source from './style/Glass.module.css?raw';

/* =============================================================================
   UN VERRE NE TRANSMET PAS SA LARGEUR AUX VERRES QU'IL CONTIENT (THM-18).

   `--opale-glass-width` est une propriété personnalisée, donc HÉRITÉE. Une
   carte de verre la pose à `100%` sur son enveloppe ; chaque verre posé
   DEDANS sans réglage propre la recevait par héritage. Mesuré au navigateur,
   dans une `<Card liquidGlass>` de 440 px : la coche d'une case (20 px de
   dessin) devenait une piste de 353 px, l'interrupteur une piste de 342 px,
   et leurs libellés, repoussés au bord, passaient à la ligne hors de la carte.

   LE CONTENU DU VERRE REMET LA LARGEUR À SA VALEUR INITIALE : un verre
   imbriqué retombe sur son propre réglage — celui de sa classe d'enveloppe,
   ou `fit-content`. Seule la largeur est remise : le rayon hérité d'un hôte
   (`Modal`, la barre de la vitrine) est un réglage voulu, pas une fuite.
   ========================================================================== */

describe('Glass — l’imbrication', () => {
  it('devrait lire sa largeur sur la variable, avec `fit-content` pour défaut', () => {
    expect(declarations(source, '.glass').get('width')).toBe(
      'var(--opale-glass-width, fit-content)',
    );
  });

  it('devrait remettre la largeur à l’initiale pour ce qui est posé dans son contenu', () => {
    expect(declarations(source, '.content').get('--opale-glass-width')).toBe('initial');
  });
});
