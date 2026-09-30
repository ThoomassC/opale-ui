import { IconPaths } from './IconPaths';
import { OPALE_ICONS, type OpaleIconName } from './icons';

/**
 * Le tracé d'une icône du jeu, désignée par son nom.
 *
 * IL VIT ICI ET NON DANS LE CATALOGUE pour une raison de dépendances : le
 * catalogue importe `Modal`, et lui faire remonter `Icon` fermerait un cycle.
 * Le jeu d'icônes, lui, ne dépend de rien.
 *
 * UN NOM SE RÉSOUT DANS LA TABLE ENTIÈRE, donc ce composant embarque les cent
 * vingt dessins du jeu. C'est juste pour `Icon`, dont le nom vient de
 * l'appelant ; c'est un gaspillage pour un composant qui dessine toujours la
 * même icône — celui-là emploie `IconPaths` avec une constante de `glyphs.ts`.
 * Le rendu, `aria-hidden` et `focusable` compris, est celui d'`IconPaths`.
 */
export function IconGlyph({ name, className }: { name: OpaleIconName; className?: string }) {
  return <IconPaths paths={OPALE_ICONS[name]} className={className} />;
}
