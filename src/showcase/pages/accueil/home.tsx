import { Carousel, ScrollSection, ScrollStage, SplitHeading } from '../../../opale';
import { catalogComponentSlug, hrefFor, type DocPageTitleProps } from '../../doc-model';
import type { Language } from '../../localization';
import { SHOWCASE_CATALOG } from '../../showcase-catalog';
import { UI_VERSION } from '../../version';
import { HOME_COPY } from './home-copy';
import { homeSlides } from './home-slides';

/* =============================================================================
   L'ACCUEIL DE LA 3.0 : UNE SCÈNE, CINQ BANDES.

   La page est pleine largeur : la coquille ne rend ni sommaire ni titre, et lui
   passe la langue et les props de son `<h1>`. Chaque bande est une
   `ScrollSection` nommée par son titre (`aria-labelledby`) ; la scène expose le
   fond de la bande active, que la barre du haut peut lire.

   TOUT EST VISIBLE SANS MOUVEMENT. Les titres découpés, le carrousel et le
   bandeau partent d'un état de repos lisible ; le mouvement réduit les laisse
   immobiles.
   ========================================================================== */

const COMPONENT_COUNT = SHOWCASE_CATALOG.length;

export interface HomeProps {
  readonly language: Language;
  /** Le `ref` et le `tabIndex` du `<h1>`, que la coquille focalise à la navigation. */
  readonly titleProps?: DocPageTitleProps;
}

export function Home({ language, titleProps }: HomeProps) {
  const copy = HOME_COPY[language];

  return (
    <ScrollStage className="tc-doc-landing">
      <ScrollSection
        ground="paper"
        aria-labelledby="tc-doc-landing-hero"
        className="tc-doc-landing__band tc-doc-landing__band--hero"
      >
        <div className="tc-doc-landing__wrap tc-doc-landing__hero">
          <p className="tc-doc-landing__eyebrow">{copy.hero.eyebrow(UI_VERSION)}</p>
          <SplitHeading
            {...titleProps}
            level={1}
            id="tc-doc-landing-hero"
            className="tc-doc-landing__display"
          >
            {copy.hero.title}
          </SplitHeading>
          <p className="tc-doc-landing__lede">{copy.hero.lede}</p>
          {/* Des liens habillés en boutons : ils mènent à une page, ils
              n'agissent pas. Les classes stables de `Button` les dessinent. */}
          <div className="tc-doc-landing__actions">
            <a
              className="opale-button opale-button--primary opale-button--large"
              href={hrefFor('installation')}
            >
              {copy.hero.install}
            </a>
            <a
              className="opale-button opale-button--secondary opale-button--large"
              href={hrefFor(catalogComponentSlug('Button'))}
            >
              {copy.hero.components}
            </a>
          </div>
        </div>
      </ScrollSection>

      <ScrollSection
        ground="amber"
        aria-labelledby="tc-doc-landing-components"
        className="tc-doc-landing__band"
      >
        <div className="tc-doc-landing__wrap">
          <div className="tc-doc-landing__head">
            <SplitHeading id="tc-doc-landing-components" className="tc-doc-landing__title">
              {copy.components.title}
            </SplitHeading>
            <p className="tc-doc-landing__lede">{copy.components.lede(COMPONENT_COUNT)}</p>
          </div>
          <Carousel
            label={copy.components.carousel}
            labels={copy.components.carouselLabels}
            slideSize="min(86%, 24rem)"
            className="tc-doc-landing__carousel"
          >
            {homeSlides(copy.components)}
          </Carousel>
        </div>
      </ScrollSection>
    </ScrollStage>
  );
}
