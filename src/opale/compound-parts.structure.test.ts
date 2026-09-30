import { describe, expect, it } from 'vitest';

import * as root from '.';

/* =============================================================================
   CHAQUE PARTIE D'UN COMPOSANT COMPOSÉ A AUSSI SON PROPRE NOM.

   `Tabs.List` est une propriété posée sur `Tabs`. Dans un Server Component de
   Next.js, `Tabs` n'est pas le composant mais une référence client opaque : on
   ne peut pas « entrer dedans par un point », et `<Tabs.List>` lève « Cannot
   access Tabs.List on the server ». Le seul chemin qui marche côté serveur est
   un export nommé — `TabsList` —, qui devient à son tour sa propre référence.

   La règle tenue ici : toute partie en capitale posée sur un composant exporté
   (`X.Y`) est aussi exportée sous le nom `XY`, et c'est LE MÊME objet. Les
   crochets (`Tabs.useTabs`) n'en relèvent pas : un crochet ne s'exécute jamais
   dans un Server Component, et un Client Component peut les appeler par le
   point.
   ========================================================================== */

type Exported = Readonly<Record<string, unknown>>;

const exported: Exported = root;

/* Un composant React exporté : une fonction, ou un objet `forwardRef`/`memo`
   reconnaissable à son `$$typeof`. Les objets de données (`OPALE_ICONS`) et le
   namespace `Opale` n'en sont pas. */
const isComponent = (value: unknown): value is object =>
  typeof value === 'function' ||
  (typeof value === 'object' && value !== null && '$$typeof' in value);

const compoundParts = Object.entries(exported).flatMap(([name, value]) =>
  isComponent(value)
    ? Object.keys(value)
        .filter((member) => /^[A-Z]/.test(member))
        .map((member) => ({ owner: name, member, part: Reflect.get(value, member) as unknown }))
    : [],
);

describe('les parties des composants composés', () => {
  it('devraient être trouvées sur Tabs, Sidebar et Topbar', () => {
    expect(new Set(compoundParts.map(({ owner }) => owner))).toEqual(
      new Set(['Tabs', 'Sidebar', 'Topbar']),
    );
  });

  it.each(compoundParts)('$owner.$member devrait être exporté comme $owner$member', (entry) => {
    expect(exported[`${entry.owner}${entry.member}`]).toBe(entry.part);
  });

  it('devraient garder la notation à point pour les Client Components', () => {
    expect(root.Tabs.List).toBe(root.TabsList);
    expect(root.Sidebar.Item).toBe(root.SidebarItem);
    expect(root.Topbar.Brand).toBe(root.TopbarBrand);
  });
});
