import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RadioGroup } from './RadioGroup';
import sheet from './style/RadioGroup.module.css?raw';
import { declaration } from '../../../test/css-rules';

/* SOUS VERRE, LE LIBELLÉ D'UNE OPTION PREND L'ENCRE DU VERRE. Il gardait
   l'encre de la page (`--opale-text`, sombre) sur la photographie, alors que
   la légende et les descriptions passaient à l'encre du verre : « Gratuit »,
   « Pro », « Mensuel » ne se lisaient plus. */
describe('RadioGroup sous verre liquide', () => {
  it('marque chaque option de la classe du verre', () => {
    render(
      <RadioGroup
        label="Formule"
        liquidGlass
        options={[
          { value: 'free', label: 'Gratuit' },
          { value: 'pro', label: 'Pro' },
        ]}
      />,
    );
    const row = screen.getByText('Gratuit').closest('label');
    expect(row).toHaveClass('opale-radio-row--glass');
  });

  it('donne à l’option sous verre l’encre du verre', () => {
    expect(declaration(sheet, '.rowGlass', 'color')).toBe('var(--opale-glass-ink)');
  });

  it('garde l’encre de la page sans verre', () => {
    render(<RadioGroup label="Formule" options={[{ value: 'free', label: 'Gratuit' }]} />);
    expect(screen.getByText('Gratuit').closest('label')).not.toHaveClass('opale-radio-row--glass');
  });
});
