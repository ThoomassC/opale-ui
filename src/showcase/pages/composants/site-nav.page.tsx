import type { DocPage } from '../../doc-model';
import { lazyPage } from '../lazy-page';

export const siteNavPage: DocPage = {
  slug: 'composants/site-nav',
  label: 'SiteNav',
  group: 'composants',
  title: 'SiteNav',
  lede: (
    <>
      Une démonstration de barre liquid glass centrée. Les onglets sont cliquables sans changer de
      page ; <strong>une seule bulle</strong> glisse entre eux.
    </>
  ),
  render: lazyPage(() => import('./site-nav').then((module) => module.default)),
};
