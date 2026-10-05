import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { UI_VERSION } from '../../version';
import { SidebarCollapsibleScene } from './scenes';

afterEach(cleanup);

describe('SidebarCollapsibleScene', () => {
  /* DEMANDE DU PROPRIÉTAIRE : ni numéro de version au pied, ni titre ni bouton
     de pli en tête — le rail commence par ses parties, comme le sommaire. */
  it('n’affiche ni version, ni titre, ni bouton de pli', () => {
    const { container } = render(<SidebarCollapsibleScene />);

    const aside = container.querySelector('aside');
    expect(aside).not.toHaveTextContent(`v${UI_VERSION}`);
    expect(aside?.querySelector('.opale-sidebar__header')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Replier le rail' })).toBeNull();
  });

  it('montre la barre de défilement et la poignée de largeur du sommaire', () => {
    render(<SidebarCollapsibleScene />);

    expect(screen.getByRole('separator', { name: 'Largeur du rail' })).toBeInTheDocument();
    expect(document.querySelector('.opale-sidebar__scrollbar')).not.toBeNull();
  });

  /* LE MATÉRIAU CHANGE, PAS L'ÉTAT. Passer en verre remonte le rail dans une
     autre scène : si l'état vivait dans le rail, l'entrée retenue repartirait
     de zéro à chaque bascule du matériau. */
  it('garde l’entrée retenue en passant au verre', async () => {
    const user = userEvent.setup();
    render(<SidebarCollapsibleScene />);

    await user.click(screen.getByRole('button', { name: 'Photos' }));
    await user.click(screen.getByRole('switch', { name: 'Verre liquide pour Sidebar' }));

    expect(screen.getByRole('button', { name: 'Photos' })).toHaveAttribute('aria-current', 'page');
  });
});
