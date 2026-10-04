import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import Modal from './modal/Modal';
import SearchBar from './search-bar/SearchBar';
import Sidebar from './sidebar/Sidebar';
import Tabs from './tabs/Tabs';
import Topbar from './topbar/Topbar';
import { expectOnlyDeprecationWarnings } from '../../test/deprecation-warnings';

/* Ce fichier croise l'ancienne API : ses avertissements sont attendus. */
expectOnlyDeprecationWarnings();

/* =============================================================================
   LES RÉGLAGES DU VERRE SE COMPORTENT PAREIL PARTOUT.

   `rootStyle` atteint l'élément qui porte la silhouette dans les DEUX
   matières : l'enveloppe du verre, ou l'élément unique de la version pleine.
   `enableLiquidAnimation` est le nom commun de l'onde.
   ========================================================================== */

afterEach(cleanup);

const ROOT_STYLE = { marginTop: '7px' } as const;

type Case = {
  readonly name: string;
  readonly render: (liquidGlass: boolean) => ReactElement;
  readonly shell: string;
};

const CASES: readonly Case[] = [
  {
    name: 'Modal',
    render: (liquidGlass) => (
      <Modal open liquidGlass={liquidGlass} rootStyle={ROOT_STYLE} title="Titre">
        Corps
      </Modal>
    ),
    shell: '.opale-modal__shell',
  },
  {
    name: 'Tabs',
    render: (liquidGlass) => (
      <Tabs defaultValue="a" liquidGlass={liquidGlass} rootStyle={ROOT_STYLE}>
        <Tabs.List>
          <Tabs.Trigger value="a">A</Tabs.Trigger>
        </Tabs.List>
      </Tabs>
    ),
    shell: '.opale-tabs__shell',
  },
  {
    name: 'Topbar',
    render: (liquidGlass) => <Topbar liquidGlass={liquidGlass} rootStyle={ROOT_STYLE} />,
    shell: '.opale-topbar__shell',
  },
  {
    name: 'Sidebar',
    render: (liquidGlass) => <Sidebar liquidGlass={liquidGlass} rootStyle={ROOT_STYLE} />,
    shell: '.opale-sidebar__shell',
  },
];

const ROWS = CASES.flatMap((entry) =>
  [false, true].map((liquidGlass) => ({
    ...entry,
    liquidGlass,
    material: liquidGlass ? 'verre' : 'pleine',
  })),
);

describe('rootStyle', () => {
  it.each(ROWS)(
    '$name ($material) le pose sur sa silhouette',
    ({ render: renderCase, liquidGlass, shell }) => {
      render(renderCase(liquidGlass));
      const element = document.body.querySelector<HTMLElement>(shell);
      expect(element?.style.marginTop).toBe('7px');
      expect(element?.hasAttribute('rootStyle')).toBe(false);
    },
  );

  it('se fond au style de l’appelant sur la version pleine, qui l’emporte', () => {
    render(<Topbar rootStyle={{ marginTop: '7px', color: 'red' }} style={{ color: 'blue' }} />);
    const header = screen.getByRole('banner');
    expect(header.style.marginTop).toBe('7px');
    expect(header.style.color).toBe('blue');
  });
});

describe('l’onde de SearchBar', () => {
  const rippleAfterClick = (element: ReactElement) => {
    const { container } = render(element);
    fireEvent.click(screen.getByRole('searchbox'));
    return container.querySelector('[data-opale-glass] > span[aria-hidden="true"]');
  };

  it('naît au clic par défaut', () => {
    expect(rippleAfterClick(<SearchBar liquidGlass />)).not.toBeNull();
  });

  it('se coupe par enableLiquidAnimation', () => {
    expect(rippleAfterClick(<SearchBar liquidGlass enableLiquidAnimation={false} />)).toBeNull();
  });
});
