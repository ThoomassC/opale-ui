import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MultiSelect } from './opale';
import { expectOnlyDeprecationWarnings } from '../test/deprecation-warnings';

/* Ce fichier croise l'ancienne API : ses avertissements sont attendus. */
expectOnlyDeprecationWarnings();

afterEach(cleanup);

const OPTIONS = [
  { value: 'paris', label: 'Paris' },
  { value: 'lyon', label: 'Lyon' },
  { value: 'lille', label: 'Lille' },
];

describe('MultiSelect', () => {
  /* LE MODE NON CONTRÔLÉ NE MONTRAIT RIEN. Sans `values`, la sélection affichée
     venait d'un ensemble vide recréé à chaque rendu : le clic cochait l'option
     du `<select>` natif caché, mais ni la coche ni `aria-selected` ne
     bougeaient. Personne, voyant ou non, ne savait ce qui était choisi. */
  it('montre et annonce la sélection sans prop values', () => {
    render(<MultiSelect label="Villes" options={OPTIONS} />);

    fireEvent.click(screen.getByRole('option', { name: 'Lyon' }));

    expect(screen.getByRole('option', { name: 'Lyon' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Paris' })).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(screen.getByRole('option', { name: 'Lyon' }));
    expect(screen.getByRole('option', { name: 'Lyon' })).toHaveAttribute('aria-selected', 'false');
  });

  it('part de defaultValue en mode non contrôlé', () => {
    render(<MultiSelect label="Villes" options={OPTIONS} defaultValue={['lille']} />);

    expect(screen.getByRole('option', { name: 'Lille' })).toHaveAttribute('aria-selected', 'true');
  });

  it('laisse l’appelant maître en mode contrôlé, et lui passe l’événement natif', () => {
    const onChange = vi.fn();

    function Controlled() {
      const [values, setValues] = useState<string[]>(['paris']);
      return (
        <MultiSelect
          label="Villes"
          options={OPTIONS}
          values={values}
          onChange={(event) => {
            onChange(Array.from(event.currentTarget.selectedOptions, (option) => option.value));
            setValues(Array.from(event.currentTarget.selectedOptions, (option) => option.value));
          }}
        />
      );
    }
    render(<Controlled />);

    fireEvent.click(screen.getByRole('option', { name: 'Lyon' }));

    expect(onChange).toHaveBeenLastCalledWith(['paris', 'lyon']);
    expect(screen.getByRole('option', { name: 'Lyon' })).toHaveAttribute('aria-selected', 'true');
  });
});
