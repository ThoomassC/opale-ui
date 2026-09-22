import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('renders a labelled search field in a search landmark', () => {
    render(<SearchBar placeholder="Un voyage, un lieu, un pays…" />);

    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Rechercher' })).toHaveAttribute(
      'placeholder',
      'Un voyage, un lieu, un pays…',
    );
  });

  /* LE REPLI ÉCRASAIT UNE ÉTIQUETTE VISIBLE.

     `aria-label` était posé toujours : un appelant qui associait un
     `<label for>` « Filtrer les destinations » obtenait un champ nommé
     « Rechercher », sans un mot en commun avec ce qu'on lit à l'écran. La
     commande vocale « clique Filtrer les destinations » échouait (WCAG
     2.5.3). Le repli ne doit jouer que faute d'autre nom. */
  it('laisse une étiquette visible nommer le champ', () => {
    render(
      <>
        <label htmlFor="filtre">Filtrer les destinations</label>
        <SearchBar id="filtre" />
      </>,
    );

    expect(screen.getByRole('searchbox', { name: 'Filtrer les destinations' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Rechercher' })).toBeNull();
  });
});
