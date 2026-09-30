import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, createRef, useState, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Textarea } from './Textarea';

/* =============================================================================
   LA ZONE DE TEXTE : L'API D'`Input` POUR UN `<textarea>`.

   Ce que ces tests tiennent : le nom, la description et l'erreur se posent
   comme sur `Input` ; la valeur se lit par `onValueChange` sans perdre
   `onChange` ; le natif part dans un `<form>` et revient sur `reset()` ; le
   compteur se lit à l'écran et s'annonce poliment ; la hauteur suit le texte
   entre `minRows` et `maxRows`.
   ========================================================================== */

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Textarea', () => {
  it('nomme le natif par son libellé et le décrit par son aide', () => {
    render(<Textarea label="Message" helperText="Quelques lignes suffisent" />);

    const textarea = screen.getByRole('textbox', { name: 'Message' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAccessibleDescription('Quelques lignes suffisent');
    expect(textarea).not.toBeInvalid();
  });

  it('annonce l’erreur, la décrit et rend le natif invalide', () => {
    render(<Textarea label="Message" helperText="Aide" error="Le message est vide" />);

    const textarea = screen.getByRole('textbox', { name: 'Message' });
    expect(textarea).toBeInvalid();
    expect(textarea).toHaveAccessibleDescription('Le message est vide');
    expect(screen.getByRole('alert')).toHaveTextContent('Le message est vide');
  });

  it('fusionne aria-describedby de l’appelant avec le message', () => {
    render(
      <>
        <span id="external">Consigne externe</span>
        <Textarea label="Message" error="Erreur" aria-describedby="external" />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAccessibleDescription(
      'Consigne externe Erreur',
    );
  });

  it('pose className sur l’enveloppe, controlClassName, ref et le reste sur le natif', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const { container } = render(
      <Textarea
        ref={ref}
        label="Message"
        className="host"
        controlClassName="ctl"
        name="message"
        data-testid="native"
      />,
    );

    const textarea = screen.getByTestId('native');
    expect(ref.current).toBe(textarea);
    expect(textarea).toHaveClass('opale-textarea', 'ctl');
    expect(textarea).toHaveAttribute('name', 'message');
    expect(container.firstElementChild).toHaveClass('opale-field', 'host');
  });

  it('règle la taille par le jeton de contrôle de l’enveloppe', () => {
    const { container } = render(<Textarea label="Message" size="small" />);
    const field = container.querySelector<HTMLElement>('.opale-field');

    expect(field).toHaveClass('opale-field--small', 'opale-textarea-field--small');
    expect(field?.style.getPropertyValue('--opale-control-md')).toBe('var(--opale-control-sm)');
  });

  it('pose la coquille de verre sous liquidGlass', () => {
    const { container } = render(<Textarea label="Message" liquidGlass />);

    expect(container.querySelector('[data-opale-glass]')).not.toBeNull();
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
  });

  it('appelle onValueChange avec la valeur, et garde onChange natif', async () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(<Textarea label="Message" onValueChange={onValueChange} onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'Hé');

    expect(onValueChange).toHaveBeenLastCalledWith('Hé');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('se laisse contrôler par value', async () => {
    function Controlled() {
      const [value, setValue] = useState('abc');
      return (
        <Textarea label="Message" value={value} onValueChange={setValue} maxLength={10} showCount />
      );
    }
    render(<Controlled />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'd');

    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('abcd');
    expect(screen.getByText('4 / 10')).toBeInTheDocument();
  });

  it('soumet sa valeur dans un formulaire natif et revient à defaultValue sur reset()', async () => {
    const { container } = render(
      <form>
        <Textarea label="Message" name="message" defaultValue="Bonjour" maxLength={20} showCount />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const textarea = screen.getByRole('textbox', { name: 'Message' });

    await userEvent.type(textarea, ' à tous');
    expect(new FormData(form).get('message')).toBe('Bonjour à tous');
    expect(screen.getByText('14 / 20')).toBeInTheDocument();

    await act(async () => {
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(textarea).toHaveValue('Bonjour');
    expect(new FormData(form).get('message')).toBe('Bonjour');
    expect(screen.getByText('7 / 20')).toBeInTheDocument();
  });

  describe('compteur', () => {
    it('décrit la limite, affiche le compte et ne coupe pas la parole au montage', () => {
      render(<Textarea label="Message" maxLength={200} showCount defaultValue="abc" />);

      const textarea = screen.getByRole('textbox', { name: 'Message' });
      expect(textarea).toHaveAttribute('maxlength', '200');
      expect(textarea).toHaveAccessibleDescription('200 caractères maximum');
      expect(screen.getByText('3 / 200')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('status')).toHaveTextContent('');
    });

    it('annonce poliment les caractères restants, après une pause de frappe', () => {
      vi.useFakeTimers();
      render(<Textarea label="Message" maxLength={10} showCount />);
      const textarea = screen.getByRole('textbox', { name: 'Message' });

      fireEvent.change(textarea, { target: { value: 'abcdefgh' } });
      expect(screen.getByRole('status')).toHaveTextContent('');

      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByRole('status')).toHaveTextContent('Il reste 2 caractères');

      fireEvent.change(textarea, { target: { value: 'abcdefghi' } });
      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByRole('status')).toHaveTextContent('Il reste 1 caractère');
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('reprend ses textes par labels', () => {
      vi.useFakeTimers();
      render(
        <Textarea
          label="Message"
          maxLength={5}
          showCount
          labels={{
            count: (length, max) => `${length} of ${max}`,
            limit: (max) => `Up to ${max}`,
            remaining: (left) => `${left} left`,
          }}
        />,
      );
      const textarea = screen.getByRole('textbox', { name: 'Message' });

      fireEvent.change(textarea, { target: { value: 'ab' } });
      act(() => vi.advanceTimersByTime(1000));

      expect(screen.getByText('2 of 5')).toBeInTheDocument();
      expect(textarea).toHaveAccessibleDescription('Up to 5');
      expect(screen.getByRole('status')).toHaveTextContent('3 left');
    });

    it('compte sans limite quand showCount est seul', () => {
      render(<Textarea label="Message" showCount defaultValue="abcd" />);

      expect(screen.getByText('4 caractères')).toBeInTheDocument();
      expect(screen.queryByRole('status')).toBeNull();
    });
  });

  describe('autoResize', () => {
    it('part de minRows lignes et empêche la poignée de redimensionnement', () => {
      render(<Textarea label="Message" autoResize minRows={2} maxRows={6} />);

      const textarea = screen.getByRole('textbox', { name: 'Message' });
      expect(textarea).toHaveAttribute('rows', '2');
      expect(textarea).toHaveClass('opale-textarea--auto');
      expect(textarea.style.getPropertyValue('--opale-textarea-max-rows')).toBe('6');
    });

    it('prend la hauteur de son contenu à chaque saisie', () => {
      render(<Textarea label="Message" autoResize />);
      const textarea = screen.getByRole('textbox', { name: 'Message' });
      Object.defineProperty(textarea, 'scrollHeight', { configurable: true, get: () => 120 });

      fireEvent.change(textarea, { target: { value: 'a\nb\nc\nd' } });

      expect(textarea.style.height).toBe('120px');
    });

    it('ne touche pas à la hauteur sans autoResize', () => {
      render(<Textarea label="Message" />);
      const textarea = screen.getByRole('textbox', { name: 'Message' });
      Object.defineProperty(textarea, 'scrollHeight', { configurable: true, get: () => 120 });

      fireEvent.change(textarea, { target: { value: 'a\nb' } });

      expect(textarea.style.height).toBe('');
      expect(textarea).toHaveAttribute('rows', '3');
    });
  });

  it('se rend au serveur puis s’hydrate sans erreur, en verre comme sans', async () => {
    await expectCleanHydration(() => (
      <>
        <Textarea label="Message" helperText="Aide" maxLength={100} showCount autoResize />
        <Textarea label="Verre" liquidGlass defaultValue="abc" error="Erreur" />
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
