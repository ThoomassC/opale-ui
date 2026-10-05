/**
 * La version publiée, affichée en tête de la barre de navigation.
 *
 * Recopiée à la main depuis `package.json`, et gardée par `version.test.ts` :
 * l'importer vraiment demanderait `resolveJsonModule` dans le tsconfig de
 * l'application — donc aussi dans celui de la librairie, qui en hérite — pour
 * un besoin qui n'existe que dans la vitrine. Une constante et un test qui
 * rougit à la moindre dérive coûtent moins qu'un interrupteur de compilation
 * ouvert sur le paquet publié.
 */
export const UI_VERSION = '4.0.0';
