import { describe, expect, it } from 'vitest';

import * as root from '.';
import { CATALOG } from './catalog';

/* LE NAMESPACE `Opale` COUVRE TOUT LE CATALOGUE, ET LES ANCIENS NOMS MARCHENT
   ENCORE. `OpaleUI`, `Opale.Background` et `OPALE_CATALOG` sont dépréciés en
   3.6 : ils désignent toujours les mêmes objets que leurs remplaçants. */

/** Les membres d'`OpaleUI` en 3.5, qui doivent tous rester. */
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

  it('devrait garder `Background` comme alias de `BackgroundSurface`', () => {
    expect(root.Opale.Background).toBe(root.BackgroundSurface);
  });

  it('devrait désigner chaque membre par l’export nommé de même nom', () => {
    const drifts = Object.entries(root.Opale)
      .filter(([name]) => name !== 'Background')
      .filter(([name, value]) => !Object.is(Reflect.get(root, name), value))
      .map(([name]) => name);
    expect(drifts).toEqual([]);
  });
});

describe('les alias dépréciés', () => {
  it('garde `OpaleUI` utilisable, avec tous ses anciens membres', () => {
    for (const name of LEGACY_MEMBERS) {
      const value = Reflect.get(root.OpaleUI, name);
      expect(value, name).toBeDefined();
      expect(value, name).toBe(Reflect.get(root, name));
    }
    expect(root.OpaleUI.Button).toBe(root.Button);
    expect(root.OpaleUI.SvgMapControls).toBe(root.SvgMapControls);
  });

  it('garde `OPALE_CATALOG`, qui est le catalogue de la vitrine', () => {
    expect(root.OPALE_CATALOG).toBe(CATALOG);
    expect(root.OPALE_CATALOG.length).toBeGreaterThan(50);
  });
});
