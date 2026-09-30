import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import type { MouseEvent } from 'react';

import { navigateOnClick, shouldHandleNavigation } from './navigate';

afterEach(cleanup);

/* Un lien réel, rendu par React : `currentTarget` et `defaultPrevented` sont
   ceux que les composants voient. */
function Probe({
  onClick,
  target,
  download,
}: {
  readonly onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  readonly target?: string;
  readonly download?: boolean;
}) {
  return (
    <a href="/destination" target={target} download={download} onClick={onClick}>
      Destination
    </a>
  );
}

const link = () => screen.getByRole('link', { name: 'Destination' });

/* Écouté sur le document, donc APRÈS les gestionnaires de React (délégués à la
   racine) : on lit ce qu'ils ont décidé, puis on annule pour que jsdom ne tente
   pas de naviguer. */
function observeDefault() {
  const seen: { prevented?: boolean } = {};
  const listener = (event: Event) => {
    seen.prevented = event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener('click', listener);
  onTestFinished(() => document.removeEventListener('click', listener));
  return seen;
}

function decisionFor(
  init: Parameters<typeof fireEvent.click>[1],
  props: { target?: string; download?: boolean } = {},
) {
  let decision: boolean | undefined;
  render(
    <Probe
      {...props}
      onClick={(event) => {
        decision = shouldHandleNavigation(event);
        event.preventDefault();
      }}
    />,
  );
  fireEvent.click(link(), init);
  return decision;
}

describe('shouldHandleNavigation', () => {
  it('devrait prendre en charge un clic gauche simple', () => {
    expect(decisionFor({ button: 0 })).toBe(true);
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Cmd', { metaKey: true }],
    ['Maj', { shiftKey: true }],
    ['Alt', { altKey: true }],
  ])('devrait laisser au navigateur un clic avec %s', (_name, modifiers) => {
    expect(decisionFor({ button: 0, ...modifiers })).toBe(false);
  });

  it('devrait laisser au navigateur un clic du milieu', () => {
    expect(decisionFor({ button: 1 })).toBe(false);
  });

  it.each(['_blank', '_top', 'cadre'])('devrait laisser au navigateur un lien target="%s"', (t) => {
    expect(decisionFor({ button: 0 }, { target: t })).toBe(false);
  });

  it('devrait prendre en charge un lien target="_self"', () => {
    expect(decisionFor({ button: 0 }, { target: '_self' })).toBe(true);
  });

  it('devrait laisser au navigateur un lien de téléchargement', () => {
    expect(decisionFor({ button: 0 }, { download: true })).toBe(false);
  });

  it('devrait laisser un clic déjà annulé par un autre gestionnaire', () => {
    let decision: boolean | undefined;
    render(
      <div onClickCapture={(event) => event.preventDefault()} role="presentation">
        <Probe onClick={(event) => (decision = shouldHandleNavigation(event))} />
      </div>,
    );
    fireEvent.click(link());
    expect(decision).toBe(false);
  });
});

describe('navigateOnClick', () => {
  it('devrait annuler la navigation native puis appeler le crochet sur un clic simple', () => {
    const item = { id: 'a', href: '/destination' };
    const onNavigate = vi.fn((_item: typeof item, event: MouseEvent<HTMLAnchorElement>) => {
      expect(event.defaultPrevented).toBe(true);
    });
    let handled: boolean | undefined;
    render(<Probe onClick={(event) => (handled = navigateOnClick(item, event, onNavigate))} />);

    const notCancelled = fireEvent.click(link());

    expect(notCancelled).toBe(false);
    expect(handled).toBe(true);
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith(item, expect.any(Object));
  });

  it('ne devrait rien annuler sans crochet', () => {
    let handled: boolean | undefined;
    const seen = observeDefault();
    render(<Probe onClick={(event) => (handled = navigateOnClick('a', event, undefined))} />);

    fireEvent.click(link());

    expect(handled).toBe(false);
    expect(seen.prevented).toBe(false);
  });

  it('ne devrait ni annuler ni appeler le crochet sur un clic modifié', () => {
    const onNavigate = vi.fn();
    const seen = observeDefault();
    render(<Probe onClick={(event) => navigateOnClick('a', event, onNavigate)} />);

    fireEvent.click(link(), { ctrlKey: true });

    expect(seen.prevented).toBe(false);
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
