import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from './components/toast';
import toastClasses from './components/toast/style/Toast.module.css';
import { CookieBanner, Pagination, Toast } from './opale';

/* Comportements d'accessibilité : focus, annonces, repères. */

afterEach(cleanup);

describe('Pagination', () => {
  it('rend le focus à la page courante quand « suivante » devient inactive', async () => {
    const user = userEvent.setup();
    render(<Pagination pageCount={3} defaultValue={2} />);
    const next = screen.getByRole('button', { name: 'Page suivante' });

    next.focus();
    await user.keyboard('{Enter}');

    expect(next).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveFocus();
  });

  it('rend le focus à la page courante quand « précédente » devient inactive', async () => {
    const user = userEvent.setup();
    render(<Pagination pageCount={3} defaultValue={2} />);
    const previous = screen.getByRole('button', { name: 'Page précédente' });

    await user.click(previous);

    expect(previous).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveFocus();
  });

  it('laisse le focus sur « suivante » tant qu’elle reste active', async () => {
    const user = userEvent.setup();
    render(<Pagination pageCount={5} defaultValue={2} />);
    const next = screen.getByRole('button', { name: 'Page suivante' });

    await user.click(next);

    expect(next).toHaveFocus();
  });
});

/** Peint à `height` px du bas de la fenêtre les éléments qui portent `className`. */
function paintAtBottom(className: string, height: number) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (!this.classList.contains(className)) return new DOMRect(0, 0, 0, 0);
    return new DOMRect(0, window.innerHeight - height, 300, height - 16);
  });
}

const bottomPadding = () =>
  document.documentElement.style.getPropertyValue('scroll-padding-bottom');

describe('Réserve de défilement sous les surfaces fixes du bas', () => {
  it('réserve la place du bandeau de cookies tant qu’il est affiché', () => {
    const rect = paintAtBottom('opale-cookie-banner-anchor', 120);

    const { rerender } = render(<CookieBanner storageKey={null} open />);
    expect(bottomPadding()).toBe('120px');

    rerender(<CookieBanner storageKey={null} open={false} />);
    expect(bottomPadding()).toBe('');
    rect.mockRestore();
  });

  it('réserve la place d’un toast ouvert en bas, et la rend à sa fermeture', () => {
    const rect = paintAtBottom('opale-toast', 80);

    const { rerender } = render(<Toast message="Enregistré" position="bottom-right" />);
    expect(bottomPadding()).toBe('80px');

    rerender(<Toast message="Enregistré" position="bottom-right" open={false} />);
    expect(bottomPadding()).toBe('');
    rect.mockRestore();
  });

  it('ne réserve rien en bas pour un toast du haut', () => {
    const rect = paintAtBottom('opale-toast', 80);

    render(<Toast message="Enregistré" position="top-right" />);

    expect(bottomPadding()).toBe('');
    rect.mockRestore();
  });

  it('réserve la place de la file quand un toast arrive en bas', () => {
    const rect = paintAtBottom(toastClasses.bottomCenter, 90);
    function Trigger() {
      const { showToast } = useToast();
      return (
        <button type="button" onClick={() => showToast({ title: 'Publié', duration: Infinity })}>
          Publier
        </button>
      );
    }
    render(
      <ToastProvider position="bottom-center">
        <Trigger />
      </ToastProvider>,
    );
    expect(bottomPadding()).toBe('');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Publier' }));
    });

    expect(bottomPadding()).toBe('90px');
    rect.mockRestore();
  });
});
