/* =============================================================================
   LES TRACÉS QUE LES COMPOSANTS DESSINENT EUX-MÊMES.

   POURQUOI CE FICHIER EXISTE. La croix de `Modal`, celle d'une notification,
   l'étoile d'une note : ces composants n'ont besoin que d'UNE icône, toujours
   la même. Ils la demandaient pourtant par son nom, donc au catalogue entier —
   et une application qui n'importait qu'un `Modal` recevait les cent vingt
   dessins du jeu (≈ 11 ko minifiés) pour en afficher un seul.

   ICI, UN TRACÉ PAR CONSTANTE, et c'est ce qui rend le fichier élagable : un
   bundler garde la constante importée et écarte les autres. `icons.ts` reprend
   ces mêmes constantes pour son catalogue — une seule source par dessin,
   tenue par `glyphs.test.ts`.

   DES CHAÎNES LITTÉRALES, AUCUN APPEL. Le catalogue écrit ses cercles avec
   `circle()` ; ici le même tracé est recopié en clair. Un appel de fonction au
   niveau du module est, pour un bundler, un effet possible qu'il n'ose pas
   supprimer : la constante inutilisée resterait dans le paquet de
   l'application. Le test vérifie que chaque cercle recopié est bien celui que
   `circle()` aurait produit.

   PURE DONNÉE : ni React, ni import. Le module se livre donc sans
   "use client" (liste de `scripts/server-safe-modules.mjs`), comme `icons.ts`
   qui l'importe.
   ========================================================================== */

/** Les tracés d'une icône, dans le repère 24×24 du jeu. */
export type IconPathData = readonly string[];

/* --- Navigation --------------------------------------------------------- */
export const GLYPH_ARROW_UP = ['M12 20V4', 'M5 11l7-7 7 7'] as const;
export const GLYPH_ARROW_DOWN = ['M12 4v16', 'M19 13l-7 7-7-7'] as const;
export const GLYPH_ARROW_LEFT = ['M20 12H4', 'M11 19l-7-7 7-7'] as const;
export const GLYPH_ARROW_RIGHT = ['M4 12h16', 'M13 5l7 7-7 7'] as const;
export const GLYPH_CHEVRON_UP = ['M5 15l7-7 7 7'] as const;
export const GLYPH_CHEVRON_DOWN = ['M5 9l7 7 7-7'] as const;
export const GLYPH_CLOSE = ['M6 6l12 12', 'M18 6L6 18'] as const;
export const GLYPH_HOME = [
  'M3 11l9-7.5L21 11',
  'M5.5 9.6V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.6',
  'M10 20v-5.5h4V20',
] as const;

/* --- Actions ------------------------------------------------------------ */
export const GLYPH_SORT = [
  'M7 4.5v15',
  'M3.8 16.2L7 19.5l3.2-3.3',
  'M17 19.5v-15',
  'M13.8 7.8L17 4.5l3.2 3.3',
] as const;

/* --- Fichiers ----------------------------------------------------------- */
export const GLYPH_FILE = [
  'M13.5 3.5H7a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8z',
  'M13.5 3.5V8H18',
] as const;
export const GLYPH_ARCHIVE = [
  'M3.5 4.5h17v4h-17z',
  'M5 8.5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-10',
  'M10 12.5h4',
] as const;

/* --- État ----------------------------------------------------------------
   Le cercle de ces quatre icônes est `circle(12, 12, 8.5)`. */
export const GLYPH_INFO = [
  'M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0',
  'M12 11v5.5',
  'M12 7.8v.6',
] as const;
export const GLYPH_ALERT_TRIANGLE = ['M12 3.8L21 19.8H3z', 'M12 10v4.2', 'M12 17.2v.6'] as const;
export const GLYPH_CHECK_CIRCLE = [
  'M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0',
  'M8.2 12.2l2.7 2.7 5-5.4',
] as const;
export const GLYPH_X_CIRCLE = [
  'M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0',
  'M9.2 9.2l5.6 5.6',
  'M14.8 9.2l-5.6 5.6',
] as const;
/* --- Loupe ---------------------------------------------------------------- */
export const GLYPH_ZOOM_IN = [
  'M4.8 11a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0',
  'M15.6 15.6L20 20',
  'M11 8.5v5',
  'M8.5 11h5',
] as const;
export const GLYPH_ZOOM_OUT = [
  'M4.8 11a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0',
  'M15.6 15.6L20 20',
  'M8.5 11h5',
] as const;

export const GLYPH_STAR = [
  'M12 3.6l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9z',
] as const;
