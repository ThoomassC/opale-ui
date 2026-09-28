import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import SiteNavContent from './site-nav';

afterEach(cleanup);

const specimenHeader = () =>
  screen.getByRole('navigation', { name: 'Navigation de l’exemple' }).closest('header');

describe('SiteNavContent', () => {
  /* LA PAGE MONTRE LES DEUX MATIÈRES. Elle ne montrait qu'une barre originale
     posée sur la photographie, repeinte en bleu : ni l'état original sur son
     vrai terrain, ni le verre. */
  it('montre la barre originale sur la surface unie par défaut', () => {
    render(<SiteNavContent />);

    const header = specimenHeader();
    expect(header?.closest('.tc-doc-opale-plainstage')).not.toBeNull();
    expect(header?.closest('.tc-doc-stage')).toBeNull();
    /* LE COMPOSANT TEL QU'IL EST LIVRÉ. La vitrine repeignait la barre en bleu
       pour masquer l'accent teal de l'ancien jeu de jetons ; SiteNav porte
       désormais le primaire d'Opale, il n'y a plus rien à masquer. */
    expect(header?.style.background).toBe('');
  });

  it('passe au verre liquide sur la photographie, sans aplat imposé', async () => {
    const user = userEvent.setup();
    render(<SiteNavContent />);

    await user.click(screen.getByRole('checkbox', { name: 'Liquid Glass pour SiteNav' }));

    const header = specimenHeader();
    expect(header?.closest('.tc-doc-stage')).not.toBeNull();
    expect(header?.style.background).toBe('');
  });
});
