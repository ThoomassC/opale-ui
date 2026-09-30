import { useState } from 'react';

import { pathBounds, type Bounds } from './path-bounds';

/** Ce que le calcul des boîtes lit d'une région : son identifiant et son tracé. */
export interface RegionShape {
  readonly id: string;
  readonly path: string;
}

interface BoundsSnapshot {
  readonly regions: readonly RegionShape[];
  readonly bounds: ReadonlyMap<string, Bounds>;
}

/** Deux listes décrivent-elles les mêmes formes, dans le même ordre ? */
function sameShapes(a: readonly RegionShape[], b: readonly RegionShape[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((region, index) => region.id === b[index].id && region.path === b[index].path);
}

/**
 * Les boîtes des régions, relues depuis leurs tracés.
 *
 * UN TRACÉ ILLISIBLE N'EMPORTE PAS LA CARTE : la région n'a pas de boîte, le
 * cadrage l'ignore au lieu de faire tomber la page.
 *
 * LA RELECTURE D'UN TRACÉ INCHANGÉ EST ÉVITÉE : une région dont l'identifiant
 * et le tracé sont ceux du calcul précédent reprend sa boîte telle quelle.
 */
function computeBounds(
  regions: readonly RegionShape[],
  previous: BoundsSnapshot | undefined,
): ReadonlyMap<string, Bounds> {
  const known = new Map<string, string>();
  for (const region of previous?.regions ?? []) known.set(region.id, region.path);

  const map = new Map<string, Bounds>();
  for (const region of regions) {
    const kept = known.get(region.id) === region.path ? previous?.bounds.get(region.id) : undefined;
    if (kept) {
      map.set(region.id, kept);
      continue;
    }
    try {
      map.set(region.id, pathBounds(region.path));
    } catch {
      /* Région sans boîte : voir ci-dessus. */
    }
  }
  return map;
}

/**
 * Les boîtes des régions d'une carte, stables tant que leur CONTENU l'est.
 *
 * POURQUOI PAS `useMemo(…, [regions])`. La dépendance est l'identité du
 * tableau, et l'appelant en donne souvent un nouveau à chaque rendu —
 * `regions={items.map(…)}` : la carte relisait alors tous ses tracés à chaque
 * survol. Ici la comparaison porte sur les identifiants et les tracés ; à
 * contenu égal, la table rendue est LA MÊME, ce qui évite aussi de réinscrire
 * les régions auprès de la vue.
 *
 * L'ÉTAT EST AJUSTÉ PENDANT LE RENDU, et c'est le motif prévu par React pour
 * « dériver d'une prop qui change » : pas d'effet, donc pas de rendu intermédiaire
 * avec des boîtes périmées. La comparaison est un parcours à égalité de
 * chaînes — les mêmes chaînes d'un rendu à l'autre, donc comparées par
 * référence dans le cas courant.
 */
export function useRegionBounds(regions: readonly RegionShape[]): ReadonlyMap<string, Bounds> {
  const [snapshot, setSnapshot] = useState<BoundsSnapshot>(() => ({
    regions,
    bounds: computeBounds(regions, undefined),
  }));

  if (sameShapes(snapshot.regions, regions)) return snapshot.bounds;

  const next: BoundsSnapshot = { regions, bounds: computeBounds(regions, snapshot) };
  setSnapshot(next);
  return next.bounds;
}
