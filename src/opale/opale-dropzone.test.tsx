import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { declaration, declarations } from '../test/css-rules';
import opaleSource from './opale.css?raw';
import { Dropzone } from './opale';

afterEach(cleanup);

describe('Dropzone', () => {
  /* LE VERRE PERDAIT CONTRE LA ZONE PLEINE, PAR L'ORDRE DE LA FEUILLE.
     `.opale-dropzone--glass` rendait fond et tirets au matériau, mais
     `.opale-dropzone`, de même spécificité, est déclarée plus bas : elle
     remettait son fond clair opaque et ses tirets primaires, sous une encre
     de verre devenue blanche. Texte blanc sur fond blanc. La règle du verre
     porte désormais les deux classes, et gagne quel que soit l'ordre. */
  describe('sous verre', () => {
    const glass = declarations(opaleSource, '.opale-dropzone.opale-dropzone--glass');

    it('rend son fond au matériau, quel que soit l’ordre des règles', () => {
      expect(glass.get('background')).toBe('transparent');
    });

    it('trace ses tirets à l’encre du verre', () => {
      expect(glass.get('border')).toBe('1px dashed var(--opale-glass-ink)');
    });

    it('écrit à l’encre du verre', () => {
      expect(glass.get('color')).toBe('var(--opale-glass-ink)');
    });
  });

  /* LES DEUX LIGNES SE GROUPENT AU CENTRE. La zone est une grille de 9 rem :
     sans `align-content`, ses rangées s'étirent pour la remplir, et le titre
     et l'action se retrouvaient séparés par un tiers de la hauteur. */
  it('groupe ses lignes au centre au lieu de les répartir sur la hauteur', () => {
    expect(declaration(opaleSource, '.opale-dropzone', 'align-content')).toBe('center');
  });

  it('écrit l’action de sélection en italique, distincte du titre', () => {
    render(<Dropzone>Déposez les maquettes ici</Dropzone>);

    const action = screen.getByText('Sélectionner des fichiers');
    expect(action).toHaveClass('opale-dropzone__action');
    expect(declaration(opaleSource, '.opale-dropzone__action', 'font-style')).toBe('italic');
  });

  describe('le nom et l’erreur', () => {
    /* jsdom ne blockifie pas les rangées de la grille : il colle les deux textes. */
    const NAME = /^Ajoutez vos fichiers\s?Sélectionner des fichiers$/;
    const reject = (input: HTMLInputElement) =>
      fireEvent.change(input, {
        target: { files: [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')] },
      });

    it('garde le titre et l’action pour nom, et décrit l’erreur hors du libellé', () => {
      const { container } = render(<Dropzone maxFiles={1} />);
      const input = container.querySelector<HTMLInputElement>('input[type="file"]');
      if (!input) throw new Error('champ de fichier absent');

      expect(input).toHaveAccessibleName(NAME);
      reject(input);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Sélectionnez au maximum 1 fichier.');
      expect(alert.closest('label')).toBeNull();
      expect(input).toHaveAccessibleName(NAME);
      expect(input).toHaveAccessibleDescription('Sélectionnez au maximum 1 fichier.');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('ne décrit rien tant qu’il n’y a pas d’erreur', () => {
      const { container } = render(<Dropzone />);
      const input = container.querySelector<HTMLInputElement>('input[type="file"]');

      expect(input).not.toHaveAttribute('aria-describedby');
    });
  });
});
