import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { resetDeprecationWarnings, warnIfUnnamed } from './deprecations';
import { PageScaffold, SearchBar, Sidebar, Tabs, type UseSvgMapViewportResult } from './components';
import { Layout, ProgressBar, SvgMap, SvgMapControls, Toast } from './opale';
import siteNavSheet from './components/site-nav/site-nav.module.css?raw';
import sidebarSheet from './components/sidebar/style/Sidebar.module.css?raw';
import { parseRules } from '../test/css-rules';

afterEach(cleanup);

/* =============================================================================
   UN TOAST MONTÉ AVEC SON MESSAGE EST QUAND MÊME ANNONCÉ (ACC-15, WCAG 4.1.3).

   Le motif naturel `{saved && <Toast message="Enregistré" />}` créait l'ancre
   ET y posait le message dans la foulée : la région live naissait avec son
   texte, cas que les lecteurs d'écran n'annoncent pas. La carte s'affiche
   toujours tout de suite ; c'est le TEXTE qui est réinséré une fois la région
   installée, et masqué aux technologies d'assistance d'ici là pour ne pas être
   dit deux fois.
   ========================================================================== */
describe('Toast : annonce d’un message monté ouvert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('réinsère le message dans la même région, une fois celle-ci installée', () => {
    render(<Toast message="Enregistré" />);
    const region = screen.getByRole('status');
    const first = within(region).getByText('Enregistré');
    expect(first).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Enregistré')).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const second = within(screen.getByRole('status')).getByText('Enregistré');
    expect(screen.getByRole('status')).toBe(region);
    expect(second).not.toBe(first);
    expect(second).not.toHaveAttribute('aria-hidden');
  });

  it('pose le message sans détour quand la région existe déjà', () => {
    const { rerender } = render(<Toast message="Enregistré" open={false} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    rerender(<Toast message="Enregistré" open />);

    expect(within(screen.getByRole('status')).getByText('Enregistré')).not.toHaveAttribute(
      'aria-hidden',
    );
  });
});

/* =============================================================================
   LA RECHERCHE DU GABARIT DIT COMBIEN ELLE PROPOSE (ACC-24).
   ========================================================================== */
describe('PageScaffold : la région de statut de la recherche', () => {
  const SUGGESTIONS = [
    { id: 'b', label: 'Boutons', href: '#b' },
    { id: 'c', label: 'Bordures', href: '#c' },
  ];

  it('existe vide avant la saisie, puis annonce le compte et l’absence de résultat', () => {
    const { container } = render(<PageScaffold searchSuggestions={SUGGESTIONS} />);
    const form = container.querySelector('.opale-page-scaffold__search');
    if (!(form instanceof HTMLElement)) throw new Error('recherche manquante');
    const status = within(form).getByRole('status');
    expect(status).toBeEmptyDOMElement();
    const input = within(form).getByRole('combobox');

    fireEvent.change(input, { target: { value: 'bo' } });
    expect(within(form).getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('2 suggestions');

    fireEvent.change(input, { target: { value: 'bou' } });
    expect(status).toHaveTextContent('1 suggestion');

    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(within(form).getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('Aucun résultat');
  });

  it('accepte un compte traduit par l’appelant', () => {
    const { container } = render(
      <PageScaffold
        searchSuggestions={SUGGESTIONS}
        searchSuggestionCountLabel={(count) => `${count} hits`}
      />,
    );
    const form = container.querySelector('.opale-page-scaffold__search');
    if (!(form instanceof HTMLElement)) throw new Error('recherche manquante');

    fireEvent.change(within(form).getByRole('combobox'), { target: { value: 'bo' } });

    expect(within(form).getByRole('status')).toHaveTextContent('2 hits');
  });
});

/* =============================================================================
   LAYOUT N'IMPOSE PLUS SON <main> (ACC-17).
   ========================================================================== */
describe('Layout : mainAs', () => {
  it('rend un <main> par défaut', () => {
    render(<Layout>Contenu</Layout>);
    expect(screen.getByRole('main')).toHaveClass('opale-layout__content');
  });

  it('rend une <div> dans une page qui a déjà son <main>', () => {
    const { container } = render(<Layout mainAs="div">Contenu</Layout>);
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(container.querySelector('div.opale-layout__content')).toHaveTextContent('Contenu');
  });
});

/* =============================================================================
   LE REPÈRE SEARCH A UN NOM PAR DÉFAUT (ACC-22).
   ========================================================================== */
describe('SearchBar : nom du repère', () => {
  it.each([false, true])('nomme le repère « Recherche » par défaut (verre : %s)', (liquidGlass) => {
    render(<SearchBar liquidGlass={liquidGlass} />);
    expect(screen.getByRole('search', { name: 'Recherche' })).toBeInTheDocument();
  });

  it('reprend le nom du champ quand l’appelant le donne', () => {
    render(<SearchBar aria-label="Filtrer les pays" />);
    expect(screen.getByRole('search', { name: 'Filtrer les pays' })).toBeInTheDocument();
  });

  it('laisse `landmarkLabel` et `labels.landmark` gagner', () => {
    render(
      <>
        <SearchBar aria-label="Champ" landmarkLabel="Repère explicite" />
        <SearchBar labels={{ landmark: 'Search' }} />
      </>,
    );
    expect(screen.getByRole('search', { name: 'Repère explicite' })).toBeInTheDocument();
    expect(screen.getByRole('search', { name: 'Search' })).toBeInTheDocument();
  });

  it('garde « Rechercher » pour le champ sans nom, traduisible par `labels.field`', () => {
    render(<SearchBar labels={{ field: 'Search' }} landmark={false} />);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
  });
});

/* =============================================================================
   UN RAIL REPLIÉ MONTRE LE NOM DE L'ENTRÉE AU SURVOL ET AU FOCUS (ACC-25).
   ========================================================================== */
describe('Sidebar : infobulle des entrées repliées', () => {
  const renderRail = (collapsed: boolean) =>
    render(
      <Sidebar collapsible collapsed={collapsed}>
        <Sidebar.Items>
          <Sidebar.Item itemId="home">Accueil</Sidebar.Item>
        </Sidebar.Items>
      </Sidebar>,
    );

  it('marque l’entrée repliée pour l’infobulle, sans toucher à son nom', () => {
    renderRail(true);
    const item = screen.getByRole('button', { name: 'Accueil' });
    expect(item).toHaveAttribute('data-opale-tooltip', 'true');
    expect(item).not.toHaveAttribute('title');
  });

  it('n’en pose pas quand le rail est déplié', () => {
    renderRail(false);
    expect(screen.getByRole('button', { name: 'Accueil' })).not.toHaveAttribute(
      'data-opale-tooltip',
    );
  });

  it('se congédie par Échap, et revient au prochain focus', () => {
    renderRail(true);
    const item = screen.getByRole('button', { name: 'Accueil' });
    item.focus();

    fireEvent.keyDown(item, { key: 'Escape' });
    expect(item).toHaveAttribute('data-opale-tooltip', 'dismissed');

    fireEvent.blur(item);
    fireEvent.focus(item);
    expect(item).toHaveAttribute('data-opale-tooltip', 'true');
  });

  /* WCAG 1.4.13 : « congédiable » vaut aussi pour le survol. Échap n'était
     écouté que sur l'entrée, donc seulement quand elle avait le focus ; une
     infobulle ouverte à la souris, focus ailleurs, restait peinte (relevé
     sous Chromium). Pendant le survol, Échap est écouté sur le document, sans
     arrêter l'événement : un tiroir qui contient le rail doit encore le recevoir. */
  it('se congédie par Échap pendant le survol, même quand le focus est ailleurs', () => {
    renderRail(true);
    const item = screen.getByRole('button', { name: 'Accueil' });
    const outer = vi.fn();
    document.addEventListener('keydown', outer);

    fireEvent.mouseEnter(item);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(item).toHaveAttribute('data-opale-tooltip', 'dismissed');
    expect(outer).toHaveBeenCalledTimes(1);
    expect(outer.mock.calls[0]?.[0]).toHaveProperty('defaultPrevented', false);

    fireEvent.mouseLeave(item);
    expect(item).toHaveAttribute('data-opale-tooltip', 'true');
    document.removeEventListener('keydown', outer);
  });

  it('n’écoute plus Échap une fois le pointeur parti', () => {
    renderRail(true);
    const item = screen.getByRole('button', { name: 'Accueil' });

    fireEvent.mouseEnter(item);
    fireEvent.mouseLeave(item);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(item).toHaveAttribute('data-opale-tooltip', 'true');
  });

  it('retire son écoute au démontage', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderRail(true);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Accueil' }));
    unmount();
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
    remove.mockRestore();
  });

  it('peint l’infobulle au survol et au focus, et la retire quand elle est congédiée', () => {
    const rules = parseRules(sidebarSheet);
    const shown = rules.find(
      (rule) =>
        rule.selectors.some((selector) => selector.includes(':hover')) &&
        rule.selectors.some((selector) => selector.includes(':focus-visible')) &&
        rule.selectors.every((selector) => selector.includes('data-opale-tooltip')),
    );
    expect(shown?.body).toMatch(/clip-path:\s*none/);
  });
});

/* =============================================================================
   CONTRASTES FORCÉS : L'ENTRÉE ACTIVE RESTE DISTINCTE (ACC-04).
   ========================================================================== */
describe('Contrastes forcés : états actifs', () => {
  const forced = (sheet: string) =>
    parseRules(sheet).filter((rule) => rule.context.some((c) => c.includes('forced-colors')));

  it('Sidebar marque l’entrée retenue avec une couleur système', () => {
    const bodies = forced(sidebarSheet)
      .filter((rule) => rule.selectors.some((selector) => selector.includes('itemActive')))
      .map((rule) => rule.body)
      .join('\n');
    expect(bodies).toMatch(/Highlight/);
  });

  it('SiteNav marque la page courante avec une couleur système', () => {
    const bodies = forced(siteNavSheet)
      .filter((rule) => rule.selectors.some((selector) => selector.includes("aria-current='page'")))
      .map((rule) => rule.body)
      .join('\n');
    expect(bodies).toMatch(/Highlight/);
  });
});

/* =============================================================================
   UNE CARTE ZOOMÉE SE DÉPLACE SANS GLISSER (ACC-12, WCAG 2.5.7).
   ========================================================================== */
describe('SvgMap : boutons de déplacement', () => {
  const REGIONS = [
    { id: 'n', name: 'Nord', path: 'M0 0 H100 V50 H0 Z' },
    { id: 's', name: 'Sud', path: 'M0 50 H100 V100 H0 Z' },
  ];
  const viewBoxOf = (container: HTMLElement) =>
    container.querySelector('svg.opale-svg-map__svg')?.getAttribute('viewBox');

  it('n’affiche les flèches qu’une fois la carte zoomée', () => {
    render(<SvgMap viewBox="0 0 100 100" regions={REGIONS} label="Carte" />);
    expect(screen.queryByRole('button', { name: 'Déplacer vers le haut' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Zoomer' }));

    for (const name of [
      'Déplacer vers le haut',
      'Déplacer vers la gauche',
      'Déplacer vers la droite',
      'Déplacer vers le bas',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('group', { name: 'Déplacement' })).toBeInTheDocument();
  });

  it('déplace la vue au clic, d’un pas simple', async () => {
    const { container } = render(<SvgMap viewBox="0 0 100 100" regions={REGIONS} label="Carte" />);
    fireEvent.click(screen.getByRole('button', { name: 'Zoomer' }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    const before = viewBoxOf(container);

    fireEvent.click(screen.getByRole('button', { name: 'Déplacer vers la droite' }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    const [beforeX] = (before ?? '').split(' ').map(Number);
    const [afterX] = (viewBoxOf(container) ?? '').split(' ').map(Number);
    expect(afterX).toBeGreaterThan(beforeX);
  });

  it('se traduit et se retire', () => {
    const { rerender } = render(
      <SvgMap
        viewBox="0 0 100 100"
        regions={REGIONS}
        label="Map"
        labels={{ pan: 'Pan', panUp: 'Up' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Zoomer' }));
    expect(screen.getByRole('group', { name: 'Pan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Up' })).toBeInTheDocument();

    rerender(<SvgMap viewBox="0 0 100 100" regions={REGIONS} label="Map" panControls={false} />);
    expect(screen.queryByRole('group', { name: 'Déplacement' })).not.toBeInTheDocument();
  });

  /* LA FLÈCHE PART DE LA VUE VISÉE. Les flèches s'affichent dès le clic sur
     « Zoomer » ; cliquées pendant la transition, elles figeaient le zoom à
     mi-course, ou — avant la première image — déplaçaient la vue d'ensemble
     et disparaissaient sous le pointeur. La transition est achevée d'un coup,
     puis la vue se déplace depuis son arrivée. */
  describe('pendant la transition du zoom', () => {
    const numbers = (value: string | null | undefined) => (value ?? '').split(' ').map(Number);
    /* 100 × 100 zoomé de 1,6 autour du centre : 62,5 de côté, en 18,75 ; un pas
       vers la droite en vaut un cinquième, 12,5. */
    const expectPannedFromTarget = (container: HTMLElement) => {
      const [x, y, width, height] = numbers(viewBoxOf(container));
      expect(width).toBeCloseTo(62.5);
      expect(height).toBeCloseTo(62.5);
      expect(x).toBeCloseTo(31.25);
      expect(y).toBeCloseTo(18.75);
    };

    beforeEach(() => {
      vi.useFakeTimers({
        toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
      });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('à mi-course, achève le zoom puis déplace', () => {
      const { container } = render(
        <SvgMap viewBox="0 0 100 100" regions={REGIONS} label="Carte" />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Zoomer' }));
      act(() => {
        vi.advanceTimersByTime(80);
      });
      const [, , midWidth] = numbers(viewBoxOf(container));
      expect(midWidth, 'la transition doit être en cours').toBeGreaterThan(62.5 + 1);

      fireEvent.click(screen.getByRole('button', { name: 'Déplacer vers la droite' }));
      expectPannedFromTarget(container);

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expectPannedFromTarget(container);
    });

    it('avant la première image, déplace depuis la vue zoomée et garde les flèches', () => {
      const { container } = render(
        <SvgMap viewBox="0 0 100 100" regions={REGIONS} label="Carte" />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Zoomer' }));
      expect(viewBoxOf(container), 'aucune image encore peinte').toBe('0 0 100 100');

      fireEvent.click(screen.getByRole('button', { name: 'Déplacer vers la droite' }));
      expectPannedFromTarget(container);
      expect(screen.getByRole('button', { name: 'Déplacer vers la droite' })).toBeInTheDocument();
    });

    it('fait de même au clavier', () => {
      const { container } = render(
        <SvgMap viewBox="0 0 100 100" regions={REGIONS} label="Carte" />,
      );
      const svg = container.querySelector('svg.opale-svg-map__svg') as SVGSVGElement;
      fireEvent.keyDown(svg, { key: '+' });
      act(() => {
        vi.advanceTimersByTime(80);
      });

      fireEvent.keyDown(svg, { key: 'ArrowRight' });
      expectPannedFromTarget(container);
    });
  });

  /* `target` est arrivé en 2.9.3 : une vue construite à la main pour la 2.9.2
     n'en a pas, et les commandes ne doivent pas s'en trouver cassées. */
  it('accepte une vue construite à la main, sans `target`', () => {
    const view = { x: 10, y: 10, width: 50, height: 50 };
    const panBy = vi.fn();
    const viewport: UseSvgMapViewportResult = {
      viewBox: '0 0 100 100',
      current: '10 10 50 50',
      view,
      zoom: 2,
      maxZoom: 9,
      zoomed: true,
      canZoomIn: true,
      zoomBy: vi.fn(),
      panBy,
      fitTo: vi.fn(),
      fitBounds: vi.fn(),
      reveal: vi.fn(),
      reset: vi.fn(),
      getView: () => view,
      registerRegions: vi.fn(),
    };

    render(<SvgMapControls viewport={viewport} pan />);
    fireEvent.click(screen.getByRole('button', { name: 'Déplacer vers la droite' }));

    expect(panBy).toHaveBeenCalledWith(10, 0);
  });

  it('rend le focus à « Vue d’ensemble » quand les flèches disparaissent sous lui', () => {
    render(<SvgMap viewBox="0 0 100 100" regions={REGIONS} label="Carte" />);
    fireEvent.click(screen.getByRole('button', { name: 'Zoomer' }));
    const up = screen.getByRole('button', { name: 'Déplacer vers le haut' });
    up.focus();

    fireEvent.keyDown(up, { key: '0' });

    expect(screen.queryByRole('button', { name: 'Déplacer vers le haut' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Vue d’ensemble' }));
  });
});

/* =============================================================================
   DEUX VALEURS D'ONGLET NE DONNENT PLUS LE MÊME ID (ROB-07).
   ========================================================================== */
describe('Tabs : identifiants injectifs', () => {
  it('distingue « a b » de « a.b » et relie chaque panneau à son onglet', () => {
    render(
      <Tabs defaultValue="a b">
        <Tabs.List aria-label="Onglets">
          <Tabs.Trigger value="a b">Espace</Tabs.Trigger>
          <Tabs.Trigger value="a.b">Point</Tabs.Trigger>
          <Tabs.Trigger value="a_b">Souligné</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a b">Panneau espace</Tabs.Content>
        <Tabs.Content value="a.b">Panneau point</Tabs.Content>
        <Tabs.Content value="a_b">Panneau souligné</Tabs.Content>
      </Tabs>,
    );
    const tabs = screen.getAllByRole('tab');
    const ids = new Set(tabs.map((tab) => tab.id));
    expect(ids.size).toBe(3);
    const controls = new Set(tabs.map((tab) => tab.getAttribute('aria-controls')));
    expect(controls.size).toBe(3);
    const panel = screen.getByRole('tabpanel', { name: 'Espace' });
    expect(panel).toHaveTextContent('Panneau espace');
  });

  it('garde l’identifiant des valeurs simples', () => {
    render(
      <Tabs defaultValue="etapes-1">
        <Tabs.List aria-label="Onglets">
          <Tabs.Trigger value="etapes-1">Étapes</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="etapes-1">Panneau</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByRole('tab').id).toMatch(/-trigger-etapes-1$/);
  });
});

/* =============================================================================
   L'AVERTISSEMENT « SANS NOM » COUVRE PLUS QUE L'INTERRUPTEUR (ACC-21).
   ========================================================================== */
describe('warnIfUnnamed', () => {
  let warn: MockInstance<typeof console.warn>;
  beforeEach(() => {
    resetDeprecationWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
    resetDeprecationWarnings();
  });

  it('avertit pour une ProgressBar sans libellé', () => {
    render(<ProgressBar value={40} />);
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[Opale] ProgressBar : la barre de progression n’a pas de nom accessible — ' +
        'donnez-lui `label`, `aria-label` ou `aria-labelledby`.',
    );
  });

  it('se tait pour une ProgressBar nommée', () => {
    render(
      <>
        <ProgressBar value={40} label="Import" />
        <ProgressBar value={40} aria-label="Export" />
      </>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    ['Modal', 'le dialogue', '`title`, `aria-label` ou `aria-labelledby`'],
    ['Checkbox', 'la case', '`label`, `aria-label` ou `aria-labelledby`'],
    ['MultiSelect', 'la liste de choix', '`label`, `aria-label` ou `aria-labelledby`'],
    ['Slider', 'le curseur', '`label`, `aria-label` ou `aria-labelledby`'],
    ['Select', 'la liste déroulante', '`label`, `aria-label` ou `aria-labelledby`'],
  ] as const)('sait nommer %s', (component, noun, hint) => {
    const element = document.createElement('div');
    document.body.append(element);
    warnIfUnnamed(component, element);
    element.remove();
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      `[Opale] ${component} : ${noun} n’a pas de nom accessible — donnez-lui ${hint}.`,
    );
  });
});
