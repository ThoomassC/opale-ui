import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Pagination } from './opale';

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
