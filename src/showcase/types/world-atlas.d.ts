/* LE JEU DE DONNÉES DU MONDE, DÉCLARÉ ICI ET NON PAR `resolveJsonModule`.
   Activer l'option pour la vitrine l'activerait aussi pour la librairie, qui
   hérite de la même configuration — voir `src/showcase/version.ts`. Un seul
   module JSON est importé : on le décrit, Vite l'importe. */
declare module 'world-atlas/countries-110m.json' {
  import type { GeometryCollection, Topology } from 'topojson-specification';

  const topology: Topology<{ countries: GeometryCollection<{ name: string }> }>;
  export default topology;
}
