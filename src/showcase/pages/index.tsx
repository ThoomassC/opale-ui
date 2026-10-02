import type { DocPage } from '../doc-model';

import { introductionPage } from './introduction';
import { installationPage } from './installation';
import { themingPage, utilisationPage } from './guide-pages';
import { iconesPage } from './icones';
import { personnaliserPage } from './personnaliser.page';
import { migrationPage } from './migrer-vers-3';
import { verreLiquidePage } from './verre-liquide';
import { notesVersionsPage } from './notes-de-versions';

import { accessibilitePage } from './fondations/accessibilite.page';
import { elevationPage } from './fondations/elevation.page';
import { espacementPage } from './fondations/espacement.page';
import { palettePage } from './fondations/palette.page';
import { typographiePage } from './fondations/typographie.page';
import { verrePage } from './fondations/verre.page';

import { modalPage } from './composants/modal.page';
import { pageScaffoldPage } from './composants/page-scaffold.page';
import { searchBarPage } from './composants/search-bar.page';
import { sidebarPage } from './composants/sidebar.page';
import { siteNavPage } from './composants/site-nav.page';
import { tabsPage } from './composants/tabs.page';
import { toastPage } from './composants/toast.page';
import { topbarPage } from './composants/topbar.page';
import { opaleComponentPages } from './opale-component-pages';

/* Le registre : l'unique liste des pages, et donc de la navigation, que
   `doc-nav.tsx` groupe par `group` dans l'ordre de `GROUPS`. L'ordre du tableau
   est celui de la nav dans chaque groupe : fondations dans l'ordre de lecture,
   composants par ordre alphabétique.

   `registry.test.tsx` vérifie que chaque composant exporté par
   `src/opale/index.ts` a sa page, que chaque page se rend sans erreur, et
   qu'aucun lien interne ne vise un slug inexistant. */
export const PAGES: readonly DocPage[] = [
  introductionPage,
  installationPage,
  utilisationPage,
  themingPage,
  /* Juste après « Thèmes » : le thème choisi, on l'habille à sa marque. */
  personnaliserPage,
  iconesPage,
  /* La dernière 2.x prépare la suivante : la liste des anciens noms, déduite
     de `src/opale/deprecations.ts`. */
  migrationPage,
  /* Juste sous « Présentation », et dans le même groupe : c'est la page qui
     montre l'effet dont toute la 1.0 dépend, avant le catalogue. */
  verreLiquidePage,
  notesVersionsPage,

  palettePage,
  typographiePage,
  espacementPage,
  elevationPage,
  verrePage,
  accessibilitePage,

  /* Les composants composés d’Opale gardent leurs fiches propres. La commande
     d’installation est documentée une fois sur la page « Installation ». */
  modalPage,
  pageScaffoldPage,
  searchBarPage,
  sidebarPage,
  siteNavPage,
  tabsPage,
  toastPage,
  topbarPage,
  ...opaleComponentPages,
];
