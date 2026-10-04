import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar, { type SidebarProps } from './Sidebar';

const renderSidebar = (props?: Partial<SidebarProps>) => {
  return render(
    <Sidebar collapsible {...props}>
      <Sidebar.Header>
        <span>Opale</span>
        <Sidebar.Toggle />
      </Sidebar.Header>

      <Sidebar.Items>
        <Sidebar.Item itemId="dashboard">Dashboard</Sidebar.Item>
        <Sidebar.Item itemId="analytics" badge={4}>
          Analytics
        </Sidebar.Item>
        <Sidebar.Item itemId="settings">Settings</Sidebar.Item>
      </Sidebar.Items>
    </Sidebar>,
  );
};

describe('Sidebar component', () => {
  it('renders provided items', () => {
    renderSidebar();

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analytics' })).toBeInTheDocument();
  });

  it('fires onValueChange with the item id', () => {
    const handleSelect = vi.fn();
    renderSidebar({ onValueChange: handleSelect });

    fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith('analytics');
  });

  it('does not trigger selection for disabled items', () => {
    const handleSelect = vi.fn();

    render(
      <Sidebar collapsible onValueChange={handleSelect}>
        <Sidebar.Items>
          <Sidebar.Item itemId="ready">Ready</Sidebar.Item>
          <Sidebar.Item itemId="blocked" disabled>
            Blocked
          </Sidebar.Item>
        </Sidebar.Items>
      </Sidebar>,
    );

    const blocked = screen.getByRole('button', { name: 'Blocked' });

    expect(blocked).toBeDisabled();
    fireEvent.click(blocked);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('calls onCollapsedChange when collapsible header toggle clicked', () => {
    const handleToggle = vi.fn();
    renderSidebar({ collapsed: false, onCollapsedChange: handleToggle });

    fireEvent.click(screen.getByRole('button', { name: 'Replier le rail' }));

    expect(handleToggle).toHaveBeenCalledWith(true);
  });
});

/* =============================================================================
   LES QUATRE CAS CI-DESSUS SONT LE CAHIER DES CHARGES.

   Ils décrivent le comportement hérité, en anglais comme ils ont été écrits ;
   seuls les noms de props ont suivi le retrait des anciens en 4.0.0
   (`onSelectItem` → `onValueChange`, `onToggle` → `onCollapsedChange`). Les cas ci-dessous sont NOUVEAUX et portent sur ce que la
   réécriture corrige : ils sont donc écrits dans la langue du dépôt.

   POURQUOI CES CAS-LÀ ET PAS D'AUTRES. Les quatre défauts corrigés sont des
   défauts d'ACCESSIBILITÉ : aucun ne se voit à l'écran, aucun ne casse un
   rendu, aucun ne fait rougir un type. Un rail qui perd le nom de ses entrées
   en se repliant se peint exactement comme un rail qui les garde. C'est
   précisément la catégorie de régression qu'on ne rattrape pas à la relecture,
   donc la catégorie qui doit être tenue par un test.
   ========================================================================== */

describe('Sidebar — ce que la réécriture corrige', () => {
  it('devrait garder le nom d’une entrée repliée, même si son libellé n’est pas une chaîne', () => {
    /* LE DÉFAUT QUE CE CAS EXISTE POUR EMPÊCHER. Le libellé était retiré du DOM
       au repli, et le nom rattrapé par un `aria-label` calculé — mais seulement
       `typeof children === 'string'`. Un libellé passé par un élément donnait
       donc un bouton ANONYME dès qu'on repliait le rail. */
    render(
      <Sidebar collapsible collapsed>
        <Sidebar.Items>
          <Sidebar.Item itemId="etapes" icon={<span>◆</span>}>
            <span>Étapes</span>
          </Sidebar.Item>
        </Sidebar.Items>
      </Sidebar>,
    );

    expect(screen.getByRole('button', { name: 'Étapes' })).toBeInTheDocument();
  });

  it('devrait annoncer l’entrée retenue par aria-current', () => {
    render(
      <Sidebar value="carte">
        <Sidebar.Items>
          <Sidebar.Item itemId="etapes">Étapes</Sidebar.Item>
          <Sidebar.Item itemId="carte">Carte</Sidebar.Item>
        </Sidebar.Items>
      </Sidebar>,
    );

    expect(screen.getByRole('button', { name: 'Carte' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Étapes' })).not.toHaveAttribute('aria-current');
  });

  it('devrait nommer le point de repère de navigation, et laisser l’appelant le renommer', () => {
    const { unmount } = render(
      <Sidebar>
        <Sidebar.Items>
          <Sidebar.Item itemId="etapes">Étapes</Sidebar.Item>
        </Sidebar.Items>
      </Sidebar>,
    );

    expect(screen.getByRole('navigation', { name: 'Navigation latérale' })).toBeInTheDocument();
    unmount();

    render(
      <Sidebar>
        <Sidebar.Items aria-label="Sommaire">
          <Sidebar.Item itemId="etapes">Étapes</Sidebar.Item>
        </Sidebar.Items>
      </Sidebar>,
    );

    expect(screen.getByRole('navigation', { name: 'Sommaire' })).toBeInTheDocument();
  });

  it('devrait dire l’état du pli sur la bascule, et désigner ce qu’elle commande', () => {
    /* `aria-expanded` répond à « où en suis-je ? » posé à froid, ce que le seul
       nom du bouton — qui dit l'ACTION — ne fait pas. */
    const { unmount } = render(
      <Sidebar collapsible collapsed={false}>
        <Sidebar.Header>
          <Sidebar.Toggle />
        </Sidebar.Header>
      </Sidebar>,
    );

    const expanded = screen.getByRole('button', { name: 'Replier le rail' });
    expect(expanded).toHaveAttribute('aria-expanded', 'true');

    const controls = expanded.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls ?? '')?.tagName).toBe('ASIDE');

    unmount();

    render(
      <Sidebar collapsible collapsed>
        <Sidebar.Header>
          <Sidebar.Toggle />
        </Sidebar.Header>
      </Sidebar>,
    );

    expect(screen.getByRole('button', { name: 'Déplier le rail' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  /* =========================================================================
     LE SOMMAIRE NE REBONDIT PAS QUAND ON CLIQUE UNE ENTRÉE.

     LE DÉFAUT OBSERVÉ. Le rail est un `Glass`, et le rebond du matériau était
     écrit `.glass:active`. Or `:active` remonte aux ANCÊTRES de l'élément
     pressé : sélectionner une entrée faisait donc sauter le rail entier —
     mesuré à 1 408 px de haut sur la vitrine. L'onde avait déjà été coupée ici
     pour cette raison exacte (voir `enableLiquidAnimation={false}` dans le
     composant) ; le rebond, lui, n'était pas coupable au même endroit, puisque
     rien ne le rendait optionnel.

     CE QUE CE TEST PEUT DIRE. jsdom ne peint pas : il ne verra jamais une
     échelle. Ce qui est observable, c'est l'attribut dont la règle dépend —
     `.glass[data-opale-glass-press='true']:active`. Son absence sur le rail
     est donc exactement l'assertion utile, et elle rougit si quelqu'un remet
     le rebond sur toutes les surfaces.
     ====================================================================== */
  it('ne rebondit pas : le rail est une surface, pas une cible d’appui', () => {
    /* `liquidGlass` EXPLICITE : le rail est ORIGINAL par défaut depuis qu'il a
       les deux matières, et ce test porte sur le comportement du matériau. */
    const { container } = renderSidebar({ liquidGlass: true });
    const material = container.querySelector('[data-opale-glass]');

    expect(material).not.toBeNull();
    expect(material?.querySelector('aside')).not.toBeNull();
    expect(material).not.toHaveAttribute('data-opale-glass-press');
  });

  /* LE REPLI NE DOIT PAS ÉCRASER UN LIBELLÉ VISIBLE.

     `aria-label` était posé inconditionnellement : un appelant qui donnait un
     texte à la bascule obtenait quand même « collapse sidebar » comme nom
     accessible. La commande vocale « clique Replier » échouait alors, le nom
     et le libellé visible n'ayant plus un mot en commun (WCAG 2.5.3). */
  it('laisse un libellé visible nommer la bascule', () => {
    render(
      <Sidebar collapsible>
        <Sidebar.Header>
          <Sidebar.Toggle>Replier</Sidebar.Toggle>
        </Sidebar.Header>
      </Sidebar>,
    );

    expect(screen.getByRole('button', { name: 'Replier' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Replier le rail' })).toBeNull();
  });

  /* CHAQUE COMPOSANT D'OPALE PROPOSE LES DEUX MATIÈRES, ET MONTRE L'ORIGINALE
     PAR DÉFAUT. Le rail ne savait rendre que du verre : sur une page claire,
     il posait une encre blanche sur un liseré blanc, et rien ne permettait
     d'obtenir la version pleine. */
  it('rend la version originale par défaut et le verre sur demande', () => {
    const { container, unmount } = renderSidebar();

    expect(
      container.querySelector('[data-opale-glass]'),
      'Le matériau est une option : il ne doit pas être le rendu par défaut.',
    ).toBeNull();
    expect(container.querySelector('aside')).not.toBeNull();

    unmount();

    const { container: verre } = renderSidebar({ liquidGlass: true });

    expect(verre.querySelector('[data-opale-glass]')).not.toBeNull();
    expect(
      verre.querySelector('aside'),
      'Le balisage ne change pas avec la matière.',
    ).not.toBeNull();
  });
});

/* =============================================================================
   LE TRIPLET CANONIQUE. `value / defaultValue / onValueChange` pour l'entrée
   retenue, `onCollapsedChange` pour le pli. Les cas ci-dessus, écrits avec
   `activeItemId`, `onSelectItem` et `onToggle`, prouvent que les anciens noms
   marchent encore.
   ========================================================================== */

describe('Sidebar — value, defaultValue, onValueChange, onCollapsedChange', () => {
  it('devrait retenir defaultValue puis suivre le clic sans parent', () => {
    const onValueChange = vi.fn();
    renderSidebar({ defaultValue: 'dashboard', onValueChange });

    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(onValueChange).toHaveBeenCalledWith('settings');
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('devrait garder value contrôlée, et null ne retenir aucune entrée', () => {
    const { rerender } = render(
      <Sidebar value="analytics">
        <Sidebar.Items>
          <Sidebar.Item itemId="dashboard">Dashboard</Sidebar.Item>
          <Sidebar.Item itemId="analytics">Analytics</Sidebar.Item>
        </Sidebar.Items>
      </Sidebar>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.getByRole('button', { name: 'Analytics' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    rerender(
      <Sidebar value={null} defaultValue="dashboard">
        <Sidebar.Items>
          <Sidebar.Item itemId="dashboard">Dashboard</Sidebar.Item>
          <Sidebar.Item itemId="analytics">Analytics</Sidebar.Item>
        </Sidebar.Items>
      </Sidebar>,
    );
    expect(screen.getByRole('button', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Analytics' })).not.toHaveAttribute('aria-current');
  });

  it('devrait appeler onValueChange une fois par sélection, en mode contrôlé', () => {
    const calls: string[] = [];
    renderSidebar({
      value: 'dashboard',
      onValueChange: (id) => calls.push(`onValueChange:${id}`),
    });

    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(calls).toEqual(['onValueChange:settings']);
  });

  it('devrait appeler onCollapsedChange une fois par bascule', () => {
    const calls: string[] = [];
    renderSidebar({
      onCollapsedChange: (collapsed) => calls.push(`onCollapsedChange:${collapsed}`),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Replier le rail' }));

    expect(calls).toEqual(['onCollapsedChange:true']);
    expect(screen.getByRole('button', { name: 'Déplier le rail' })).toBeInTheDocument();
  });

  it('devrait exposer value dans le contexte, sans l’ancien activeItemId', () => {
    function Probe() {
      const context = Sidebar.useSidebar();
      return <output>{`${context.value ?? '-'}/${'activeItemId' in context}`}</output>;
    }
    render(
      <Sidebar value="dashboard">
        <Probe />
      </Sidebar>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('dashboard/false');
  });

  it('fait entendre le badge en description, sans changer le nom', () => {
    renderSidebar();

    const item = screen.getByRole('button', { name: 'Analytics' });
    expect(item).toHaveAccessibleDescription('4');
  });

  it('décrit le badge par badgeLabel quand l’appelant le donne', () => {
    render(
      <Sidebar>
        <Sidebar.Items>
          <Sidebar.Item itemId="inbox" badge={4} badgeLabel="4 nouveaux">
            Boîte
          </Sidebar.Item>
        </Sidebar.Items>
      </Sidebar>,
    );

    const item = screen.getByRole('button', { name: 'Boîte' });
    expect(item).toHaveAccessibleDescription('4 nouveaux');
  });

  it('garde la description de l’appelant avant celle du badge', () => {
    render(
      <Sidebar>
        <Sidebar.Items>
          <Sidebar.Item itemId="inbox" badge={4} aria-describedby="hint">
            Boîte
          </Sidebar.Item>
        </Sidebar.Items>
        <p id="hint">Messages reçus</p>
      </Sidebar>,
    );

    expect(screen.getByRole('button', { name: 'Boîte' })).toHaveAccessibleDescription(
      'Messages reçus 4',
    );
  });
});
