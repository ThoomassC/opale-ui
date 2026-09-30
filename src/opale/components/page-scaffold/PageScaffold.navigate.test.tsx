import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MouseEvent } from 'react';

import { PageScaffold, type PageScaffoldLink } from './PageScaffold';

/* =============================================================================
   LE PIED DE PAGE PASSE AUSSI PAR LE ROUTEUR (DX-02).

   `onNavigate` recevait les clics de l'en-tête seulement : les liens du pied
   rechargeaient la page dans une application monopage. Il reçoit désormais
   les deux, et seulement les clics gauches simples — un clic modifié, du
   milieu ou vers un autre onglet reste au navigateur.

   LE CONTRAT DE PageScaffold NE CHANGE PAS : c'est l'appelant qui annule la
   navigation native (`event.preventDefault()`), comme avant. Un `onNavigate`
   qui ne fait qu'observer le clic laisse le lien naviguer.
   ========================================================================== */

afterEach(cleanup);

let nativeNavigation: boolean[] = [];
const recordDefault = (event: Event) => {
  nativeNavigation.push(!event.defaultPrevented);
  event.preventDefault();
};
beforeEach(() => {
  nativeNavigation = [];
  document.addEventListener('click', recordDefault);
});
afterEach(() => document.removeEventListener('click', recordDefault));

const FOOTER: readonly PageScaffoldLink[] = [
  { id: 'contact', href: '/contact', label: 'Contact' },
  { id: 'status', href: 'https://status.example', label: 'Statut', target: '_blank' },
];

const footerLink = (name: string) =>
  within(screen.getByRole('contentinfo')).getByRole('link', { name });

describe('PageScaffold — onNavigate sur le pied de page', () => {
  it('devrait remettre un clic simple sur un lien du pied au routeur', () => {
    const onNavigate = vi.fn((_link: PageScaffoldLink, event: MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    );
    render(<PageScaffold footerLinks={FOOTER} onNavigate={onNavigate} />);

    fireEvent.click(footerLink('Contact'));

    expect(onNavigate).toHaveBeenCalledExactlyOnceWith(FOOTER[0], expect.any(Object));
    expect(nativeNavigation).toEqual([false]);
  });

  it('devrait laisser la navigation native à un onNavigate qui ne fait qu’observer', () => {
    const onNavigate = vi.fn();
    render(<PageScaffold footerLinks={FOOTER} onNavigate={onNavigate} />);

    fireEvent.click(footerLink('Contact'));

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(nativeNavigation).toEqual([true]);
  });

  it.each([
    ['un clic avec Cmd', 'Contact', { metaKey: true }],
    ['un clic du milieu', 'Contact', { button: 1 }],
    ['un lien target="_blank"', 'Statut', {}],
  ])('devrait laisser au navigateur %s', (_name, label, init) => {
    const onNavigate = vi.fn((_link: PageScaffoldLink, event: MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    );
    render(<PageScaffold footerLinks={FOOTER} onNavigate={onNavigate} />);

    fireEvent.click(footerLink(label), init);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(nativeNavigation).toEqual([true]);
  });
});

describe('PageScaffold — onNavigate sur l’en-tête', () => {
  it('devrait laisser un clic avec Ctrl au navigateur', () => {
    const onNavigate = vi.fn((_link: PageScaffoldLink, event: MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    );
    render(<PageScaffold onNavigate={onNavigate} />);
    const header = within(screen.getByRole('banner'));

    fireEvent.click(header.getAllByRole('link', { name: 'Explorer' })[0], { ctrlKey: true });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(nativeNavigation).toEqual([true]);
  });
});
