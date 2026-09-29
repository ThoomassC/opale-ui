/* LES TRACÉS PRÉCALCULÉS DU MONDE, produits par `scripts/world-map.mjs`.
   Décrits ici plutôt que par `resolveJsonModule`, pour la même raison que
   `src/showcase/types/world-atlas.d.ts`. */
declare const worldPaths: readonly {
  /** Le rang de la forme dans le jeu 50m, Antarctique compris. */
  readonly index: number;
  /** Le code ISO 3166 numérique, ou `null` pour une forme sans code. */
  readonly numeric: string | null;
  /** Le nom anglais du jeu de données. */
  readonly name: string;
  /** Le tracé : `M` absolu par sous-chemin, puis `l` relatifs au dixième. */
  readonly d: string;
}[];

export default worldPaths;
