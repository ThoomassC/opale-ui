import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { Toast } from '../../catalog/feedback';
import { ToastProvider, type ToastDefinition } from './ToastProvider';
import { useToast } from './toast-context';
import { resetToastContentWarnings } from './toast-content';

/* =============================================================================
   `message` ET `title` : UN MÊME TEXTE, DEUX NOMS (DOCS-04).

   `Toast` prenait `message`, `showToast` prenait `{ title, description }` :
   passer de l'un à l'autre demandait de renommer. Chacun accepte désormais
   les deux ; le nom HISTORIQUE de chaque API l'emporte quand les deux sont
   donnés, et un avertissement de développement le signale. Rien n'est
   déprécié.
   ========================================================================== */

let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
  resetToastContentWarnings();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  warn.mockRestore();
});

/* Le texte entre dans la région une fois celle-ci installée (ACC-15). */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
}

describe('Toast — `title` et `description`', () => {
  it('devrait afficher `title` comme `message`', async () => {
    render(<Toast title="Enregistré" />);
    await settle();
    expect(screen.getByRole('status')).toHaveTextContent('Enregistré');
    expect(warn).not.toHaveBeenCalled();
  });

  it('devrait garder le rendu de `message` seul inchangé', async () => {
    const { baseElement } = render(<Toast message="Publié" />);
    await settle();
    const text = baseElement.querySelector('.opale-toast__message');
    expect(text?.childNodes).toHaveLength(1);
    expect(text).toHaveTextContent('Publié');
    expect(baseElement.querySelector('.opale-toast__description')).toBeNull();
  });

  it('devrait afficher `description` sous le texte principal', async () => {
    const { baseElement } = render(<Toast title="Refusé" description="Le fichier dépasse 5 Mo." />);
    await settle();
    expect(baseElement.querySelector('.opale-toast__title')).toHaveTextContent('Refusé');
    expect(baseElement.querySelector('.opale-toast__description')).toHaveTextContent(
      'Le fichier dépasse 5 Mo.',
    );
  });

  /* LE `title` NATIF RESTE CE QU'IL ÉTAIT AUPRÈS DE `message` : l'attribut
     HTML de la carte. C'est ce qui garde la 2.9.4 sans rupture. */
  it('devrait laisser `message` l’emporter et garder `title` en attribut natif', async () => {
    const { baseElement } = render(<Toast message="Publié" title="Infobulle" />);
    await settle();
    expect(baseElement.querySelector('.opale-toast__message')).toHaveTextContent('Publié');
    expect(baseElement.querySelector('.opale-toast')).toHaveAttribute('title', 'Infobulle');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('[Opale] Toast');
  });

  it('ne devrait avertir qu’une fois', () => {
    render(
      <>
        <Toast message="a" title="b" />
        <Toast message="c" title="d" />
      </>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

function Trigger({ toast }: { readonly toast: ToastDefinition }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(toast)}>
      Afficher
    </button>
  );
}

describe('showToast — `message`', () => {
  it('devrait afficher `message` comme `title`', () => {
    render(
      <ToastProvider>
        <Trigger toast={{ message: 'Copié', duration: Infinity }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Afficher' }));
    expect(document.querySelector('.opale-toast-provider__title')).toHaveTextContent('Copié');
    expect(warn).not.toHaveBeenCalled();
  });

  it('devrait laisser `title` l’emporter et avertir', () => {
    render(
      <ToastProvider>
        <Trigger toast={{ title: 'Titre', message: 'Message', duration: Infinity }} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Afficher' }));
    expect(document.querySelector('.opale-toast-provider__title')).toHaveTextContent('Titre');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('[Opale] showToast');
  });
});
