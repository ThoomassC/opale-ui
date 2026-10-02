import type { DocPage } from '../doc-model';
import { HOME_COPY } from './accueil/home-copy';
import { Home } from './accueil/home';

/* L'accueil, servi sur le slug `''` : une page pleine largeur, qui rend son
   propre `<h1>` et traduit son corps dans la langue de l'interface. Son titre
   est celui du document ; `localization.ts` le traduit pour l'onglet. */
export const introductionPage: DocPage = {
  slug: '',
  label: 'Présentation',
  group: 'introduction',
  title: HOME_COPY.FR.hero.title,
  lede: HOME_COPY.FR.hero.lede,
  fullBleed: true,
  render: (context) => (
    <Home language={context?.language ?? 'FR'} titleProps={context?.titleProps} />
  ),
};
