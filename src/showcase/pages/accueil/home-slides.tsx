import type { ReactNode } from 'react';

import { CarouselSlide, Link } from '../../../opale';
import { catalogComponentSlug, hrefFor } from '../../doc-model';
import { HOME_FAMILIES, type HomeCopy, type HomeFamilyId } from './home-copy';
import {
  DisplayDemo,
  FormDemo,
  InputDemo,
  MotionDemo,
  NavigationDemo,
  OverlayDemo,
  type Demos,
} from './home-demos';

/* =============================================================================
   LES DIAPOSITIVES DE LA BANDE « LES COMPOSANTS ».

   Une diapositive par famille : son nom, une ligne, une démo VIVANTE faite des
   vrais composants (`home-demos.tsx`), et le lien vers la page qui ouvre la
   famille.

   `homeSlides` est une FONCTION appelée, pas un composant : le carrousel compte
   ses enfants directs, et un composant qui rendrait les diapositives les lui
   cacherait.
   ========================================================================== */

/** La page qui ouvre chaque famille. */
export const FAMILY_SLUGS: Readonly<Record<HomeFamilyId, string>> = {
  saisie: catalogComponentSlug('Button'),
  formulaires: catalogComponentSlug('Textarea'),
  couches: catalogComponentSlug('Popover'),
  affichage: catalogComponentSlug('Badge'),
  navigation: 'composants/tabs',
  mouvement: catalogComponentSlug('SplitHeading'),
};

const DEMOS: Readonly<Record<HomeFamilyId, (props: { readonly demos: Demos }) => ReactNode>> = {
  saisie: InputDemo,
  formulaires: FormDemo,
  couches: OverlayDemo,
  affichage: DisplayDemo,
  navigation: NavigationDemo,
  mouvement: MotionDemo,
};

/** Les diapositives, en enfants directs du `Carousel` qui les appelle. */
export function homeSlides(copy: HomeCopy['components']) {
  return HOME_FAMILIES.map((id) => {
    const family = copy.families[id];
    const Demo = DEMOS[id];
    return (
      <CarouselSlide key={id} className="tc-doc-landing-slide">
        <div className="tc-doc-landing-slide__text">
          <h3>{family.name}</h3>
          <p>{family.line}</p>
        </div>
        <div className="tc-doc-landing-slide__demo">
          <Demo demos={copy.demos} />
        </div>
        <Link className="tc-doc-landing-slide__link" href={hrefFor(FAMILY_SLUGS[id])}>
          {family.link}
        </Link>
      </CarouselSlide>
    );
  });
}
