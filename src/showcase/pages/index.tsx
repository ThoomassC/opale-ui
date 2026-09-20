import type { DocPage } from '../doc-model';

import { introductionPage } from './introduction';
import { installationPage } from './installation';
import { iconesPage, themingPage, utilisationPage } from './guide-pages';
import { verreLiquidePage } from './verre-liquide';
import { notesVersionsPage } from './notes-de-versions';

import { accessibilitePage } from './fondations/accessibilite';
import { elevationPage } from './fondations/elevation';
import { espacementPage } from './fondations/espacement';
import { palettePage } from './fondations/palette';
import { typographiePage } from './fondations/typographie';
import { verrePage } from './fondations/verre';

import { badgePage } from './composants/badge';
import { cardPage } from './composants/card';
import { checkboxPage } from './composants/checkbox';
import { glassPage } from './composants/glass';
import { inputPage } from './composants/input';
import { modalPage } from './composants/modal';
import { searchBarPage } from './composants/search-bar';
import { selectPage } from './composants/select';
import { sidebarPage } from './composants/sidebar';
import { sliderPage } from './composants/slider';
import { siteNavPage } from './composants/site-nav';
import { switchPage } from './composants/switch';
import { tabsPage } from './composants/tabs';
import { toastPage } from './composants/toast';
import { topbarPage } from './composants/topbar';
import { opaleComponentPages } from './canop-components';

/* =============================================================================
   LE REGISTRE — l'unique liste des pages du site, et donc de sa navigation.

   La barre de gauche est RENDUE D'ICI : `doc-nav.tsx` ne connaît aucun nom de
   page, il groupe ce tableau par `group` dans l'ordre de `GROUPS`. Ajouter une
   page, c'est donc ajouter une ligne ici — et rien d'autre.

   L'ORDRE DE CE TABLEAU EST L'ORDRE DE LA NAVIGATION à l'intérieur de chaque
   groupe. Les fondations suivent l'ordre de lecture — la couleur avant les
   échelles, l'accessibilité en fin de chapitre. Les composants sont ALPHABÉTIQUES
   et pas thématiques : c'est une colonne de quatorze entrées où l'on vient
   chercher un nom qu'on connaît déjà, jamais une progression pédagogique.

   CE QUI A CHANGÉ EN 2.0, ET CE QUE LE REGISTRE EN GARDE. Ce tableau comptait
   cinq familles et vingt-quatre entrées : dix-sept pages de composants d'Opale,
   deux compositions, et quatorze pages reléguées dans un cinquième groupe
   « Magic » parce qu'elles ne documentaient pas Opale. Les dix-sept composants
   et les deux compositions sont supprimés ; les quatorze pages de `magic/` sont
   MONTÉES dans `composants/`, parce que ces composants sont désormais ceux que
   publie l'entrée racine. Leurs adresses ont donc changé — `#/magic/button`
   est devenu `#/composants/button` —, et rien ne redirige l'ancienne : la
   vitrine est servie en statique, un fragment inconnu se replie sur l'accueil.

   `registry.test.tsx` garde deux promesses sur ce tableau : chaque composant
   exporté par l'entrée racine (`src/magic/index.ts`) y a sa page, et chaque
   page se rend sans jeter ni écrire dans `console.error`. Un composant publié
   sans page fait rougir la suite — c'est le seul moyen que « une entrée de nav
   par composant » reste vrai au quinzième composant. Il garde aussi, depuis
   cette migration, qu'aucun lien interne de page ne pointe vers un slug
   inexistant : c'est ce garde qui a trouvé les onze liens laissés vers les
   composants supprimés.
   ========================================================================== */
export const PAGES: readonly DocPage[] = [
  introductionPage,
  installationPage,
  utilisationPage,
  themingPage,
  iconesPage,
  /* Juste sous « Présentation », et dans le même groupe : c'est la page qui
     montre l'effet dont toute la 2.0 dépend, avant le catalogue. */
  verreLiquidePage,
  notesVersionsPage,

  palettePage,
  typographiePage,
  espacementPage,
  elevationPage,
  verrePage,
  accessibilitePage,

  /* LES QUATORZE COMPOSANTS PUBLIÉS. Ils sont copiés de `react-magic-ui` (MIT,
     @tweeedlex) et gardés fidèles au caractère : hors du contrat de couleur,
     sans un seul jeton `--tc-*`, et aucun de leurs ratios n'a été mesuré.
     Chaque page le dit en tête par `MagicPreamble` — le préfixe `Magic` des
     briques partagées nomme cette PROVENANCE, qui reste vraie, et non le
     groupe de la vitrine, qui n'existe plus. */
  badgePage,
  cardPage,
  checkboxPage,
  glassPage,
  inputPage,
  modalPage,
  searchBarPage,
  selectPage,
  sidebarPage,
  siteNavPage,
  sliderPage,
  switchPage,
  tabsPage,
  toastPage,
  topbarPage,
  ...opaleComponentPages,
];
