import type { IconPathData } from './glyphs';

/**
 * Le dessin d'une icône à partir de ses tracés, sans enveloppe ni mise en forme.
 *
 * C'EST LE RENDEUR QUE LES COMPOSANTS EMPLOIENT POUR UNE ICÔNE FIXE — la croix
 * de `Modal`, l'étoile d'une note : `<IconPaths paths={GLYPH_CLOSE} />`. Il ne
 * connaît aucun nom, donc n'importe pas le catalogue, et un composant qui ne
 * dessine qu'une croix n'embarque qu'elle. `IconGlyph` en est la variante par
 * nom, pour les icônes choisies par l'appelant.
 *
 * `aria-hidden` EST SUR LE `<svg>` ET NON SUR L'HÔTE : c'est l'hôte qui porte
 * le nom accessible — `role="img"` pour `Icon`, `aria-label` pour un bouton
 * icône. Masquer le dessin plutôt que l'enveloppe laisse ce nom intact tout en
 * empêchant les lecteurs d'écran d'énumérer des chemins.
 *
 * `focusable="false"` VISE LES MOTEURS OÙ UN `<svg>` ENTRE DANS L'ORDRE DE
 * TABULATION — un point d'arrêt clavier sur une décoration.
 */
export function IconPaths({ paths, className }: { paths: IconPathData; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* LA CLÉ EST L'INDICE ET NON LE TRACÉ. Deux tracés identiques dans une
          même icône — deux points posés par `dot()`, ce que les aides du jeu
          rendent facile — donneraient deux clés égales : React avertit et
          perd un des deux au rendu. La liste est figée et jamais réordonnée,
          donc l'indice est ici une clé stable. */}
      {paths.map((d, index) => (
        <path d={d} key={index} />
      ))}
    </svg>
  );
}
