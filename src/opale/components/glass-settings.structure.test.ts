import { describe, expect, it } from 'vitest';

import { loadPublicApi } from '../../test/public-api';

/* =============================================================================
   LES RÉGLAGES DU VERRE, LES MÊMES D'UN COMPOSANT À L'AUTRE.

   Ce qui reste public : `liquidGlass` choisit la matière, `rootClassName` et
   `rootStyle` atteignent l'enveloppe qui porte la silhouette, et
   `enableLiquidAnimation` règle l'onde là où le composant en fait naître une
   (ouverture d'une modale, arrivée d'un toast, clic dans le champ).

   Ce qui est interne au matériau reste accepté mais porte `@deprecated` :
   l'onde programmée (`triggerAnimation`), l'onde au clic sur une SURFACE
   (`enableLiquidAnimation` d'une barre, d'un rail, d'un bandeau d'onglets),
   la balise du contenu (`as`), le rebond forcé (`pressFeedback`) et l'ancien
   nom `enableClickAnimation`.
   ========================================================================== */

const TIMEOUT = 60_000;

const EXPECTED: Record<string, { deprecated: readonly string[]; public: readonly string[] }> = {
  ModalProps: {
    deprecated: ['triggerAnimation', 'as', 'pressFeedback'],
    public: ['liquidGlass', 'rootClassName', 'rootStyle', 'enableLiquidAnimation'],
  },
  TabsProps: {
    deprecated: ['triggerAnimation', 'enableLiquidAnimation', 'as', 'pressFeedback'],
    public: ['liquidGlass', 'rootClassName', 'rootStyle'],
  },
  TopbarProps: {
    deprecated: ['triggerAnimation', 'enableLiquidAnimation'],
    public: ['liquidGlass', 'rootClassName', 'rootStyle'],
  },
  SidebarProps: {
    deprecated: ['triggerAnimation', 'enableLiquidAnimation'],
    public: ['liquidGlass', 'rootClassName', 'rootStyle'],
  },
  SearchBarProps: {
    deprecated: ['enableClickAnimation'],
    public: ['liquidGlass', 'enableLiquidAnimation'],
  },
  ToastProviderProps: {
    deprecated: [],
    public: ['liquidGlass', 'enableLiquidAnimation'],
  },
};

const ROWS = Object.entries(EXPECTED).flatMap(([type, { deprecated, public: kept }]) => [
  ...deprecated.map((prop) => ({ typeName: type, prop, deprecated: true })),
  ...kept.map((prop) => ({ typeName: type, prop, deprecated: false })),
]);

describe('les réglages du verre', () => {
  it.each(ROWS)(
    '$typeName.$prop existe, dépréciée : $deprecated',
    ({ typeName, prop, deprecated }) => {
      const props = loadPublicApi().propsOfType(typeName) ?? [];
      const found = props.find((candidate) => candidate.name === prop);
      expect(found, `${typeName}.${prop} a disparu`).toBeDefined();
      expect(found?.deprecated).toBe(deprecated);
    },
    TIMEOUT,
  );
});
