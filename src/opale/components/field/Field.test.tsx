import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act, StrictMode, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Field } from './Field';
import { useFieldProps } from './use-field-props';

/* =============================================================================
   LE CHAMP GÉNÉRIQUE : UN LIBELLÉ, UNE AIDE ET UNE ERREUR POUR N'IMPORTE QUEL
   CONTRÔLE.

   Ce que ces tests tiennent : le contrôle de l'appelant est NOMMÉ par le
   libellé, DÉCRIT par l'aide puis l'erreur, et déclaré invalide et requis —
   qu'il reçoive ses props par la fonction enfant ou par `useFieldProps()`.
   ========================================================================== */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/* Un contrôle maison qui n'est PAS un élément étiquetable : `<label for>` ne
   le nomme pas, seul `aria-labelledby` le peut. */
function CustomPicker({ 'aria-describedby': own }: { 'aria-describedby'?: string }) {
  const field = useFieldProps({ 'aria-describedby': own });
  return <div role="combobox" aria-expanded="false" aria-controls="none" tabIndex={0} {...field} />;
}

describe('Field', () => {
  it('nomme et décrit un contrôle natif reçu par la fonction enfant', () => {
    render(
      <Field label="Téléphone" description="Format international" error="Numéro invalide">
        {(props) => <input type="tel" {...props} />}
      </Field>,
    );

    const input = screen.getByRole('textbox', { name: 'Téléphone' });
    expect(input).toHaveAccessibleDescription('Format international Numéro invalide');
    expect(input).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent('Numéro invalide');
  });

  it('focalise le contrôle natif au clic sur le libellé', async () => {
    render(<Field label="Code">{(props) => <input {...props} />}</Field>);

    await userEvent.click(screen.getByText('Code'));

    expect(screen.getByRole('textbox', { name: 'Code' })).toHaveFocus();
  });

  it('nomme un contrôle non étiquetable par aria-labelledby, via useFieldProps()', () => {
    render(
      <Field label="Couleur" description="Choisissez une teinte">
        <CustomPicker aria-describedby="external" />
      </Field>,
    );
    const combobox = screen.getByRole('combobox', { name: 'Couleur' });

    expect(combobox.getAttribute('aria-describedby')?.split(' ')[0]).toBe('external');
    expect(combobox).toHaveAccessibleDescription('Choisissez une teinte');
    expect(combobox).not.toHaveAttribute('aria-invalid');
  });

  it('marque le champ requis : aria-required et une marque décorative', () => {
    const { container } = render(
      <Field label="Nom" required>
        {(props) => <input {...props} />}
      </Field>,
    );

    const input = screen.getByRole('textbox', { name: 'Nom' });
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(container.querySelector('.opale-field__required')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('accepte un id imposé, et le passe au contrôle', () => {
    render(
      <Field id="phone" label="Téléphone">
        {(props) => <input {...props} />}
      </Field>,
    );

    expect(screen.getByRole('textbox', { name: 'Téléphone' })).toHaveAttribute('id', 'phone');
  });

  it('pose className sur l’enveloppe', () => {
    const { container } = render(
      <Field label="A" className="host">
        {(props) => <input {...props} />}
      </Field>,
    );

    expect(container.firstElementChild).toHaveClass('opale-field', 'opale-form-field', 'host');
  });

  it('laisse useFieldProps() rendre les props de l’appelant hors d’un Field', () => {
    render(<CustomPicker aria-describedby="solo" />);

    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-describedby', 'solo');
    expect(combobox).not.toHaveAttribute('aria-labelledby');
  });

  it('se rend au serveur puis s’hydrate sans erreur', async () => {
    await expectCleanHydration(() => (
      <Field label="Nom" description="Aide" error="Erreur" required>
        {(props) => <input {...props} />}
      </Field>
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
