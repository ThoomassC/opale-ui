import source from '@svg-maps/france.departments';

import type { SvgMapRegion } from '../../../../magic';

/* =============================================================================
   LES DÉPARTEMENTS FRANÇAIS, POUR LA DÉMONSTRATION SEULEMENT.

   Tracés : svg-maps de Victor Cazanave, sous licence CC-BY-4.0. Ils ne font pas
   partie de la librairie — le paquet est une dépendance de développement,
   chargé avec cette seule page. La carte des régions du même auteur est sous
   licence non commerciale : elle n'est volontairement pas utilisée.

   LE TYPE EST ÉCRIT ICI. La déclaration du paquet importe un module de types
   qu'il ne publie pas, si bien que ses données arrivent sans type : on les
   décrit, puis on les convertit une fois pour toutes en régions d'Opale.
   ========================================================================== */
interface SvgMapsSource {
  readonly viewBox: string;
  readonly locations: readonly {
    readonly id: string;
    readonly name: string;
    readonly path: string;
  }[];
}

const map = source as unknown as SvgMapsSource;

export const FRANCE_VIEWBOX = map.viewBox;

export const FRANCE_DEPARTMENTS: readonly SvgMapRegion[] = map.locations.map((location) => ({
  id: location.id,
  path: location.path,
  name: `${location.name} (${location.id})`,
}));

/** Les huit départements d'Île-de-France, illisibles à la vue d'ensemble. */
export const ILE_DE_FRANCE = ['75', '77', '78', '91', '92', '93', '94', '95'] as const;

export const CORSE = ['2A', '2B'] as const;
