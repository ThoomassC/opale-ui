/* Vendored from react-magic-ui — MIT, Copyright (c) 2025 tweeedlex.
   https://github.com/tweeedlex/react-magic-ui
   Kept byte-faithful on purpose: this file is NOT covered by Opale's colour
   contract and is not styled with Opale's tokens. See src/magic/README.md. */

/* `./button` N'EST PLUS RÉEXPORTÉ, ET LE FICHIER RESTE.

   Le paquet publiait DEUX boutons : celui-ci, vendoré, qui passe par `<Glass>`,
   et `CanopButton`. Deux composants du même nom, dont l'un imitait l'autre en
   CSS. `CanopButton` délègue désormais au vendoré dès que `liquidGlass` est
   vrai — voir son en-tête —, donc le second nom public n'apportait plus qu'une
   ambiguïté : deux imports pour un seul concept.

   Le MODULE demeure : il est le matériau derrière la prop, et `Tabs` l'importe
   par son chemin direct. Seule la porte publique se ferme. */
// export * from './button';
export * from './card';
export * from './input';
export * from './switch';
export * from './sidebar';
export * from './glass';
export * from './topbar';
export * from './modal';
export * from './toast';
export * from './tabs';
export * from './badge';
export * from './checkbox';
export * from './select';
export * from './slider';
export * from './site-nav';
export * from './search-bar';
