import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ruleBodies, stripComments } from '../contract/stylesheet';
import opaleSource from './opale.css?raw';
import { Dropzone } from './opale';

afterEach(cleanup);

const css = stripComments(opaleSource);
const rule = (selector: string) => ruleBodies(css, selector).join('\n');

describe('Dropzone', () => {
  /* LE VERRE PERDAIT CONTRE LA ZONE PLEINE, PAR L'ORDRE DE LA FEUILLE.
     `.opale-dropzone--glass` rendait fond et tirets au matériau, mais
     `.opale-dropzone`, de même spécificité, est déclarée plus bas : elle
     remettait son fond clair opaque et ses tirets primaires, sous une encre
     de verre devenue blanche. Texte blanc sur fond blanc. La règle du verre
     porte désormais les deux classes, et gagne quel que soit l'ordre. */
  describe('sous verre', () => {
    const glass = () => rule('.opale-dropzone.opale-dropzone--glass');

    it('rend son fond au matériau, quel que soit l’ordre des règles', () => {
      expect(glass()).toMatch(/background:\s*transparent/);
    });

    it('trace ses tirets à l’encre du verre', () => {
      expect(glass()).toMatch(/border:\s*1px dashed var\(--opale-glass-ink\)/);
    });

    it('écrit à l’encre du verre', () => {
      expect(glass()).toMatch(/(^|[;{\s])color:\s*var\(--opale-glass-ink\)/);
    });
  });

  /* LES DEUX LIGNES SE GROUPENT AU CENTRE. La zone est une grille de 9 rem :
     sans `align-content`, ses rangées s'étirent pour la remplir, et le titre
     et l'action se retrouvaient séparés par un tiers de la hauteur. */
  it('groupe ses lignes au centre au lieu de les répartir sur la hauteur', () => {
    expect(rule('.opale-dropzone')).toMatch(/align-content:\s*center/);
  });

  it('écrit l’action de sélection en italique, distincte du titre', () => {
    render(<Dropzone>Déposez les maquettes ici</Dropzone>);

    const action = screen.getByText('Sélectionner des fichiers');
    expect(action).toHaveClass('opale-dropzone__action');
    expect(rule('.opale-dropzone__action')).toMatch(/font-style:\s*italic/);
  });
});
