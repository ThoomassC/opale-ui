import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { FindTheDepartment } from './svg-map';
import WorldMap from './world-map';

afterEach(cleanup);

/* LA LISTE EST L'ÉQUIVALENT DE LA CARTE (WCAG 2.5.8) : elle doit faire
   EXACTEMENT ce que fait le clic sur une région, pas une approximation. */
describe('les démonstrations de SvgMap — la sélection par la liste', () => {
  it('répond au quiz comme un clic sur la zone', async () => {
    const user = userEvent.setup();
    render(<FindTheDepartment />);

    const list = screen.getByRole('combobox', { name: 'Ou répondez par la liste' });
    await user.selectOptions(list, within(list).getByRole('option', { name: 'Zone 1' }));

    /* La zone choisie est soulignée sur la carte, et le score compte. */
    expect(screen.getByRole('button', { name: 'Zone 1' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/score \d\/1/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Bonne réponse|C’était ailleurs/);
    expect(list).toHaveValue(
      screen.getByRole('button', { name: 'Zone 1' }).getAttribute('data-region-id'),
    );

    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(list).toHaveValue('');
  });

  it('fait tourner l’état d’un pays comme un clic sur la carte', async () => {
    const user = userEvent.setup();
    render(<WorldMap />);

    const list = screen.getByRole('combobox', { name: 'Ou basculez un pays par la liste' });
    await user.selectOptions(list, within(list).getByRole('option', { name: 'Japon — visité' }));

    expect(screen.getByRole('button', { name: 'Japon, à venir' })).toBeInTheDocument();
    expect(within(list).getByRole('option', { name: 'Japon — à venir' })).toBeInTheDocument();
    /* Une action, pas une valeur : la liste revient à l'invite. */
    expect(list).toHaveValue('');
  });
});
