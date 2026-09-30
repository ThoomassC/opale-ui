import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { DocShell } from './doc-shell';
import { PAGES } from './pages';

afterEach(cleanup);

/* LE NOM CHERCHÉ EST LE SEUL LIBELLÉ, ET NON « Langue Français ».

   Le contrôle porte l'`aria-labelledby` chaîné de l'APG — le libellé PUIS
   lui-même —, ce qui fait annoncer « Langue Français » aux navigateurs : le
   nom du contrôle, puis sa valeur, comme un `<select>` natif. Mais
   `dom-accessibility-api`, qui calcule le nom pour Testing Library, coupe
   l'auto-référence par garde anti-récursion et ne rend que « Langue ».
   Chercher le nom composé ici échouerait sur une divergence de bibliothèque,
   pas sur un défaut du composant ; le chaînage est donc vérifié en propre sur
   l'attribut, dans le premier cas. */
function trigger(label: string) {
  return screen.getByRole('combobox', { name: label });
}

describe('le sélecteur de langue de la vitrine', () => {
  it('affiche le drapeau de la langue courante et nomme les trois options', async () => {
    const user = userEvent.setup();
    render(<DocShell pages={PAGES} />);

    const combobox = trigger('Langue');

    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    /* LE CHAÎNAGE, VÉRIFIÉ SUR L'ATTRIBUT : sans l'auto-référence, le bouton
       s'annoncerait « Langue, liste déroulante » et tairait la langue
       courante, qui est pourtant tout ce qu'il affiche. */
    expect(combobox.getAttribute('aria-labelledby')?.split(' ')).toEqual([
      screen.getByText('Langue').id,
      combobox.id,
    ]);

    await user.click(combobox);

    expect(combobox).toHaveAttribute('aria-expanded', 'true');

    const list = screen.getByRole('listbox', { name: 'Langue' });
    const options = within(list).getAllByRole('option');

    /* LES NOMS SONT DES ENDONYMES ET NON DES DRAPEAUX. Les vignettes sont
       `aria-hidden` : ce qui reste est le libellé masqué, qui porte son
       `lang`. Un test qui chercherait « 🇫🇷 » vérifierait la décoration. */
    expect(options.map((option) => option.textContent)).toEqual(['Français', 'English', 'Español']);
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(within(options[1]).getByText('English')).toHaveAttribute('lang', 'en');
  });

  it('traduit l’interface en anglais puis en espagnol et persiste le choix', async () => {
    const user = userEvent.setup();
    render(<DocShell pages={PAGES} />);

    await user.click(trigger('Langue'));
    await user.click(screen.getByRole('option', { name: 'English' }));

    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(localStorage.getItem('tc-language')).toBe('EN');
    expect(screen.getAllByRole('link', { name: 'Home' })).not.toHaveLength(0);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'The design system for the Opale ecosystem.',
    );

    /* Le panneau se referme sur le choix : la liste reste dans le DOM pour que
       `aria-controls` désigne un élément présent, mais `hidden` la retire de
       l'arbre d'accessibilité — donc `queryByRole` ne doit plus la voir. */
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(trigger('Language'));
    await user.click(screen.getByRole('option', { name: 'Español' }));

    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(localStorage.getItem('tc-language')).toBe('ES');
    expect(screen.getAllByRole('link', { name: 'Inicio' })).not.toHaveLength(0);
    expect(screen.getByPlaceholderText('Buscar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'El sistema de diseño del ecosistema Opale.',
    );
    expect(trigger('Idioma')).toBeInTheDocument();
  });

  it('se pilote entièrement au clavier, sans jamais déplacer le focus hors du bouton', async () => {
    const user = userEvent.setup();
    render(<DocShell pages={PAGES} />);

    const combobox = trigger('Langue');

    combobox.focus();

    /* `↓` ouvre et désigne la valeur courante : ouvrir une liste ne doit pas
       déplacer le point de départ de la lecture. */
    await user.keyboard('{ArrowDown}');

    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Français' }).id,
    );
    expect(document.activeElement).toBe(combobox);

    await user.keyboard('{End}');

    expect(combobox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Español' }).id,
    );

    /* `Échap` referme SANS changer la valeur : c'est la sortie de secours du
       motif, et elle ne doit rien valider. */
    await user.keyboard('{Escape}');

    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(document.documentElement).toHaveAttribute('lang', 'fr');

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(trigger('Language')).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(combobox);
  });
});
