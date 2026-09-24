import { OPALE_ICONS, type OpaleIconName } from './icons';

/**
 * Le tracé d'une icône du jeu, sans enveloppe ni mise en forme.
 *
 * IL VIT ICI ET NON DANS `opale.tsx` pour une raison de dépendances : `Modal`
 * a besoin d'une croix dessinée, et `opale.tsx` importe `Modal`. Lui faire
 * remonter `Icon` fermerait le cycle. Le jeu d'icônes, lui, ne dépend de rien.
 *
 * `aria-hidden` EST SUR LE `<svg>` ET NON SUR L'HÔTE : c'est l'hôte qui porte
 * le nom accessible — `role="img"` pour `Icon`, `aria-label` pour un bouton
 * icône. Masquer le dessin plutôt que l'enveloppe laisse ce nom intact tout en
 * empêchant les lecteurs d'écran d'énumérer des chemins.
 *
 * `focusable="false"` VISE LES MOTEURS OÙ UN `<svg>` ENTRE DANS L'ORDRE DE
 * TABULATION — un point d'arrêt clavier sur une décoration.
 */
export function IconGlyph({ name, className }: { name: OpaleIconName; className?: string }) {
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
      {OPALE_ICONS[name].map((d, index) => (
        <path d={d} key={index} />
      ))}
    </svg>
  );
}
