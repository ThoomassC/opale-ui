import { DocShell } from './doc-shell';
import { PAGES } from './pages';

/**
 * La vitrine de `@thomascaron/opale-ui`.
 *
 * Elle était UNE page de charte qui déroulait sept sections ; elle est
 * désormais un site de documentation — une barre de navigation à gauche, une
 * page à droite, une entrée par composant publié. Ce fichier ne fait plus que
 * marier le registre des pages à la coquille : `main.tsx` importe
 * `CharterPage`, donc le nom reste, et il n'y a qu'un endroit à changer si le
 * registre déménage.
 *
 * LE DOCUMENT RESTE UNE INSTANCE DE LUI-MÊME, MAIS PLUS QU'À MOITIÉ, et la
 * nuance compte depuis la 2.0. Il est bien rendu dans la palette qu'il
 * documente — `doc.css` ne cite que des `var(--tc-*)` et n'en déclare aucun,
 * donc un jeton faux dégrade la vitrine avec lui. En revanche il n'emploie
 * plus aucun COMPOSANT de la librairie : les dix-huit composants d'Opale sont
 * supprimés, et les quatorze composants publiés à leur place n'habillent que
 * les spécimens, jamais la coquille — ils sont hors du contrat de couleur, et
 * bâtir la navigation avec eux ferait dépendre la lisibilité du site de code
 * dont aucun ratio n'est mesuré. La barre du haut, le sommaire et la recherche
 * sont donc du HTML natif habillé par `doc.css`.
 */
export function CharterPage() {
  return <DocShell pages={PAGES} />;
}
