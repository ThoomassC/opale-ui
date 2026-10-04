import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  Autocomplete,
  Checkbox,
  Input,
  MultiSelect,
  SegmentedControl,
  Select,
  Slider,
  Toggle,
} from './opale';

/* =============================================================================
   LES CHAMPS DU CATALOGUE EN 3.10 : TAILLE, SLOT DU CONTRÔLE, LISTE ENRICHIE.

   Tout est ADDITIF. Sans `size`, sans `controlClassName`, sans `placeholder`,
   le balisage est celui de la 2.9 : ces tests vérifient d'abord le nouveau,
   puis que l'ancien défaut ne bouge pas.
   ========================================================================== */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const COUNTRIES = [
  { value: 'fr', label: 'France' },
  { value: 'be', label: 'Belgique' },
];

const SEGMENTS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

/* ---- DX-11 : l'échelle `small | medium | large` sur les champs. */

describe('size sur les champs', () => {
  it('devrait régler la hauteur du champ de saisie par le jeton de contrôle', () => {
    const { container } = render(<Input label="Nom" size="small" />);
    const field = container.querySelector<HTMLElement>('.opale-field');

    expect(field).toHaveClass('opale-field--small');
    expect(field?.style.getPropertyValue('--opale-control-md')).toBe('var(--opale-control-sm)');
    expect(screen.getByRole('textbox', { name: 'Nom' })).not.toHaveAttribute('size');
  });

  it('devrait agrandir le champ de saisie avec size="large"', () => {
    const { container } = render(<Input label="Nom" size="large" />);
    const field = container.querySelector<HTMLElement>('.opale-field');

    expect(field).toHaveClass('opale-field--large');
    expect(field?.style.getPropertyValue('--opale-control-md')).toBe('var(--opale-control-lg)');
  });

  it('devrait laisser le champ de saisie intact par défaut', () => {
    const { container } = render(<Input label="Nom" />);
    const field = container.querySelector<HTMLElement>('.opale-field');

    expect(field?.className).toBe('opale-field');
    expect(field).not.toHaveAttribute('style');
  });

  it('devrait transmettre la taille à la barre de recherche', () => {
    const { container } = render(<Input type="search" aria-label="Chercher" size="small" />);

    expect(container.querySelector('.opale-field')).toHaveClass('opale-field--small');
    expect(screen.getByRole('searchbox')).not.toHaveAttribute('size');
  });

  it('devrait régler la liste déroulante sans poser l’attribut natif', () => {
    const { container } = render(<Select label="Pays" options={COUNTRIES} size="large" />);
    const field = container.querySelector<HTMLElement>('.opale-field');

    expect(field).toHaveClass('opale-field--large');
    expect(field?.style.getPropertyValue('--opale-control-md')).toBe('var(--opale-control-lg)');
    expect(screen.getByRole('combobox', { name: 'Pays' })).not.toHaveAttribute('size');
  });

  it('devrait garder un size numérique comme attribut natif de la liste (2.x)', () => {
    const { container } = render(<Select label="Pays" options={COUNTRIES} size={2} />);

    expect(screen.getByRole('listbox', { name: 'Pays' })).toHaveAttribute('size', '2');
    expect(container.querySelector('.opale-field')?.className).toBe('opale-field');
  });

  it('devrait poser la taille sur la rangée de la case et de l’interrupteur', () => {
    const { container } = render(
      <>
        <Checkbox label="Accepter" size="small" />
        <Toggle label="Wi-Fi" size="large" />
      </>,
    );

    expect(container.querySelector('.opale-checkbox-row')).toHaveClass('opale-checkbox-row--small');
    expect(container.querySelector('.opale-toggle-row')).toHaveClass('opale-toggle-row--large');
    expect(screen.getByRole('checkbox', { name: 'Accepter' })).not.toHaveAttribute('size');
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).not.toHaveAttribute('size');
  });

  it('devrait poser la taille sur le groupe segmenté', () => {
    render(<SegmentedControl aria-label="Vue" options={SEGMENTS} defaultValue="a" size="small" />);

    expect(screen.getByRole('group', { name: 'Vue' })).toHaveClass('opale-segmented--small');
  });

  it('devrait garder medium sans classe de taille', () => {
    const { container } = render(
      <>
        <Checkbox label="Accepter" />
        <Toggle label="Wi-Fi" />
        <SegmentedControl aria-label="Vue" options={SEGMENTS} defaultValue="a" />
      </>,
    );

    expect(container.querySelector('.opale-checkbox-row')?.className).toBe('opale-checkbox-row');
    expect(container.querySelector('.opale-toggle-row')?.className).toBe('opale-toggle-row');
    expect(screen.getByRole('group', { name: 'Vue' }).className).toBe('opale-segmented');
  });
});

/* ---- DX-03 : `controlClassName` habille le contrôle, `className` l'enveloppe. */

describe('controlClassName', () => {
  it('devrait habiller l’<input> natif du champ de saisie', () => {
    const { container } = render(<Input label="Nom" className="root" controlClassName="ctl" />);

    expect(screen.getByRole('textbox', { name: 'Nom' })).toHaveClass('opale-input', 'ctl');
    expect(container.querySelector('.opale-field')).toHaveClass('root');
    expect(container.querySelector('.opale-field')).not.toHaveClass('ctl');
  });

  it('devrait habiller le champ de recherche', () => {
    render(<Input type="search" aria-label="Chercher" controlClassName="ctl" />);

    expect(screen.getByRole('searchbox')).toHaveClass('ctl');
  });

  it('devrait passer par Autocomplete jusqu’au champ', () => {
    render(<Autocomplete label="Ville" options={['Lyon']} controlClassName="ctl" />);

    expect(screen.getByRole('combobox', { name: 'Ville' })).toHaveClass('ctl');
  });

  it('devrait habiller le <select>, le curseur, la case et l’interrupteur', () => {
    render(
      <>
        <Select label="Pays" options={COUNTRIES} controlClassName="ctl-select" />
        <Slider label="Volume" controlClassName="ctl-range" />
        <Checkbox label="Accepter" controlClassName="ctl-check" />
        <Toggle label="Wi-Fi" controlClassName="ctl-toggle" />
      </>,
    );

    expect(screen.getByRole('combobox', { name: 'Pays' })).toHaveClass(
      'opale-select',
      'ctl-select',
    );
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveClass('opale-range', 'ctl-range');
    expect(screen.getByRole('checkbox', { name: 'Accepter' })).toHaveClass(
      'opale-checkbox',
      'ctl-check',
    );
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toHaveClass('opale-toggle', 'ctl-toggle');
  });

  it('devrait habiller chaque bouton du groupe segmenté', () => {
    render(<SegmentedControl options={SEGMENTS} defaultValue="a" controlClassName="ctl" />);

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveClass('opale-segmented__item', 'ctl');
    }
  });

  it('ne devrait pas fuir en attribut DOM de MultiSelect', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<MultiSelect label="Tags" options={COUNTRIES} />);

    expect(error).not.toHaveBeenCalled();
  });
});

/* ---- DX-15 : `onValueChange`, `placeholder` et l'option désactivée. */

describe('Select — onValueChange, placeholder, option désactivée', () => {
  it('devrait appeler onValueChange avec la valeur, puis garder onChange', () => {
    const calls: string[] = [];
    const onValueChange = vi.fn((value: string) => calls.push(`value:${value}`));
    const onChange = vi.fn(() => calls.push('change'));
    render(
      <Select label="Pays" options={COUNTRIES} onValueChange={onValueChange} onChange={onChange} />,
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Pays' }), { target: { value: 'be' } });

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('be', expect.anything());
    expect(onChange).toHaveBeenCalledOnce();
    expect(calls).toEqual(['value:be', 'change']);
  });

  it('devrait afficher le placeholder en première option vide, sélectionnée', () => {
    render(<Select label="Pays" options={COUNTRIES} placeholder="Choisir un pays" />);
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Pays' });
    const first = select.options[0];

    expect(first).toHaveValue('');
    expect(first).toHaveTextContent('Choisir un pays');
    expect(select.value).toBe('');
    expect(first?.disabled).toBe(false);
    expect(first?.hidden).toBe(false);
  });

  it('devrait désactiver et cacher le placeholder quand le champ est requis', () => {
    render(<Select label="Pays" options={COUNTRIES} placeholder="Choisir un pays" required />);
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Pays' });
    const first = select.options[0];

    expect(first?.disabled).toBe(true);
    expect(first?.hidden).toBe(true);
    expect(select.value).toBe('');
    expect(select.validity.valueMissing).toBe(true);
  });

  it('devrait laisser defaultValue et value l’emporter sur le placeholder', () => {
    render(
      <>
        <Select label="Libre" options={COUNTRIES} placeholder="—" defaultValue="be" />
        <Select
          label="Tenu"
          options={COUNTRIES}
          placeholder="—"
          value="fr"
          onChange={() => undefined}
        />
      </>,
    );

    expect(screen.getByRole<HTMLSelectElement>('combobox', { name: 'Libre' }).value).toBe('be');
    expect(screen.getByRole<HTMLSelectElement>('combobox', { name: 'Tenu' }).value).toBe('fr');
  });

  it('devrait ignorer le placeholder d’une liste multiple', () => {
    render(<Select label="Pays" options={COUNTRIES} placeholder="—" multiple />);

    expect(screen.getByRole<HTMLSelectElement>('listbox', { name: 'Pays' }).options).toHaveLength(
      2,
    );
  });

  it('devrait désactiver une option par option', () => {
    render(
      <Select
        label="Pays"
        options={[...COUNTRIES, { value: 'ch', label: 'Suisse', disabled: true }]}
      />,
    );

    expect(screen.getByRole<HTMLOptionElement>('option', { name: 'Suisse' }).disabled).toBe(true);
    expect(screen.getByRole<HTMLOptionElement>('option', { name: 'France' }).disabled).toBe(false);
  });
});

describe('option désactivée ailleurs que dans Select', () => {
  it('devrait désactiver le bouton du groupe segmenté', () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        options={[...SEGMENTS, { value: 'c', label: 'C', disabled: true }]}
        defaultValue="a"
        onValueChange={onValueChange}
      />,
    );

    const disabled = screen.getByRole('button', { name: 'C' });
    expect(disabled).toBeDisabled();
    fireEvent.click(disabled);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('devrait refuser la bascule d’une option désactivée de MultiSelect', () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        label="Pays"
        options={[...COUNTRIES, { value: 'ch', label: 'Suisse', disabled: true }]}
        onValueChange={onValueChange}
      />,
    );

    const option = screen.getByRole('option', { name: 'Suisse' });
    expect(option).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(option);
    expect(option).toHaveAttribute('aria-selected', 'false');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

/* ---- DX-13 : l'appui perdu du groupe segmenté est signalé, pas corrigé.

   L'avertissement part UNE FOIS PAR CHARGEMENT : les cas silencieux passent
   donc AVANT celui qui avertit, dans l'ordre de déclaration (Vitest exécute
   un fichier séquentiellement). */

const LOST_CLICK =
  '[Opale] SegmentedControl : sans `value` ni `defaultValue`, l’option cliquée ne reste pas ' +
  'pressée — passez `defaultValue` pour que le groupe s’en souvienne, ou `value` pour le tenir.';

const nextTask = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

describe('SegmentedControl sans value ni defaultValue', () => {
  it('ne devrait rien dire quand le parent prend la main dès le premier appui', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    function Harness() {
      const [value, setValue] = useState<string | undefined>();
      return <SegmentedControl options={SEGMENTS} value={value} onValueChange={setValue} />;
    }
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    await nextTask();

    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'true');
    expect(warn).not.toHaveBeenCalled();
  });

  it('ne devrait rien dire avec defaultValue', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<SegmentedControl options={SEGMENTS} defaultValue="a" />);

    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    await nextTask();

    expect(warn).not.toHaveBeenCalled();
  });

  it('devrait avertir une seule fois quand l’appui est perdu, sans changer le rendu', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onValueChange = vi.fn();
    render(
      <>
        <SegmentedControl aria-label="Un" options={SEGMENTS} onValueChange={onValueChange} />
        <SegmentedControl aria-label="Deux" options={SEGMENTS} />
      </>,
    );
    const [first, second] = screen.getAllByRole('button', { name: 'B' });

    expect(warn).not.toHaveBeenCalled();
    fireEvent.click(first!);
    await nextTask();
    fireEvent.click(second!);
    await nextTask();

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('b');
    expect(first).toHaveAttribute('aria-pressed', 'false');
    expect(warn).toHaveBeenCalledExactlyOnceWith(LOST_CLICK);
  });
});
