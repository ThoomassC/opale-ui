import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UsageBlock } from './api';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'clipboard');
});

function installClipboard(writeText: (value: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

describe('UsageBlock', () => {
  it('relie une commande explicite à un panneau replié et le sort du parcours clavier', async () => {
    const user = userEvent.setup();
    render(<UsageBlock label="Exemple Button" code={'<Opale.Button />'} />);

    const toggle = screen.getByRole('button', { name: 'Afficher le code' });
    const panel = screen.getByRole('group', {
      name: 'Exemple Button, défilement horizontal',
      hidden: true,
    });
    const reveal = panel.closest('.tc-doc-codeexample__reveal');

    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('tabindex', '-1');
    expect(reveal).toHaveAttribute('aria-hidden', 'true');
    expect(reveal).toHaveAttribute('data-open', 'false');

    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Masquer le code' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(panel).toHaveAttribute('tabindex', '0');
    expect(reveal).toHaveAttribute('aria-hidden', 'false');
    expect(reveal).toHaveAttribute('data-open', 'true');

    await user.click(screen.getByRole('button', { name: 'Masquer le code' }));
    expect(screen.getByRole('button', { name: 'Afficher le code' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('peut afficher une commande par défaut et la colorer sans altérer son texte', () => {
    const code = 'npm install opale --save-exact';
    render(<UsageBlock label="Installation" code={code} language="shell" defaultOpen />);

    const toggle = screen.getByRole('button', { name: 'Masquer le code' });
    const panel = screen.getByRole('group', {
      name: 'Installation, défilement horizontal',
    });
    const highlighted = panel.querySelector('code');

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toHaveAttribute('tabindex', '0');
    expect(panel.closest('.tc-doc-codeexample__reveal')).toHaveAttribute('aria-hidden', 'false');
    expect(highlighted).toHaveAttribute('data-language', 'shell');
    expect(highlighted).toHaveTextContent(code);
    expect(highlighted?.querySelector('.tc-doc-token--command')).toHaveTextContent('npm');
    expect(highlighted?.querySelector('.tc-doc-token--keyword')).toHaveTextContent('install');
    expect(highlighted?.querySelector('.tc-doc-token--flag')).toHaveTextContent('--save-exact');
  });

  it('colore les balises, attributs et chaînes des exemples TSX', () => {
    render(
      <UsageBlock
        label="Exemple Button"
        code={'<Opale.Button variant="danger">Danger</Opale.Button>'}
        defaultOpen
      />,
    );

    const panel = screen.getByRole('group', {
      name: 'Exemple Button, défilement horizontal',
    });

    expect(panel.querySelector('.tc-doc-token--tag')).toHaveTextContent('<Opale.Button');
    expect(panel.querySelector('.tc-doc-token--attribute')).toHaveTextContent('variant');
    expect(panel.querySelector('.tc-doc-token--string')).toHaveTextContent('"danger"');
  });

  it('copie le texte exact et n’annonce le succès qu’après la résolution', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn<(value: string) => Promise<void>>().mockResolvedValue(undefined);
    installClipboard(writeText);
    const code = '<Opale.Button variant="danger">Supprimer</Opale.Button>';

    render(<UsageBlock label="Exemple Button" code={code} />);
    await user.click(screen.getByRole('button', { name: 'Copier' }));

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(code);
    expect(await screen.findByRole('button', { name: 'Copié !' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Code copié dans le presse-papier.');
  });

  it('rend l’échec visible quand le presse-papier refuse la copie', async () => {
    const user = userEvent.setup();
    installClipboard(vi.fn().mockRejectedValue(new Error('refusé')));

    render(<UsageBlock label="Exemple Button" code={'<Opale.Button />'} />);
    await user.click(screen.getByRole('button', { name: 'Copier' }));

    expect(await screen.findByRole('button', { name: 'Réessayer' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('La copie a échoué.');
  });

  it('génère des relations aria-controls uniques pour plusieurs exemples', () => {
    render(
      <>
        <UsageBlock label="Premier exemple" code="un" />
        <UsageBlock label="Second exemple" code="deux" />
      </>,
    );

    const controls = screen
      .getAllByRole('button', { name: 'Afficher le code' })
      .map((button) => button.getAttribute('aria-controls'));

    expect(controls.every(Boolean)).toBe(true);
    expect(new Set(controls).size).toBe(2);
  });
});
