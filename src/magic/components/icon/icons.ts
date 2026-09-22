/* =============================================================================
   LE JEU D'ICÔNES D'OPALE.

   POURQUOI IL EXISTE. `Icon` ne savait rendre qu'un CARACTÈRE : on lui passait
   « ✦ », « ⌘ », « ✓ ». Trois problèmes, et aucun n'est cosmétique.
   D'abord un glyphe dépend de la police installée — le même appel ne dessine
   pas la même chose sur deux machines, et sur certaines il dessine un carré
   vide. Ensuite sa graisse et son alignement sont ceux de la police, donc rien
   ne s'accorde avec le reste de l'interface. Enfin le choix se limitait à ce
   qu'Unicode veut bien avoir normalisé : pas de « filtre », pas de « valise »,
   pas de « carte ». D'où ce jeu, dessiné ici.

   AUCUNE LIBRAIRIE EXTERNE, et c'est une contrainte du dépôt, pas une
   préférence. Ce fichier ne contient que des données de chemin SVG.

   LA GRILLE EST 24×24, LE TRAIT EST LE MÊME PARTOUT. Toutes les icônes sont
   des CONTOURS — `fill: none`, `stroke: currentColor` — d'épaisseur 1,75 avec
   des extrémités et des jointures rondes. C'est ce qui fait qu'une rangée
   d'icônes se lit comme une famille et non comme une collection : une seule
   icône pleine au milieu de contours saute aux yeux comme une faute. La marge
   visuelle est de 2 unités ; rien ne touche le bord, sans quoi deux icônes
   côte à côte se collent.

   L'ÉPAISSEUR NE SE MET PAS À L'ÉCHELLE AVEC LA TAILLE, volontairement :
   `vector-effect` est laissé de côté et le `stroke-width` est exprimé dans le
   repère 24×24. Une icône grossie garde donc un trait proportionnellement
   identique, ce qui est le comportement attendu d'un dessin, pas d'un texte.
   ========================================================================== */

/**
 * Un cercle écrit en commandes d'arc.
 *
 * POURQUOI PAS `<circle>` : le jeu n'expose qu'UNE forme de donnée, une liste
 * de `d`. Autoriser un second type d'élément obligerait chaque consommateur —
 * le composant, la vitrine, un futur export SVG — à traiter deux cas. Deux
 * arcs de 180° dessinent exactement le même cercle.
 */
function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
}

/** Un point plein, pour les icônes qui en comptent trois. */
function dot(cx: number, cy: number): string {
  return circle(cx, cy, 1.1);
}

/* =============================================================================
   LE CATALOGUE.

   L'ORDRE DES CLÉS EST L'ORDRE D'AFFICHAGE de la page « Icônes », et les
   familles sont séparées par les commentaires ci-dessous. `ICON_GROUPS`, plus
   bas, reprend ces familles pour la vitrine ; les deux sont tenus ensemble par
   un garde, parce qu'une icône ajoutée ici et oubliée là serait invisible.
   ========================================================================== */
export const OPALE_ICONS = {
  /* --- Navigation ------------------------------------------------------- */
  'arrow-up': ['M12 20V4', 'M5 11l7-7 7 7'],
  'arrow-down': ['M12 4v16', 'M19 13l-7 7-7-7'],
  'arrow-left': ['M20 12H4', 'M11 19l-7-7 7-7'],
  'arrow-right': ['M4 12h16', 'M13 5l7 7-7 7'],
  'chevron-up': ['M5 15l7-7 7 7'],
  'chevron-down': ['M5 9l7 7 7-7'],
  'chevron-left': ['M15 5l-7 7 7 7'],
  'chevron-right': ['M9 5l7 7-7 7'],
  'chevrons-left': ['M13 6l-6 6 6 6', 'M19 6l-6 6 6 6'],
  'chevrons-right': ['M11 6l6 6-6 6', 'M5 6l6 6-6 6'],
  'corner-turn': ['M4 8h9a4 4 0 0 1 4 4v8', 'M8 4L4 8l4 4'],
  home: ['M3 11l9-7.5L21 11', 'M5.5 9.6V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.6', 'M10 20v-5.5h4V20'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  'external-link': ['M14 4h6v6', 'M20 4l-8.5 8.5', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  'more-horizontal': [dot(5.5, 12), dot(12, 12), dot(18.5, 12)],
  'more-vertical': [dot(12, 5.5), dot(12, 12), dot(12, 18.5)],

  /* --- Actions ---------------------------------------------------------- */
  plus: ['M12 4v16', 'M4 12h16'],
  minus: ['M4 12h16'],
  check: ['M4.5 12.5l5 5L19.5 7'],
  search: [circle(11, 11, 6.2), 'M15.6 15.6L20 20'],
  edit: ['M4.5 19.5l4.2-.9L19.3 8.2a2.1 2.1 0 0 0-3-3L5.4 15.3l-.9 4.2z', 'M14.8 6.7l3 3'],
  trash: ['M4 7h16', 'M9.5 7V5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7', 'M6.5 7l.9 12.1a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9L17.5 7'],
  copy: ['M10 8h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', 'M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1'],
  download: ['M12 3.5v11.5', 'M7 10.5l5 5 5-5', 'M4 20.5h16'],
  upload: ['M12 20.5V9', 'M7 13.5l5-5 5 5', 'M4 3.5h16'],
  refresh: ['M20.2 12a8.2 8.2 0 1 1-2.5-5.9', 'M20.5 3.8v5h-5'],
  filter: ['M3.5 5h17l-6.6 7.6V19l-3.8 2v-9.4z'],
  sort: ['M7 4.5v15', 'M3.8 16.2L7 19.5l3.2-3.3', 'M17 19.5v-15', 'M13.8 7.8L17 4.5l3.2 3.3'],
  share: [circle(6, 12, 2.2), circle(18, 6.5, 2.2), circle(18, 17.5, 2.2), 'M8 10.9l8-3.3', 'M8 13.1l8 3.3'],
  save: ['M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z', 'M8 4v5h7V4', 'M8 20.5V14h8v6.5'],
  print: ['M7 9.5V4h10v5.5', 'M7 18H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2', 'M7 14.5h10V21H7z'],
  settings: ['M4 8h4.5', 'M12.5 8H20', 'M4 16h8.5', 'M16.5 16H20', circle(10.5, 8, 2.2), circle(14.5, 16, 2.2)],
  'drag-handle': [dot(9.5, 6.5), dot(14.5, 6.5), dot(9.5, 12), dot(14.5, 12), dot(9.5, 17.5), dot(14.5, 17.5)],

  /* --- Fichiers --------------------------------------------------------- */
  file: ['M13.5 3.5H7a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8z', 'M13.5 3.5V8H18'],
  'file-text': ['M13.5 3.5H7a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8z', 'M13.5 3.5V8H18', 'M9 12.5h6', 'M9 16h4'],
  folder: ['M3.5 6.5a1 1 0 0 1 1-1h4.3l2 2.5h7.7a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1z'],
  'folder-open': ['M3.5 18.5V6.5a1 1 0 0 1 1-1h4.3l2 2.5h7.7a1 1 0 0 1 1 1v1.5', 'M3.5 18.5l2.4-7h15.1l-2.4 7z'],
  image: ['M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', circle(9, 10, 1.7), 'M3.5 17l4.5-4.5 3.5 3.5 3-3 6 6'],
  paperclip: ['M19 11.5l-7.3 7.3a4.3 4.3 0 0 1-6.1-6.1l8-8a2.9 2.9 0 0 1 4.1 4.1l-8 8a1.5 1.5 0 0 1-2.1-2.1l7.3-7.3'],
  archive: ['M3.5 4.5h17v4h-17z', 'M5 8.5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-10', 'M10 12.5h4'],
  clipboard: ['M9 4.5H7a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-14a1 1 0 0 0-1-1h-2', 'M9 3h6v3.5H9z'],
  book: ['M4 4.5h6a3 3 0 0 1 2 5.2V20a3 3 0 0 0-2-.8H4z', 'M20 4.5h-6a3 3 0 0 0-2 5.2V20a3 3 0 0 1 2-.8h6z'],
  layers: ['M12 3.5l8.5 4.6L12 12.7 3.5 8.1z', 'M3.5 12.5L12 17l8.5-4.5', 'M3.5 16.5L12 21l8.5-4.5'],

  /* --- Communication ---------------------------------------------------- */
  mail: ['M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z', 'M3.4 6.6L12 12.8l8.6-6.2'],
  send: ['M21 3.5L10.5 14', 'M21 3.5l-6.8 17-3.7-6.5-6.5-3.7z'],
  chat: ['M20.5 12.8c0 3.7-3.8 6.7-8.5 6.7a10 10 0 0 1-2.6-.3L4 21l1.4-4.1a6.3 6.3 0 0 1-1.9-4.1c0-3.7 3.8-6.7 8.5-6.7s8.5 3 8.5 6.7z'],
  bell: ['M18 16.5V11a6 6 0 1 0-12 0v5.5L4.5 19h15z', 'M10 19a2 2 0 0 0 4 0'],
  'bell-off': ['M18 16.5V11a6 6 0 0 0-8.4-5.5', 'M6.2 8.5A6 6 0 0 0 6 11v5.5L4.5 19h12.6', 'M10 19a2 2 0 0 0 4 0', 'M4 3.5l16 17'],
  phone: ['M8.2 4.5l2.3 3.6-2 2a12.5 12.5 0 0 0 5.4 5.4l2-2 3.6 2.3-1 3a1.6 1.6 0 0 1-1.7.9C10.6 18.9 5.1 13.4 4.3 6.2a1.6 1.6 0 0 1 .9-1.7z'],
  'at-sign': [circle(12, 12, 3.6), 'M15.6 8.4v5a2.9 2.9 0 0 0 5.2 1.7A9.4 9.4 0 1 0 17 20.4'],
  megaphone: ['M4 10v4a1 1 0 0 0 1 1h3l8 4.5V5.5L8 10H5a1 1 0 0 0-1 1z', 'M19 9.5a4 4 0 0 1 0 5', 'M6.5 15v4.5h3'],

  /* --- Utilisateurs ----------------------------------------------------- */
  user: [circle(12, 8.3, 3.8), 'M4.8 20.2a7.5 7.5 0 0 1 14.4 0'],
  users: [circle(9.5, 8.3, 3.4), 'M3 20.2a6.8 6.8 0 0 1 13 0', 'M16.2 5.3a3.4 3.4 0 0 1 0 6.6', 'M18 14.6a6.4 6.4 0 0 1 3 5.6'],
  'user-plus': [circle(10, 8.3, 3.8), 'M3 20.2a7.3 7.3 0 0 1 12.6-5', 'M18.5 14.5v6', 'M15.5 17.5h6'],
  lock: ['M5.5 10.5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z', 'M8 10.5V8a4 4 0 0 1 8 0v2.5', 'M12 14.5v3'],
  unlock: ['M5.5 10.5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z', 'M8 10.5V8a4 4 0 0 1 7.6-1.7', 'M12 14.5v3'],
  key: [circle(8, 15.5, 3.8), 'M10.7 12.8L20 3.5', 'M16.5 7l2.5 2.5', 'M14 9.5l2.5 2.5'],
  'shield-check': ['M12 3.2l7.5 2.8v6c0 4.4-3 8.2-7.5 9.8-4.5-1.6-7.5-5.4-7.5-9.8v-6z', 'M8.8 12l2.3 2.3 4.1-4.6'],

  /* --- État ------------------------------------------------------------- */
  info: [circle(12, 12, 8.5), 'M12 11v5.5', 'M12 7.8v.6'],
  'alert-triangle': ['M12 3.8L21 19.8H3z', 'M12 10v4.2', 'M12 17.2v.6'],
  'alert-circle': [circle(12, 12, 8.5), 'M12 7.5v5.5', 'M12 16.2v.6'],
  'check-circle': [circle(12, 12, 8.5), 'M8.2 12.2l2.7 2.7 5-5.4'],
  'x-circle': [circle(12, 12, 8.5), 'M9.2 9.2l5.6 5.6', 'M14.8 9.2l-5.6 5.6'],
  'help-circle': [circle(12, 12, 8.5), 'M9.6 9.4a2.5 2.5 0 1 1 2.9 3v1.5', 'M12.5 16.8v.6'],
  star: ['M12 3.6l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9z'],
  heart: ['M12 20.3l-7.1-7a4.4 4.4 0 0 1 7.1-5 4.4 4.4 0 0 1 7.1 5z'],
  bookmark: ['M6.5 3.8h11a1 1 0 0 1 1 1v15.4L12 16.3l-6.5 3.9V4.8a1 1 0 0 1 1-1z'],
  flag: ['M5.5 21V3.8', 'M5.5 4.6h11.9l-2.1 4 2.1 4H5.5z'],
  ban: [circle(12, 12, 8.5), 'M6 6l12 12'],

  /* --- Média ------------------------------------------------------------ */
  play: ['M8 4.8l11 7.2-11 7.2z'],
  pause: ['M9 4.8v14.4', 'M15 4.8v14.4'],
  stop: ['M5.5 5.5h13a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z'],
  'skip-back': ['M19 5l-10 7 10 7z', 'M5.5 4.8v14.4'],
  'skip-forward': ['M5 5l10 7-10 7z', 'M18.5 4.8v14.4'],
  volume: ['M4 9.5h3.5L12.5 5v14L7.5 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z', 'M16 9.2a4 4 0 0 1 0 5.6', 'M18.6 6.6a7.6 7.6 0 0 1 0 10.8'],
  'volume-off': ['M4 9.5h3.5L12.5 5v14L7.5 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z', 'M16.5 10l4.5 4', 'M21 10l-4.5 4'],
  camera: ['M4 7.5h3.5L9 5h6l1.5 2.5H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z', circle(12, 13, 3.4)],
  mic: ['M12 3.5a2.6 2.6 0 0 1 2.6 2.6v5.4a2.6 2.6 0 0 1-5.2 0V6.1A2.6 2.6 0 0 1 12 3.5z', 'M6.5 11a5.5 5.5 0 0 0 11 0', 'M12 16.5v4', 'M9 20.5h6'],

  /* --- Temps ------------------------------------------------------------ */
  clock: [circle(12, 12, 8.5), 'M12 7v5.3l3.4 2'],
  calendar: ['M4.5 5.5h15a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z', 'M3.5 9.8h17', 'M8 3.5V7', 'M16 3.5V7'],
  history: ['M3.8 12a8.2 8.2 0 1 0 2.5-5.9', 'M3.5 3.8v5h5', 'M12 7.5v5l3.4 2'],
  hourglass: ['M6.5 3.8h11', 'M6.5 20.2h11', 'M7.5 3.8v3.4L12 12l4.5-4.8V3.8', 'M7.5 20.2v-3.4L12 12l4.5 4.8v3.4'],
  timer: ['M9.5 3h5', circle(12, 13.5, 7.3), 'M12 9.8v3.7l2.5 1.6'],

  /* --- Voyage ----------------------------------------------------------- */
  map: ['M3.5 6.6L9 4.5v12.9l-5.5 2.1z', 'M9 4.5l6 2.1v12.9L9 17.4z', 'M15 6.6l5.5-2.1v12.9L15 19.5z'],
  'map-pin': ['M12 21c4-4.4 6-7.7 6-10a6 6 0 1 0-12 0c0 2.3 2 5.6 6 10z', circle(12, 10.8, 2.4)],
  compass: [circle(12, 12, 8.5), 'M15.4 8.6l-1.8 5-5 1.8 1.8-5z'],
  plane: ['M10.2 3.6a1.6 1.6 0 0 1 3.1 0l1 6.6 5.9 3.3v2.2l-6.2-1.7-.6 3.8 2.1 1.7v1.2L12 19.6l-3.5 1.1v-1.2l2.1-1.7-.6-3.8L3.8 15.7v-2.2l5.9-3.3z'],
  train: ['M7 3.8h10a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2z', 'M5.5 9.4h13', 'M7.5 20.4l2-4.2', 'M16.5 20.4l-2-4.2', dot(8.8, 13), dot(15.2, 13)],
  car: ['M4.5 15.8h15', 'M6 15.8l1.8-5.4a1.5 1.5 0 0 1 1.4-1h5.6a1.5 1.5 0 0 1 1.4 1l1.8 5.4', 'M4.5 15.8v3.4h2.8v-3.4', 'M16.7 15.8v3.4h2.8v-3.4', dot(7.8, 13.2), dot(16.2, 13.2)],
  bike: [circle(6, 16.5, 3.7), circle(18, 16.5, 3.7), 'M6 16.5l4-8h5', 'M10 8.5l4.5 8', 'M14 5.5h2.5l1.5 11'],
  boat: ['M3 15.5h18l-2.7 4.6a1 1 0 0 1-.9.5H6.6a1 1 0 0 1-.9-.5z', 'M12 15.5V3.2', 'M13.5 6l5 7.5h-5z', 'M10.5 8l-4 5.5h4z'],
  globe: [circle(12, 12, 8.5), 'M3.6 12h16.8', 'M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z'],
  luggage: ['M6 7.5h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1z', 'M9 7.5V4.8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7.5', 'M12 11v5', 'M8 19.5v1.2', 'M16 19.5v1.2'],
  ticket: ['M5 6.5h14a1 1 0 0 1 1 1v2.6a2 2 0 0 0 0 3.8v2.6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.6a2 2 0 0 0 0-3.8V7.5a1 1 0 0 1 1-1z', 'M14.5 6.8v10.4'],

  /* --- Météo ------------------------------------------------------------ */
  sun: [circle(12, 12, 4.2), 'M12 3v2', 'M12 19v2', 'M3 12h2', 'M19 12h2', 'M5.6 5.6l1.5 1.5', 'M16.9 16.9l1.5 1.5', 'M18.4 5.6l-1.5 1.5', 'M7.1 16.9l-1.5 1.5'],
  moon: ['M20 14.4A8.6 8.6 0 0 1 9.6 4a8.6 8.6 0 1 0 10.4 10.4z'],
  cloud: ['M7.2 18.5a4.2 4.2 0 0 1-.4-8.4 5.6 5.6 0 0 1 10.6 1.3 3.6 3.6 0 0 1-.6 7.1z'],
  rain: ['M7.2 15.5a4.2 4.2 0 0 1-.4-8.4 5.6 5.6 0 0 1 10.6 1.3 3.6 3.6 0 0 1-.6 7.1z', 'M8.5 18v2.5', 'M12 18.5v2.5', 'M15.5 18v2.5'],
  snow: ['M7.2 15.5a4.2 4.2 0 0 1-.4-8.4 5.6 5.6 0 0 1 10.6 1.3 3.6 3.6 0 0 1-.6 7.1z', 'M8.5 19v.6', 'M12 20v.6', 'M15.5 19v.6'],
  wind: ['M3.5 8.5h9a2.8 2.8 0 1 0-2.8-2.8', 'M3.5 12.5h13a2.8 2.8 0 1 1-2.8 2.8', 'M3.5 16.5h6'],

  /* --- Données ---------------------------------------------------------- */
  'chart-bar': ['M4 20h16', 'M7 20v-6', 'M12 20V7', 'M17 20v-9'],
  'chart-line': ['M4 20h16', 'M5 16.5l4.5-5 3.5 3 5.5-7', dot(9.5, 11.5), dot(13, 14.5)],
  'chart-pie': ['M12 3.6V12h8.4A8.4 8.4 0 0 0 12 3.6z', 'M20.2 14.3A8.5 8.5 0 1 1 9.7 3.8'],
  'trending-up': ['M3.5 17l6-6 3.5 3.5 7.5-7.5', 'M14.5 7h6v6'],
  'trending-down': ['M3.5 7l6 6 3.5-3.5L20.5 17', 'M14.5 17h6v-6'],
  grid: ['M4 4.5h6v6H4z', 'M14 4.5h6v6h-6z', 'M4 13.5h6v6H4z', 'M14 13.5h6v6h-6z'],
  list: ['M8.5 6.5h12', 'M8.5 12h12', 'M8.5 17.5h12', dot(4.5, 6.5), dot(4.5, 12), dot(4.5, 17.5)],
  table: ['M4 4.5h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z', 'M3.2 9.5h17.6', 'M3.2 14.5h17.6', 'M9.5 9.5v10'],

  /* --- Commerce --------------------------------------------------------- */
  'shopping-bag': ['M5.5 7.5h13l1 12.2a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1z', 'M8.8 10V6.9a3.2 3.2 0 0 1 6.4 0V10'],
  'shopping-cart': ['M3 4.5h2.4l2.5 10.4h9.6l2-7.4H6.3', circle(9.2, 19, 1.6), circle(16.8, 19, 1.6)],
  'credit-card': ['M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z', 'M3.2 10h17.6', 'M6.5 14.5h3.5'],
  tag: ['M11.4 3.5H20a.5.5 0 0 1 .5.5v8.6a1 1 0 0 1-.3.7l-7.6 7.6a1 1 0 0 1-1.4 0l-7.9-7.9a1 1 0 0 1 0-1.4l7.4-7.8a1 1 0 0 1 .7-.3z', dot(16.5, 7.5)],
  gift: ['M3.5 9.5h17v3.6h-17z', 'M5 13.1v6.4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6.4', 'M12 9.5v11', 'M12 9.5S9 9.5 8 8.5a2.2 2.2 0 0 1 3.1-3.1c.9 1 .9 4.1.9 4.1z', 'M12 9.5s3 0 4-1a2.2 2.2 0 0 0-3.1-3.1c-.9 1-.9 4.1-.9 4.1z'],
  wallet: ['M4 6.5h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z', 'M3.5 7.2V5.6a1 1 0 0 1 1.2-1l11.3 1.9', 'M15 11.5h6v4.5h-6a2.25 2.25 0 0 1 0-4.5z'],

  /* --- Divers ----------------------------------------------------------- */
  eye: ['M2.8 12S6.6 6 12 6s9.2 6 9.2 6-3.8 6-9.2 6-9.2-6-9.2-6z', circle(12, 12, 2.9)],
  'eye-off': ['M9.5 6.4A8.6 8.6 0 0 1 12 6c5.4 0 9.2 6 9.2 6a16 16 0 0 1-3 3.5', 'M6.1 8.1A16.6 16.6 0 0 0 2.8 12s3.8 6 9.2 6a8.4 8.4 0 0 0 3.3-.7', 'M4 3.5l16 17', 'M10.1 10.2a2.9 2.9 0 0 0 3.9 4'],
  'zoom-in': [circle(11, 11, 6.2), 'M15.6 15.6L20 20', 'M11 8.5v5', 'M8.5 11h5'],
  'zoom-out': [circle(11, 11, 6.2), 'M15.6 15.6L20 20', 'M8.5 11h5'],
  link: ['M10.2 13.8a3.8 3.8 0 0 0 5.4 0l2.9-2.9a3.8 3.8 0 0 0-5.4-5.4l-1.5 1.5', 'M13.8 10.2a3.8 3.8 0 0 0-5.4 0l-2.9 2.9a3.8 3.8 0 0 0 5.4 5.4l1.5-1.5'],
  code: ['M8.5 8L4 12l4.5 4', 'M15.5 8l4.5 4-4.5 4', 'M13.6 4.5l-3.2 15'],
  terminal: ['M3.5 4.5h17a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z', 'M6.5 9.5l3 2.5-3 2.5', 'M12.5 15h5'],
  sparkle: ['M12 3.2l1.9 5.4 5.4 1.9-5.4 1.9-1.9 5.4-1.9-5.4-5.4-1.9 5.4-1.9z', 'M18.5 16.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z'],
  palette: ['M12 20.5a8.5 8.5 0 1 1 8.5-8.5c0 2-1.6 2.6-3.2 2.6h-1.5a2 2 0 0 0-1.4 3.4 1.7 1.7 0 0 1-1.2 2.5 8.7 8.7 0 0 1-1.2 0z', dot(8.2, 10.2), dot(12, 7.6), dot(15.8, 10.2)],
  power: ['M12 3.5v8', 'M6.8 6.6a7.6 7.6 0 1 0 10.4 0'],
} as const satisfies Record<string, readonly string[]>;

export type OpaleIconName = keyof typeof OPALE_ICONS;

/** Les noms, dans l'ordre du catalogue. */
export const ICON_NAMES = Object.keys(OPALE_ICONS) as readonly OpaleIconName[];

/**
 * Le nom est-il celui d'une icône du jeu ?
 *
 * `Object.hasOwn` ET NON `in` : `in` remonte la chaîne de prototypes, donc
 * `'constructor' in OPALE_ICONS` vaut `true`. Le prédicat mentait alors sur un
 * type — `value is OpaleIconName` — et `IconGlyph` allait chercher
 * `OPALE_ICONS['constructor'].map`, qui n'est pas une fonction : `TypeError`
 * non rattrapé, donc démontage de tout le sous-arbre React. Ce n'est pas
 * théorique : cette fonction est exportée par le barril, donc offerte comme
 * validateur d'un nom venant d'ailleurs — d'un CMS, d'une API —, et un
 * validateur qui accepte `__proto__` est un défaut de frontière.
 */
export function isOpaleIconName(value: unknown): value is OpaleIconName {
  return typeof value === 'string' && Object.hasOwn(OPALE_ICONS, value);
}

/* =============================================================================
   LES FAMILLES, POUR LA PAGE « ICÔNES ».

   Un jeu de cette taille présenté en une seule grille ne se parcourt pas : on
   cherche « quelque chose comme une valise » et on relit cent dessins. Les
   familles sont donc une donnée du jeu, pas une mise en page de la vitrine —
   sans quoi une icône ajoutée ici serait publiée sans jamais s'afficher.
   `icons.test.ts` tient les deux ensemble.
   ========================================================================== */
export interface IconGroup {
  readonly label: string;
  readonly names: readonly OpaleIconName[];
}

export const ICON_GROUPS: readonly IconGroup[] = [
  {
    label: 'Navigation',
    names: ['arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'chevron-up', 'chevron-down', 'chevron-left', 'chevron-right', 'chevrons-left', 'chevrons-right', 'corner-turn', 'home', 'menu', 'close', 'external-link', 'more-horizontal', 'more-vertical'],
  },
  {
    label: 'Actions',
    names: ['plus', 'minus', 'check', 'search', 'edit', 'trash', 'copy', 'download', 'upload', 'refresh', 'filter', 'sort', 'share', 'save', 'print', 'settings', 'drag-handle'],
  },
  {
    label: 'Fichiers',
    names: ['file', 'file-text', 'folder', 'folder-open', 'image', 'paperclip', 'archive', 'clipboard', 'book', 'layers'],
  },
  {
    label: 'Communication',
    names: ['mail', 'send', 'chat', 'bell', 'bell-off', 'phone', 'at-sign', 'megaphone'],
  },
  {
    label: 'Utilisateurs et sécurité',
    names: ['user', 'users', 'user-plus', 'lock', 'unlock', 'key', 'shield-check'],
  },
  {
    label: 'État',
    names: ['info', 'alert-triangle', 'alert-circle', 'check-circle', 'x-circle', 'help-circle', 'star', 'heart', 'bookmark', 'flag', 'ban'],
  },
  {
    label: 'Média',
    names: ['play', 'pause', 'stop', 'skip-back', 'skip-forward', 'volume', 'volume-off', 'camera', 'mic'],
  },
  {
    label: 'Temps',
    names: ['clock', 'calendar', 'history', 'hourglass', 'timer'],
  },
  {
    label: 'Voyage',
    names: ['map', 'map-pin', 'compass', 'plane', 'train', 'car', 'bike', 'boat', 'globe', 'luggage', 'ticket'],
  },
  {
    label: 'Météo',
    names: ['sun', 'moon', 'cloud', 'rain', 'snow', 'wind'],
  },
  {
    label: 'Données',
    names: ['chart-bar', 'chart-line', 'chart-pie', 'trending-up', 'trending-down', 'grid', 'list', 'table'],
  },
  {
    label: 'Commerce',
    names: ['shopping-bag', 'shopping-cart', 'credit-card', 'tag', 'gift', 'wallet'],
  },
  {
    label: 'Divers',
    names: ['eye', 'eye-off', 'zoom-in', 'zoom-out', 'link', 'code', 'terminal', 'sparkle', 'palette', 'power'],
  },
];
