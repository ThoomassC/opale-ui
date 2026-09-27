import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { UI_VERSION } from '../../version';
import { SidebarCollapsibleScene } from './scenes';

afterEach(cleanup);

describe('SidebarCollapsibleScene', () => {
  it('affiche la version dans le pied du rail déplié', () => {
    const { container } = render(<SidebarCollapsibleScene />);

    expect(container.querySelector('aside')).toHaveTextContent(`v${UI_VERSION}`);
  });

  /* LE PIED D'UN RAIL REPLIÉ NE PEINT RIEN. Il affichait un point médian seul,
     orphelin sous les vignettes : un signe sans rôle, ni nom ni information. */
  it('ne laisse aucun signe orphelin dans le pied une fois replié', async () => {
    const user = userEvent.setup();
    const { container } = render(<SidebarCollapsibleScene />);

    await user.click(screen.getByRole('button', { name: 'Replier le rail' }));

    const aside = container.querySelector('aside');
    expect(aside).not.toHaveTextContent('·');
    expect(aside).not.toHaveTextContent(`v${UI_VERSION}`);
  });

  /* LE MATÉRIAU CHANGE, PAS L'ÉTAT. Passer en verre remonte le rail dans une
     autre scène : si l'état vivait dans le rail, le pli et l'entrée retenue
     repartiraient de zéro à chaque bascule du matériau. */
  it('garde le pli et l’entrée retenue en passant au verre', async () => {
    const user = userEvent.setup();
    const { container } = render(<SidebarCollapsibleScene />);

    await user.click(screen.getByRole('button', { name: 'Photos' }));
    await user.click(screen.getByRole('button', { name: 'Replier le rail' }));
    await user.click(screen.getByRole('checkbox', { name: 'Liquid Glass pour Sidebar pliable' }));

    expect(screen.getByRole('button', { name: 'Déplier le rail' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Photos' })).toHaveAttribute('aria-current', 'page');
    expect(container.querySelector('aside')).not.toHaveTextContent('·');
  });
});
