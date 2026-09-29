import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { MultiSelect } from './opale';

afterEach(cleanup);

/* ============================================================================
   MULTISELECT DANS UN VRAI FORMULAIRE.

   Le `<select>` caché était CONTRÔLÉ par React à partir d'un état interne
   (audit DX-05). Tout ce qui écrit le DOM sans passer par cet état — la
   réinitialisation native d'un `<form>`, `register()`, `setValue()` et
   `reset()` de react-hook-form, qui posent `option.selected` directement —
   laissait la liste visible figée, et le rendu suivant réimposait l'ancienne
   valeur. L'écran, la soumission et la bibliothèque de formulaire
   divergeaient sans bruit.

   Le natif n'est plus contrôlé par React : il est ÉCRIT quand la sélection
   change, et LU quand quelqu'un d'autre l'a écrit. Ces tests rejouent les
   trois écritures externes que fait react-hook-form, sans l'installer.
   ========================================================================== */

const OPTIONS = [
  { value: 'paris', label: 'Paris' },
  { value: 'lyon', label: 'Lyon' },
  { value: 'lille', label: 'Lille' },
];

function formOf(container: HTMLElement): HTMLFormElement {
  const form = container.querySelector('form');
  if (!form) throw new Error('formulaire absent');
  return form;
}

function nativeOf(container: HTMLElement): HTMLSelectElement {
  const select = container.querySelector('select');
  if (!select) throw new Error('select natif absent');
  return select;
}

const submitted = (form: HTMLFormElement) => new FormData(form).getAll('villes');
const shown = () =>
  screen
    .getAllByRole('option')
    .filter((option) => option.getAttribute('aria-selected') === 'true')
    .map((option) => option.textContent);

/** Laisse passer les microtâches et le minuteur de la réinitialisation. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('MultiSelect dans un formulaire natif', () => {
  it('soumet la sélection affichée', () => {
    const { container } = render(
      <form>
        <MultiSelect name="villes" label="Villes" options={OPTIONS} defaultValue={['paris']} />
      </form>,
    );
    fireEvent.click(screen.getByRole('option', { name: 'Lille' }));

    expect(submitted(formOf(container))).toEqual(['paris', 'lille']);
    expect(shown()).toEqual(['Paris', 'Lille']);
  });

  it('revient à defaultValue, à l’écran comme à la soumission, sur form.reset()', async () => {
    const { container } = render(
      <form>
        <MultiSelect name="villes" label="Villes" options={OPTIONS} defaultValue={['lyon']} />
      </form>,
    );
    fireEvent.click(screen.getByRole('option', { name: 'Paris' }));
    expect(shown()).toEqual(['Paris', 'Lyon']);

    formOf(container).reset();
    await settle();

    expect(submitted(formOf(container))).toEqual(['lyon']);
    expect(shown()).toEqual(['Lyon']);
  });

  it('suit une écriture directe de option.selected, comme setValue de react-hook-form', async () => {
    const { container } = render(
      <form>
        <MultiSelect name="villes" label="Villes" options={OPTIONS} />
      </form>,
    );
    const select = nativeOf(container);

    /* Ce que fait `setValue('villes', ['lyon', 'lille'])` sur un select multiple. */
    await act(async () => {
      for (const option of Array.from(select.options)) {
        option.selected = ['lyon', 'lille'].includes(option.value);
      }
    });
    await settle();

    expect(shown()).toEqual(['Lyon', 'Lille']);
    expect(submitted(formOf(container))).toEqual(['lyon', 'lille']);
  });

  it('ne réimpose pas l’ancienne valeur au rendu suivant', async () => {
    function Host() {
      const [count, setCount] = useState(0);
      return (
        <form>
          <MultiSelect name="villes" label="Villes" options={OPTIONS} />
          <button type="button" onClick={() => setCount(count + 1)}>
            Rendre {count}
          </button>
        </form>
      );
    }
    const { container } = render(<Host />);
    const select = nativeOf(container);

    await act(async () => {
      for (const option of Array.from(select.options)) option.selected = option.value === 'paris';
    });
    await settle();
    fireEvent.click(screen.getByRole('button', { name: /Rendre/ }));

    expect(submitted(formOf(container))).toEqual(['paris']);
    expect(shown()).toEqual(['Paris']);
  });

  it('garde le natif d’accord avec value en mode contrôlé', () => {
    function Controlled() {
      const [value, setValue] = useState<string[]>(['paris']);
      return (
        <form>
          <MultiSelect name="villes" label="Villes" options={OPTIONS} value={value} />
          <button type="button" onClick={() => setValue(['lille'])}>
            Lille seule
          </button>
        </form>
      );
    }
    const { container } = render(<Controlled />);
    expect(submitted(formOf(container))).toEqual(['paris']);

    fireEvent.click(screen.getByRole('button', { name: 'Lille seule' }));

    expect(submitted(formOf(container))).toEqual(['lille']);
    expect(shown()).toEqual(['Lille']);
  });

  it('accepte des <option> en enfants, comme Select', () => {
    const { container } = render(
      <form>
        <MultiSelect name="villes" label="Villes" defaultValue={['nantes']}>
          <option value="nantes">Nantes</option>
          <option value="brest">Brest</option>
        </MultiSelect>
      </form>,
    );

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Nantes',
      'Brest',
    ]);
    fireEvent.click(screen.getByRole('option', { name: 'Brest' }));
    expect(submitted(formOf(container))).toEqual(['nantes', 'brest']);
  });
});
