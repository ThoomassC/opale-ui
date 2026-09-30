import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LegalLinksLabels, NavItem } from '.';
import { LegalLinks } from './opale';

/* =============================================================================
   LES LIENS LÉGAUX BRANCHÉS SUR LE ROUTEUR, ET LEUR REPÈRE NOMMÉ (DX-02, DX-09).

   Même contrat que Navbar et Breadcrumb : un clic gauche simple est remis à
   `onNavigate` après annulation de la navigation native ; un clic modifié ou
   du milieu reste au navigateur. Le nom du repère passe par `labels`, et
   `aria-label` l'emporte.
   ========================================================================== */

afterEach(cleanup);

/* Écouté sur le document, donc après React : on lit la décision du
   composant, puis on annule pour que jsdom ne tente pas de naviguer. */
let nativeNavigation: boolean[] = [];
const recordDefault = (event: Event) => {
  nativeNavigation.push(!event.defaultPrevented);
  event.preventDefault();
};
beforeEach(() => {
  nativeNavigation = [];
  document.addEventListener('click', recordDefault);
  document.addEventListener('auxclick', recordDefault);
});
afterEach(() => {
  document.removeEventListener('click', recordDefault);
  document.removeEventListener('auxclick', recordDefault);
});

const LINKS: readonly NavItem[] = [
  { id: 'legal', label: 'Mentions légales', href: '/mentions' },
  { id: 'privacy', label: 'Confidentialité', href: '/confidentialite' },
];

describe('LegalLinks — onNavigate', () => {
  it('remet un clic gauche simple au routeur', () => {
    const onNavigate = vi.fn();
    render(<LegalLinks links={LINKS} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('link', { name: 'Confidentialité' }));

    expect(onNavigate).toHaveBeenCalledExactlyOnceWith(LINKS[1], expect.any(Object));
    expect(nativeNavigation).toEqual([false]);
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])(
    'laisse un clic modifié %o au navigateur',
    (modifier) => {
      const onNavigate = vi.fn();
      render(<LegalLinks links={LINKS} onNavigate={onNavigate} />);

      fireEvent.click(screen.getByRole('link', { name: 'Mentions légales' }), modifier);

      expect(onNavigate).not.toHaveBeenCalled();
      expect(nativeNavigation).toEqual([true]);
    },
  );

  it('laisse le clic du milieu au navigateur', () => {
    const onNavigate = vi.fn();
    render(<LegalLinks links={LINKS} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('link', { name: 'Mentions légales' }), { button: 1 });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(nativeNavigation).toEqual([true]);
  });

  it('garde la navigation native sans `onNavigate`', () => {
    render(<LegalLinks links={LINKS} />);

    fireEvent.click(screen.getByRole('link', { name: 'Mentions légales' }));

    expect(nativeNavigation).toEqual([true]);
    expect(screen.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute(
      'href',
      '/mentions',
    );
  });
});

describe('LegalLinks — le nom du repère', () => {
  it('garde « Liens légaux » par défaut et suit `labels.navigation`', () => {
    const { rerender } = render(<LegalLinks links={LINKS} />);
    expect(screen.getByRole('navigation', { name: 'Liens légaux' })).toBeInTheDocument();

    const labels: Partial<LegalLinksLabels> = { navigation: 'Legal links' };
    rerender(<LegalLinks links={LINKS} labels={labels} />);
    expect(screen.getByRole('navigation', { name: 'Legal links' })).toBeInTheDocument();
  });

  it('fait gagner `aria-label` sur `labels.navigation`', () => {
    render(<LegalLinks links={LINKS} labels={{ navigation: 'Legal links' }} aria-label="Légal" />);

    expect(screen.getByRole('navigation', { name: 'Légal' })).toBeInTheDocument();
  });
});
