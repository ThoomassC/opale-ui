import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HeaderNavigation, type HeaderNavigationLink } from './HeaderNavigation';
import { HeaderThemeToggle } from './HeaderThemeToggle';
import { LanguageFlag, type HeaderLanguage } from './LanguageFlag';
import { LanguageSelector } from './LanguageSelector';

afterEach(cleanup);

/* =============================================================================
   LES CONTRÔLES DU HEADER, TESTÉS POUR EUX-MÊMES.

   Ils servent au header de la vitrine ET à PageScaffold. Jusqu'ici, seuls les
   parcours de ces deux hôtes les exerçaient : une branche que ni l'un ni
   l'autre ne traverse — `Home` liste fermée, `Tab` sans liste — n'était tenue
   par rien.
   ========================================================================== */

/** Le sélecteur piloté comme l'écrit un hôte : l'état vit chez l'appelant. */
function ControlledSelector({
  initial = 'FR',
  onChange = () => undefined,
  siteClassNames,
}: {
  readonly initial?: HeaderLanguage;
  readonly onChange?: (language: HeaderLanguage) => void;
  readonly siteClassNames?: boolean;
}) {
  const [language, setLanguage] = useState<HeaderLanguage>(initial);
  return (
    <>
      <LanguageSelector
        language={language}
        label="Langue"
        siteClassNames={siteClassNames}
        onChange={(next) => {
          setLanguage(next);
          onChange(next);
        }}
      />
      <button type="button">Après</button>
    </>
  );
}

/* Le nom calculé par Testing Library s'arrête au libellé : l'auto-référence
   d'`aria-labelledby` est coupée par sa garde anti-récursion. */
const combobox = () => screen.getByRole('combobox', { name: 'Langue' });

/** Le libellé de l'option que désigne `aria-activedescendant`. */
const activeOption = () => {
  const id = combobox().getAttribute('aria-activedescendant');
  return id ? document.getElementById(id)?.textContent : undefined;
};

describe('LanguageSelector — le clavier', () => {
  it('devrait ouvrir sur la langue courante quand on presse Flèche bas', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector initial="EN" />);

    combobox().focus();
    await user.keyboard('{ArrowDown}');

    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toBe('English');
    expect(combobox()).toHaveFocus();
  });

  it('devrait ouvrir sur la langue courante quand on presse Flèche haut', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector initial="ES" />);

    combobox().focus();
    await user.keyboard('{ArrowUp}');

    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toBe('Español');
  });

  it('devrait boucler de la dernière option à la première avec Flèche bas', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector initial="ES" />);

    combobox().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');

    expect(activeOption()).toBe('Français');
  });

  it('devrait boucler de la première option à la dernière avec Flèche haut', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector initial="FR" />);

    combobox().focus();
    await user.keyboard('{ArrowUp}{ArrowUp}');

    expect(activeOption()).toBe('Español');
  });

  it('devrait sauter aux extrémités avec Début et Fin quand la liste est ouverte', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector initial="EN" />);

    combobox().focus();
    await user.keyboard('{ArrowDown}{End}');
    expect(activeOption()).toBe('Español');

    await user.keyboard('{Home}');
    expect(activeOption()).toBe('Français');
  });

  /* Liste fermée, ces touches appartiennent à la page — `Début` et `Fin` la
     font défiler. `fireEvent` et non `userEvent` : lui seul rend le verdict
     de `preventDefault`, qui est ici le comportement attendu. */
  it.each(['Home', 'End', 'Escape'])(
    'devrait laisser %s à la page quand la liste est fermée',
    (key) => {
      render(<ControlledSelector />);

      const notPrevented = fireEvent.keyDown(combobox(), { key });

      expect(notPrevented, `${key} ne doit pas être confisqué`).toBe(true);
      expect(combobox()).toHaveAttribute('aria-expanded', 'false');
      expect(combobox()).not.toHaveAttribute('aria-activedescendant');
    },
  );

  it.each(['{Enter}', ' '])(
    'devrait ouvrir, puis valider l’option désignée, avec %s',
    async (key) => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<ControlledSelector onChange={onChange} />);

      combobox().focus();
      await user.keyboard(key);
      expect(combobox()).toHaveAttribute('aria-expanded', 'true');

      await user.keyboard('{ArrowDown}');
      await user.keyboard(key);

      expect(onChange).toHaveBeenCalledExactlyOnceWith('EN');
      expect(combobox()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByRole('option', { name: 'English', hidden: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    },
  );

  it('devrait fermer sans rien choisir quand on presse Échap', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ControlledSelector onChange={onChange} />);

    combobox().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Escape}');

    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(onChange).not.toHaveBeenCalled();
    expect(combobox()).toHaveFocus();
  });

  it('devrait valider l’option désignée et laisser sortir le focus avec Tab', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ControlledSelector onChange={onChange} />);

    combobox().focus();
    await user.keyboard('{ArrowDown}{ArrowUp}');
    await user.tab();

    expect(onChange).toHaveBeenCalledExactlyOnceWith('ES');
    expect(screen.getByRole('button', { name: 'Après' })).toHaveFocus();
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('ne devrait rien choisir quand on quitte par Tab une liste fermée', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ControlledSelector onChange={onChange} />);

    combobox().focus();
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Après' })).toHaveFocus();
  });

  it('devrait ignorer une touche sans rôle dans le motif', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);

    combobox().focus();
    await user.keyboard('{ArrowDown}a');

    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(activeOption()).toBe('Français');
  });
});

describe('LanguageSelector — le pointeur', () => {
  it('devrait ouvrir puis refermer la liste au clic sur le bouton', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);

    await user.click(combobox());
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');

    await user.click(combobox());
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('devrait choisir l’option cliquée sans perdre le focus en route', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ControlledSelector onChange={onChange} />);

    await user.click(combobox());
    await user.click(screen.getByRole('option', { name: 'Español' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('ES');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(combobox()).toHaveFocus();
  });

  it('devrait désigner l’option survolée', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);

    await user.click(combobox());
    await user.hover(screen.getByRole('option', { name: 'English' }));

    expect(activeOption()).toBe('English');
    expect(screen.getByRole('option', { name: 'English' })).toHaveAttribute('data-active', 'true');
  });

  it('devrait fermer la liste quand on appuie hors du contrôle', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);

    await user.click(combobox());
    await user.pointer({ keys: '[MouseLeft]', target: document.body });

    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('devrait garder la liste ouverte quand on appuie dans le contrôle', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);

    await user.click(combobox());
    await user.pointer({
      keys: '[MouseLeft>]',
      target: screen.getByRole('option', { name: 'English' }),
    });

    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
  });

  it('devrait fermer la liste quand le focus quitte le contrôle', async () => {
    const user = userEvent.setup();
    render(<ControlledSelector />);

    await user.click(combobox());
    act(() => screen.getByRole('button', { name: 'Après' }).focus());

    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('LanguageSelector — les classes de la vitrine', () => {
  it('ne devrait poser les classes historiques que sur demande', () => {
    const { container, unmount } = render(<ControlledSelector />);
    expect(container.querySelector('.tc-doc-language')).toBeNull();
    unmount();

    const site = render(<ControlledSelector siteClassNames />);
    expect(site.container.querySelector('.tc-doc-language')).not.toBeNull();
    expect(combobox()).toHaveClass('tc-doc-language__trigger');
  });
});

describe('HeaderThemeToggle', () => {
  it('devrait annoncer le thème sombre comme un état pressé', () => {
    const { rerender } = render(
      <HeaderThemeToggle isDark={false} label="Thème sombre" onToggle={() => undefined} />,
    );
    expect(screen.getByRole('button', { name: 'Thème sombre' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    rerender(<HeaderThemeToggle isDark label="Thème sombre" onToggle={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Thème sombre' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('devrait montrer la lune en clair et le soleil en sombre, sans les annoncer', () => {
    const { rerender } = render(
      <HeaderThemeToggle isDark={false} label="Thème" onToggle={() => undefined} />,
    );
    expect(screen.getByText('☾')).toHaveAttribute('aria-hidden', 'true');

    rerender(<HeaderThemeToggle isDark label="Thème" onToggle={() => undefined} />);
    expect(screen.getByText('☀')).toHaveAttribute('aria-hidden', 'true');
  });

  it('devrait prévenir l’appelant à chaque activation', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<HeaderThemeToggle isDark={false} label="Thème" onToggle={onToggle} />);

    await user.click(screen.getByRole('button', { name: 'Thème' }));
    await user.keyboard('{Enter}');

    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('ne devrait poser les classes historiques que sur demande', () => {
    const { rerender } = render(
      <HeaderThemeToggle isDark label="Thème" onToggle={() => undefined} />,
    );
    expect(screen.getByRole('button', { name: 'Thème' })).not.toHaveClass('tc-doc-themetoggle');

    rerender(<HeaderThemeToggle isDark label="Thème" onToggle={() => undefined} siteClassNames />);
    expect(screen.getByRole('button', { name: 'Thème' })).toHaveClass('tc-doc-themetoggle');
    expect(screen.getByText('☀')).toHaveClass('tc-doc-themetoggle__glyph--sun');
  });
});

describe('HeaderNavigation', () => {
  const LINKS: readonly HeaderNavigationLink[] = [
    { id: 'guide', href: '/guide', label: 'Guide' },
    { id: 'api', href: '/api', label: 'API' },
    { id: 'code', href: 'https://example.test', label: 'Code', target: '_blank', rel: 'noopener' },
  ];

  it('devrait nommer la navigation et marquer la page courante', () => {
    render(<HeaderNavigation links={LINKS} activeId="api" ariaLabel="Sections" />);

    const nav = screen.getByRole('navigation', { name: 'Sections' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'API' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Guide' })).not.toHaveAttribute('aria-current');
  });

  it('devrait transmettre la cible et la relation d’un lien externe', () => {
    render(<HeaderNavigation links={LINKS} ariaLabel="Sections" />);

    const external = screen.getByRole('link', { name: 'Code' });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener');
    expect(external).toHaveAttribute('href', 'https://example.test');
  });

  it('devrait remettre le lien activé et l’événement à l’appelant', async () => {
    const onNavigate = vi.fn((_link: HeaderNavigationLink, event: { preventDefault(): void }) =>
      event.preventDefault(),
    );
    const user = userEvent.setup();
    render(<HeaderNavigation links={LINKS} ariaLabel="Sections" onNavigate={onNavigate} />);

    await user.click(screen.getByRole('link', { name: 'Guide' }));

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onNavigate.mock.calls[0][0]).toBe(LINKS[0]);
  });

  it('devrait se contenter de naviguer sans gestionnaire', async () => {
    const user = userEvent.setup();
    render(<HeaderNavigation links={LINKS} ariaLabel="Sections" />);

    await expect(user.click(screen.getByRole('link', { name: 'Guide' }))).resolves.toBeUndefined();
  });

  it('devrait rendre ses enfants à la place des liens quand on lui en donne', () => {
    render(
      <HeaderNavigation links={LINKS} ariaLabel="Sections">
        <a href="/seul">Seul</a>
      </HeaderNavigation>,
    );

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Seul' })).toBeInTheDocument();
  });

  it('devrait se retirer de l’arbre quand elle est masquée, et exposer sa balise', () => {
    const ref = createRef<HTMLElement>();
    render(<HeaderNavigation ref={ref} links={LINKS} ariaLabel="Sections" id="nav" hidden />);

    expect(screen.queryByRole('navigation')).toBeNull();
    expect(ref.current?.tagName).toBe('NAV');
    expect(ref.current).toHaveAttribute('id', 'nav');
  });

  it('ne devrait poser les classes historiques que sur demande', () => {
    const { rerender } = render(<HeaderNavigation links={LINKS} ariaLabel="Sections" />);
    expect(screen.getByRole('link', { name: 'Guide' })).not.toHaveClass('tc-doc-topbar__tab');

    rerender(<HeaderNavigation links={LINKS} ariaLabel="Sections" siteClassNames />);
    expect(screen.getByRole('link', { name: 'Guide' })).toHaveClass('tc-doc-topbar__tab');
  });
});

describe('LanguageFlag', () => {
  it.each<HeaderLanguage>(['FR', 'EN', 'ES'])(
    'devrait dessiner le drapeau %s comme une vignette décorative',
    (language) => {
      const { container } = render(<LanguageFlag language={language} className="flag" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('focusable', 'false');
      expect(svg).toHaveAttribute('viewBox', '0 0 60 40');
      expect(svg).toHaveClass('flag');
      expect(svg?.childElementCount).toBeGreaterThan(0);
    },
  );

  it('devrait dessiner trois drapeaux différents', () => {
    const languages: readonly HeaderLanguage[] = ['FR', 'EN', 'ES'];
    const drawings = languages.map(
      (language) => render(<LanguageFlag language={language} />).container.innerHTML,
    );

    expect(new Set(drawings).size).toBe(3);
  });
});
