import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useState, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Radio, RadioGroup } from './RadioGroup';

/* =============================================================================
   LE GROUPE DE BOUTONS RADIO : UN `<fieldset>`, DES RADIOS NATIFS.

   Ce que ces tests tiennent : le groupe est nommé par sa légende et décrit par
   son aide et son erreur ; chaque option est un vrai radio, nommé par son
   libellé et décrit par sa description ; les flèches et la soumission sont
   celles du navigateur ; `reset()` et un `register` à la react-hook-form
   passent par le natif.
   ========================================================================== */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const PLANS = [
  { value: 'free', label: 'Gratuit', description: 'Pour essayer' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Équipe', disabled: true },
];

describe('RadioGroup', () => {
  it('nomme le groupe par sa légende et décrit groupe et options', () => {
    render(<RadioGroup label="Formule" helperText="Modifiable plus tard" options={PLANS} />);

    const group = screen.getByRole('radiogroup', { name: 'Formule' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group).toHaveAccessibleDescription('Modifiable plus tard');
    const free = screen.getByRole('radio', { name: 'Gratuit' });
    expect(free).toHaveAccessibleDescription('Pour essayer');
    expect(screen.getByRole('radio', { name: 'Équipe' })).toBeDisabled();
  });

  it('accepte des <Radio> en enfants, après options', () => {
    render(
      <RadioGroup label="Formule" options={PLANS.slice(0, 1)}>
        <Radio value="custom" label="Sur mesure" description="Sur devis" />
      </RadioGroup>,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['free', 'custom']);
    expect(screen.getByRole('radio', { name: 'Sur mesure' })).toHaveAccessibleDescription(
      'Sur devis',
    );
  });

  it('annonce l’erreur, la décrit sur le groupe et le rend invalide', () => {
    render(<RadioGroup label="Formule" error="Choisissez une formule" options={PLANS} />);

    const group = screen.getByRole('radiogroup', { name: 'Formule' });
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAccessibleDescription('Choisissez une formule');
    expect(screen.getByRole('alert')).toHaveTextContent('Choisissez une formule');
  });

  it('pose required sur chaque radio et aria-required sur le groupe', () => {
    render(<RadioGroup label="Formule" required options={PLANS} />);

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeRequired();
  });

  it('désactive tout le groupe par le fieldset natif', () => {
    render(<RadioGroup label="Formule" disabled options={PLANS} />);

    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });

  it('part de defaultValue, suit les flèches et appelle onValueChange', async () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(
      <RadioGroup
        label="Formule"
        name="plan"
        defaultValue="free"
        options={PLANS}
        onValueChange={onValueChange}
        onChange={onChange}
      />,
    );
    const free = screen.getByRole('radio', { name: 'Gratuit' });
    expect(free).toBeChecked();

    await userEvent.click(free);
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith('pro');
    expect(onChange).toHaveBeenCalled();
  });

  it('se laisse contrôler par value', async () => {
    function Controlled() {
      const [value, setValue] = useState('pro');
      return (
        <>
          <RadioGroup label="Formule" value={value} onValueChange={setValue} options={PLANS} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Gratuit' }));

    expect(screen.getByRole('radio', { name: 'Gratuit' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('free');
  });

  it('soumet la valeur cochée et revient à defaultValue sur reset()', async () => {
    const { container } = render(
      <form>
        <RadioGroup label="Formule" name="plan" defaultValue="free" options={PLANS} />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;

    await userEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    expect(new FormData(form).get('plan')).toBe('pro');

    act(() => form.reset());

    expect(screen.getByRole('radio', { name: 'Gratuit' })).toBeChecked();
    expect(new FormData(form).get('plan')).toBe('free');
  });

  it('se laisse enregistrer comme par react-hook-form : ref, name, onChange, onBlur', async () => {
    /* `register('plan')` rend ces quatre props ; la ref est appelée pour
       chaque radio natif, comme react-hook-form l'attend d'un champ radio. */
    const elements = new Set<HTMLInputElement>();
    const ref = (node: HTMLInputElement | null) => {
      if (node) elements.add(node);
    };
    const onChange = vi.fn((event: { target: HTMLInputElement }) => event.target.value);
    const onBlur = vi.fn();
    render(
      <RadioGroup
        label="Formule"
        name="plan"
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
        options={PLANS}
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    await userEvent.tab();

    expect([...elements].map((element) => element.value)).toEqual(['free', 'pro', 'team']);
    expect([...elements].every((element) => element.name === 'plan')).toBe(true);
    expect(onChange).toHaveLastReturnedWith('pro');
    expect(onBlur).toHaveBeenCalled();
  });

  it('pose className sur le fieldset, l’orientation et la taille en classes stables', () => {
    render(
      <RadioGroup
        label="Formule"
        className="host"
        orientation="horizontal"
        size="small"
        options={PLANS}
      />,
    );

    const group = screen.getByRole('radiogroup');
    expect(group).toHaveClass(
      'opale-radio-group',
      'opale-radio-group--horizontal',
      'opale-radio-group--small',
      'host',
    );
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('pose la coche de verre sous liquidGlass', () => {
    const { container } = render(<RadioGroup label="Formule" liquidGlass options={PLANS} />);

    expect(container.querySelectorAll('[data-opale-glass]')).toHaveLength(3);
  });

  it('nomme le groupe par aria-label faute de légende', () => {
    render(<RadioGroup aria-label="Formule" options={PLANS} />);

    expect(screen.getByRole('radiogroup', { name: 'Formule' })).toBeInTheDocument();
  });

  it('se rend au serveur puis s’hydrate sans erreur, en verre comme sans', async () => {
    await expectCleanHydration(() => (
      <>
        <RadioGroup label="A" name="a" defaultValue="free" options={PLANS} error="Erreur" />
        <RadioGroup label="B" liquidGlass options={PLANS}>
          <Radio value="x" label="X" />
        </RadioGroup>
      </>
    ));
  });
});

/* ---- Rendu serveur puis hydratation, comme `ssr-hydration.test.tsx`. */

async function expectCleanHydration(fixture: () => ReactElement) {
  vi.stubGlobal('window', undefined);
  vi.stubGlobal('document', undefined);
  let html: string;
  try {
    html = renderToString(fixture());
  } finally {
    vi.unstubAllGlobals();
  }
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  const errors: string[] = [];
  const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(' '));
  });
  const root = await act(async () =>
    hydrateRoot(host, <StrictMode>{fixture()}</StrictMode>, {
      onRecoverableError: (error) => errors.push(String(error)),
    }),
  );
  consoleError.mockRestore();
  expect(errors).toEqual([]);
  act(() => root.unmount());
  host.remove();
}
