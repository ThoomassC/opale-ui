import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, useState, type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Modal from '../modal/Modal';
import Tooltip, { type TooltipTriggerProps } from './Tooltip';

/* =============================================================================
   L'INFOBULLE, MESURÉE CONTRE LE MOTIF « TOOLTIP » DE L'APG ET WCAG 1.4.13 :
   elle apparaît au survol (après un délai) et au focus, se retire à Échap, à
   la perte du focus et à la sortie du pointeur, et reste affichée tant que le
   pointeur passe du déclencheur à la bulle.
   ========================================================================== */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const renderTooltip = (props: Partial<Parameters<typeof Tooltip>[0]> = {}) =>
  render(
    <Tooltip content="Copier le lien" {...props}>
      <button type="button">Partager</button>
    </Tooltip>,
  );

describe('Tooltip', () => {
  it('ne rend rien tant qu’on ne l’a pas demandée', () => {
    renderTooltip();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Partager' })).not.toHaveAttribute(
      'aria-describedby',
    );
  });

  it('apparaît au survol après le délai, et décrit son déclencheur', async () => {
    renderTooltip();
    const trigger = screen.getByRole('button', { name: 'Partager' });

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    await advance(299);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await advance(1);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Copier le lien');
    expect(trigger).toHaveAccessibleDescription('Copier le lien');
  });

  it('respecte un délai réglé', async () => {
    renderTooltip({ delay: 50 });
    fireEvent.pointerEnter(screen.getByRole('button'), { pointerType: 'mouse' });
    await advance(50);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('n’apparaît pas au toucher', async () => {
    renderTooltip();
    fireEvent.pointerEnter(screen.getByRole('button'), { pointerType: 'touch' });
    await advance(1000);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('apparaît au focus sans délai et disparaît à la perte du focus', () => {
    renderTooltip();
    const trigger = screen.getByRole('button');

    act(() => trigger.focus());
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    act(() => trigger.blur());
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('se retire à Échap sans déplacer le focus', () => {
    renderTooltip();
    const trigger = screen.getByRole('button');
    act(() => trigger.focus());

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('se retire à Échap même ouverte au seul survol', async () => {
    renderTooltip({ delay: 0 });
    fireEvent.pointerEnter(screen.getByRole('button'), { pointerType: 'mouse' });
    await advance(0);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('reste affichée quand le pointeur passe sur la bulle (WCAG 1.4.13)', async () => {
    renderTooltip({ delay: 0 });
    const trigger = screen.getByRole('button');
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    await advance(0);

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    await advance(50);
    fireEvent.pointerEnter(screen.getByRole('tooltip'), { pointerType: 'mouse' });
    await advance(500);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.pointerLeave(screen.getByRole('tooltip'), { pointerType: 'mouse' });
    await advance(100);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('se retire à l’appui sur le déclencheur, et le focus qui suit ne la rouvre pas', async () => {
    renderTooltip({ delay: 0 });
    const trigger = screen.getByRole('button');
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    await advance(0);

    fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
    act(() => trigger.focus());
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('garde la description déjà posée par l’appelant', () => {
    render(
      <>
        <p id="hint">Lien public</p>
        <Tooltip content="Copier le lien">
          <button type="button" aria-describedby="hint">
            Partager
          </button>
        </Tooltip>
      </>,
    );
    const trigger = screen.getByRole('button');
    act(() => trigger.focus());
    expect(trigger.getAttribute('aria-describedby')?.split(' ')).toEqual([
      'hint',
      screen.getByRole('tooltip').id,
    ]);
  });

  it('appelle les gestionnaires et la ref de l’enfant', () => {
    const onFocus = vi.fn();
    const onPointerEnter = vi.fn();
    const ref = vi.fn();
    render(
      <Tooltip content="Aide">
        <button type="button" ref={ref} onFocus={onFocus} onPointerEnter={onPointerEnter}>
          ?
        </button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button');
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    act(() => trigger.focus());
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onPointerEnter).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledWith(trigger);
  });

  it('se laisse contrôler', () => {
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Tooltip content="Aide" open={open} onOpenChange={setOpen}>
            <button type="button">?</button>
          </Tooltip>
          <output>{String(open)}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('false');
  });

  it('prévient onOpenChange en mode non contrôlé', () => {
    const onOpenChange = vi.fn();
    renderTooltip({ onOpenChange });
    act(() => screen.getByRole('button').focus());
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('pose ses classes stables, sa ref et ses attributs sur la bulle', () => {
    const ref = vi.fn();
    render(
      <Tooltip content="Aide" defaultOpen ref={ref} className="extra" data-probe="x">
        <button type="button">?</button>
      </Tooltip>,
    );
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('opale-tooltip__content', 'extra');
    expect(tooltip).toHaveAttribute('data-probe', 'x');
    expect(tooltip.closest('.opale-tooltip')).toHaveAttribute('data-side');
    expect(ref).toHaveBeenCalledWith(tooltip);
  });

  it('se rend en verre liquide sur demande', () => {
    render(
      <Tooltip content="Aide" defaultOpen liquidGlass>
        <button type="button">?</button>
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip').closest('[data-opale-glass]')).not.toBeNull();
  });

  it('refuse un enfant qui n’est pas un élément', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    /* Un appelant JavaScript, que le typage ne retient pas. */
    const text = 'texte' as unknown as ReactElement<TooltipTriggerProps>;
    expect(() => render(<Tooltip content="Aide">{text}</Tooltip>)).toThrow(/un seul élément/);
    error.mockRestore();
  });

  it('dans une modale ouverte, Échap retire la bulle et laisse la modale', () => {
    const onOpenChange = vi.fn();
    render(
      <Modal open title="Réglages" onOpenChange={onOpenChange}>
        <Tooltip content="Aide">
          <button type="button">?</button>
        </Tooltip>
      </Modal>,
    );
    const trigger = screen.getByRole('button', { name: '?' });
    act(() => trigger.focus());
    const tooltip = screen.getByRole('tooltip');
    /* Rendue dans la couche de la modale, pas sous son inertie. */
    expect(tooltip.closest('[inert]')).toBeNull();
    expect(tooltip.closest('.opale-modal')).not.toBeNull();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

/* LE RENDU SERVEUR PUIS L'HYDRATATION, sous `StrictMode`, sans erreur. */
function renderOnServer(element: ReactElement): string {
  vi.stubGlobal('window', undefined);
  vi.stubGlobal('document', undefined);
  try {
    return renderToString(element);
  } finally {
    vi.unstubAllGlobals();
  }
}

describe('Tooltip, rendu serveur', () => {
  it('s’hydrate sans écart ni erreur, ouverte', async () => {
    vi.useRealTimers();
    const fixture = () => (
      <Tooltip content="Aide" defaultOpen>
        <button type="button">?</button>
      </Tooltip>
    );
    const host = document.createElement('div');
    host.innerHTML = renderOnServer(fixture());
    document.body.append(host);

    const errors: string[] = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    });
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(host, <StrictMode>{fixture()}</StrictMode>, {
          onRecoverableError: (error) => errors.push(String(error)),
        });
      });
    } finally {
      consoleError.mockRestore();
    }

    expect(errors).toEqual([]);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Aide');
    act(() => root?.unmount());
    host.remove();
  });
});
