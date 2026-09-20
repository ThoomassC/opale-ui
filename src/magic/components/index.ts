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

/* SEPT AUTRES PORTES SE FERMENT POUR LA MÊME RAISON, ET LES SEPT FICHIERS
   RESTENT.

   LE BOUTON N'ÉTAIT PAS UN CAS ISOLÉ : `./card`, `./input`, `./checkbox`,
   `./select`, `./slider`, `./badge` et `./switch` avaient chacun leur jumeau
   côté Opale — `CanopCard`, `CanopInput`, `CanopCheckbox`, `CanopSelect`,
   `CanopSlider`, `CanopBadge` et `CanopToggle`. Sept fois le même nom pour
   deux composants, sept fois un sommaire qui affichait « Input » puis
   « Input » sans dire lequel prendre. `./switch` est le seul dont les deux
   noms diffèrent — Opale l'appelle `Toggle` — mais c'est le même doublon :
   deux interrupteurs publiés côte à côte.

   CHAQUE `CanopX` DÉLÈGUE DÉSORMAIS À SON VENDORÉ QUAND `liquidGlass` EST VRAI,
   exactement comme `CanopButton`. Le nom vendoré ne désignait donc plus un
   composant à choisir, mais une matière à activer : l'exposer une seconde fois
   ne laissait qu'un doute sur lequel des deux imports est le bon.

   LE MODULE DEMEURE, ET C'EST TOUT L'INTÉRÊT : il est le matériau derrière la
   prop. `canop.tsx` importe les sept par leur chemin direct, donc fermer le
   barril ne coupe rien — il enlève un nom public, pas une implémentation.

   CE QUI SE PERD VRAIMENT, ET IL FAUT LE SAVOIR : ces barrils publiaient aussi
   des TYPES — `BadgeProps`, `BadgeVariant`, `CardProps`, `InputProps`,
   `CheckboxProps`, `SliderProps`, `SwitchProps`, et tout `./Select`, dont
   `SelectOption`. Ils quittent la surface publique avec leurs composants. Rien
   dans le dépôt ne les importait plus hors des pages supprimées, mais un
   consommateur qui typait ses props avec eux devra passer par les types
   `CanopXProps`. `./toast` N'EST PAS DANS LA LISTE, et c'est délibéré : il
   publie `ToastProvider` et `useToast`, une file portaillée, là où
   `Opale.Toast` est une notification unitaire posée en ligne. Deux libellés
   identiques, deux mécanismes différents — voir la page « ToastProvider ». */
// export * from './card';
// export * from './input';
// export * from './switch';
// export * from './badge';
// export * from './checkbox';
// export * from './select';
// export * from './slider';

export * from './sidebar';
export * from './glass';
export * from './topbar';
export * from './modal';
export * from './toast';
export * from './tabs';
export * from './site-nav';
export * from './search-bar';
