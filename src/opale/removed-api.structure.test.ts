import { describe, expect, it } from 'vitest';

import { loadPublicApi } from '../test/public-api';
import { REMOVAL_VERSION, REMOVED_EXPORTS, REMOVED_PROPS } from './deprecations';
import * as root from '.';

/* =============================================================================
   CE QUE LA 4.0.0 A RETIRÉ N'EST PLUS LÀ.

   `REMOVED_PROPS` et `REMOVED_EXPORTS` sont la liste figée des noms dépréciés
   de la 2.x. Pour chacun, la surface publique est lue par le compilateur : la
   prop ne doit plus exister sur le type public de son composant, l'export ne
   doit plus sortir de `src/opale/index.ts`. Un nom qui revient — par un
   `Omit` oublié, un réexport, un alias — fait rougir la suite.
   ========================================================================== */

const TIMEOUT = 60_000;

/** Le type public qui porte les props d'un composant (ou d'un appel). */
const PROPS_TYPE: Readonly<Record<string, string>> = {
  showToast: 'ToastDefinition',
  'Sidebar.useSidebar': 'SidebarContextValue',
};
const propsTypeOf = (component: string) => PROPS_TYPE[component] ?? `${component}Props`;

describe(`les noms retirés en ${REMOVAL_VERSION}`, () => {
  it('tient une liste complète et sans doublon', () => {
    expect(REMOVED_PROPS).toHaveLength(37);
    expect(REMOVED_PROPS.map((entry) => entry.component)).toContain('Sidebar.useSidebar');
    expect(REMOVED_EXPORTS).toHaveLength(8);
    const pairs = REMOVED_PROPS.map((entry) => `${entry.component}.${entry.prop}`);
    expect(pairs.filter((pair, index) => pairs.indexOf(pair) !== index)).toEqual([]);
    expect(Object.isFrozen(REMOVED_PROPS)).toBe(true);
    expect(Object.isFrozen(REMOVED_EXPORTS)).toBe(true);
  });

  it(
    'ne laisse aucune prop retirée sur le type public de son composant',
    () => {
      const api = loadPublicApi();
      const survivors = REMOVED_PROPS.flatMap((entry) => {
        const props = api.propsOfType(propsTypeOf(entry.component));
        if (!props) return [`${propsTypeOf(entry.component)} n’est plus exporté`];
        return props.some((prop) => prop.name === entry.prop)
          ? [`${entry.component}.${entry.prop}`]
          : [];
      });
      expect(survivors).toEqual([]);
    },
    TIMEOUT,
  );

  it(
    'ne publie plus aucun export retiré',
    () => {
      const api = loadPublicApi();
      const survivors = REMOVED_EXPORTS.filter((entry) => {
        const [owner, member] = entry.name.split('.');
        if (!member) return api.exportNames.includes(owner);
        return member in (root as unknown as Record<string, object>)[owner];
      });
      expect(survivors.map((entry) => entry.name)).toEqual([]);
    },
    TIMEOUT,
  );
});
