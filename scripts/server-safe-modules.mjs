/* =============================================================================
   LES MODULES LIVRÉS SANS "use client", NOMMÉS UN PAR UN.

   La directive fait d'un module une frontière client : pour un Server
   Component, chacun de ses exports devient une référence opaque. C'est ce
   qu'il faut à un composant — et c'est faux pour une donnée. Posée sur
   `icons.js`, elle rendait `ICON_NAMES.length` égal à 0 côté serveur ; posée
   sur `cookie-consent.js`, elle faisait de `COOKIE_CONSENT_KEY` une fonction
   qui lève.

   D'OÙ UNE LISTE BLANCHE, ET NON UNE DÉTECTION. Un module oublié ici garde la
   directive : c'est l'erreur sûre, un composant ne casse jamais faute d'elle.
   Deux familles, deux règles, tenues par `server-safe-modules.structure.test.ts`
   et par `check-dist.mjs` sur le build :
   - les BARILS réexportent : ils importent des modules client, et c'est ce qui
     transmet leurs références au serveur ; ils n'appellent jamais React ;
   - les modules de DONNÉES n'importent ni React ni un module client : rien de
     ce qu'ils exportent ne doit devenir une référence.

   Chemins relatifs à `dist/opale`, sans extension — ceux du build
   `preserveModules`, qui reprend l'arborescence de `src/opale`.
   ========================================================================== */

/* `opale` n'y figure plus : depuis le retrait d'`OPALE_CATALOG` (4.0.0), il ne
   fait que réexporter, et le build le fond dans `index` sans l'émettre. */
/** Les barils : réexports, sans code client propre. */
export const SERVER_SAFE_BARRELS = Object.freeze(['index', 'opale-namespace']);

/** Les modules de pure donnée : ni React, ni import d'un module client. */
export const SERVER_SAFE_DATA_MODULES = Object.freeze([
  'catalog/cookie-consent',
  'components/icon/glyphs',
  'components/icon/icons',
  'components/world-map/basemap',
  'theme/theme-script',
]);

/** Tous les modules livrés sans directive. */
export const SERVER_SAFE_MODULES = Object.freeze([
  ...SERVER_SAFE_BARRELS,
  ...SERVER_SAFE_DATA_MODULES,
]);

/** Vrai si le fichier émis `fileName` (relatif à `dist/opale`) se livre sans directive. */
export function isServerSafeModule(fileName) {
  const normalized = fileName.replaceAll('\\', '/').replace(/\.js$/, '');
  return SERVER_SAFE_MODULES.includes(normalized);
}
