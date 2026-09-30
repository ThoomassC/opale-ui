import type { DocPage } from '../doc-model';
import { lazyPage } from './lazy-page';

/* Les métadonnées de « Personnaliser », lues par le sommaire et la recherche
   sans rien charger. Le contenu — qui embarque la feuille lue au build et le
   contrat — se charge à la navigation. */
export const personnaliserPage: DocPage = {
  slug: 'personnaliser',
  label: 'Personnaliser',
  group: 'introduction',
  title: 'Personnaliser',
  searchTerms: [
    'marque',
    'brand',
    'jetons',
    'tokens',
    'surcharger',
    'contraste',
    'checkBrand',
    'data-opale-brand',
    'data-opale-scope',
    'opale-root',
    '--opale-primary',
    '--opale-on-primary',
  ],
  lede: (
    <>
      Habillez Opale aux couleurs de votre projet : les jetons à surcharger, les attributs qui
      dérivent les états, et une mesure des contrastes avant de publier.
    </>
  ),
  render: lazyPage(() => import('./personnaliser').then((module) => module.default)),
};
