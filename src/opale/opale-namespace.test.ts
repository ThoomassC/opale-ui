import { describe, expect, it } from 'vitest';

import * as root from '.';
import { CATALOG } from './catalog';

/* LE NAMESPACE `Opale` COUVRE TOUT LE CATALOGUE. `OpaleUI`, `Opale.Background`
   et `OPALE_CATALOG`, dépréciés en 2.6, ont été retirés en 4.0.0 : `Opale`
   garde chacun des membres qu'avait `OpaleUI`. */

/** Les membres d'`OpaleUI` en 2.5, que `Opale` doit tous garder. */
const LEGACY_MEMBERS = [
  'Button',
  'Pressable',
  'Card',
  'CardGrid',
  'Input',
  'SearchBar',
  'PageScaffold',
  'InlineInput',
  'Checkbox',
  'Toggle',
  'Slider',
  'Select',
  'MultiSelect',
  'Autocomplete',
  'Form',
  'SegmentedControl',
  'IconActionButton',
  'DataTable',
  'DescriptionList',
  'BulletList',
  'Badge',
  'Rating',
  'RatingInput',
  'Pagination',
  'Skeleton',
  'StatCard',
  'Donut',
  'LegalLinks',
  'Heading',
  'Text',
  'Icon',
  'Feedback',
  'Toast',
  'Spinner',
  'ProgressBar',
  'ConfirmDialog',
  'EmptyState',
  'Navbar',
  'Menu',
  'Link',
  'SidePanel',
  'CommandPalette',
  'Breadcrumb',
  'CookieBanner',
  'SelectionBar',
  'Stack',
  'Layout',
  'Divider',
  'BackgroundSurface',
  'FileCard',
  'Dropzone',
  'Lightbox',
  'Clipboard',
  'SvgMap',
  'SvgMapControls',
];

const ADDED = ['Modal', 'Tabs', 'Sidebar', 'Topbar', 'SiteNav', 'ToastProvider'] as const;

describe('le namespace Opale', () => {
  it.each(ADDED)('devrait exposer %s, le même objet que l’export nommé', (name) => {
    expect(root.Opale[name]).toBe(root[name]);
  });

  it('ne garde plus l’alias `Background`, retiré en 4.0.0', () => {
    expect('Background' in root.Opale).toBe(false);
  });

  it('devrait désigner chaque membre par l’export nommé de même nom', () => {
    const drifts = Object.entries(root.Opale)
      .filter(([name, value]) => !Object.is(Reflect.get(root, name), value))
      .map(([name]) => name);
    expect(drifts).toEqual([]);
  });
});

describe('les alias retirés en 4.0.0', () => {
  it('garde dans `Opale` chaque membre de l’ancien `OpaleUI`', () => {
    for (const name of LEGACY_MEMBERS) {
      const value = Reflect.get(root.Opale, name);
      expect(value, name).toBeDefined();
      expect(value, name).toBe(Reflect.get(root, name));
    }
  });

  it('ne publie plus `OpaleUI` ni `OPALE_CATALOG`', () => {
    expect('OpaleUI' in root).toBe(false);
    expect('OPALE_CATALOG' in root).toBe(false);
    expect(CATALOG.length).toBeGreaterThan(50);
  });
});
