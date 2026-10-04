import { describe, expect, it } from 'vitest';

import { loadPublicApi } from '../../test/public-api';

/* =============================================================================
   LES RÉGLAGES DU VERRE, LES MÊMES D'UN COMPOSANT À L'AUTRE.

   Ce qui reste public : `liquidGlass` choisit la matière, `rootClassName` et
   `rootStyle` atteignent l'enveloppe qui porte la silhouette, et
   `enableLiquidAnimation` règle l'onde là où le composant en fait naître une
   (ouverture d'une modale, arrivée d'un toast, clic dans le champ).

   Ce qui est interne au matériau a quitté la surface publique en 4.0.0 :
   l'onde programmée (`triggerAnimation`), l'onde au clic sur une SURFACE
   (`enableLiquidAnimation` d'une barre, d'un rail, d'un bandeau d'onglets),
   la balise du contenu (`as`), le rebond forcé (`pressFeedback`) et l'ancien
   nom `enableClickAnimation`.
   ========================================================================== */

const TIMEOUT = 60_000;

interface Expected {
  readonly removed: readonly string[];
  readonly deprecated: readonly string[];
  readonly public: readonly string[];
}

const EXPECTED: Record<string, Expected> = {
  ModalProps: {
    removed: ['triggerAnimation', 'as', 'pressFeedback'],
    deprecated: [],
    public: ['liquidGlass', 'rootClassName', 'rootStyle', 'enableLiquidAnimation'],
  },
  TabsProps: {
    removed: ['triggerAnimation', 'enableLiquidAnimation', 'as', 'pressFeedback'],
    deprecated: [],
    public: ['liquidGlass', 'rootClassName', 'rootStyle'],
  },
  TopbarProps: {
    removed: ['triggerAnimation', 'enableLiquidAnimation'],
    deprecated: [],
    public: ['liquidGlass', 'rootClassName', 'rootStyle'],
  },
  SidebarProps: {
    removed: ['triggerAnimation', 'enableLiquidAnimation'],
    deprecated: [],
    public: ['liquidGlass', 'rootClassName', 'rootStyle'],
  },
  SearchBarProps: {
    removed: ['enableClickAnimation'],
    deprecated: [],
    public: ['liquidGlass', 'enableLiquidAnimation'],
  },
  ToastProviderProps: {
    removed: [],
    deprecated: [],
    public: ['liquidGlass', 'enableLiquidAnimation'],
  },
};

const ROWS = Object.entries(EXPECTED).flatMap(([type, { deprecated, public: kept }]) => [
  ...deprecated.map((prop) => ({ typeName: type, prop, deprecated: true })),
  ...kept.map((prop) => ({ typeName: type, prop, deprecated: false })),
]);

const REMOVED_ROWS = Object.entries(EXPECTED).flatMap(([type, { removed }]) =>
  removed.map((prop) => ({ typeName: type, prop })),
);

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

  it.each(REMOVED_ROWS)(
    '$typeName.$prop n’existe plus',
    ({ typeName, prop }) => {
      const props = loadPublicApi().propsOfType(typeName);
      expect(props, `${typeName} n’est plus exporté`).toBeDefined();
      expect(props?.map((candidate) => candidate.name)).not.toContain(prop);
    },
    TIMEOUT,
  );
});
