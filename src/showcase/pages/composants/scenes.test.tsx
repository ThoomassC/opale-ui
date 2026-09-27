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
});
