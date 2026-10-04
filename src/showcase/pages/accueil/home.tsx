import {
  Card,
  Carousel,
  Clipboard,
  Link,
  Marquee,
  PageScaffold,
  Reveal,
  ScrollSection,
  ScrollStage,
  SplitHeading,
} from '../../../opale';
import { catalogComponentSlug, hrefFor, type DocPageTitleProps } from '../../doc-model';
import { INSTALL_REF, INSTALL_REF_KIND } from '../../install-ref';
import type { Language } from '../../localization';
import { SHOWCASE_CATALOG } from '../../showcase-catalog';
import { UI_VERSION } from '../../version';
import { installCommands } from '../installation';
import { HOME_COPY, RUNTIME_DEPENDENCIES, type HomeCopy } from './home-copy';
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

   LE MOUVEMENT EST LENT ET LIÉ AU DÉFILEMENT. L'accroche se compose au
   chargement — sur-titre, mots du titre, chapeau, actions —, puis chaque bande
   monte quand on l'atteint (`Reveal`). L'aura de l'accroche, décorative, ne
   bouge qu'avec le défilement : rien ne s'anime en boucle de lui-même
   (WCAG 2.2.2). Les réglages vivent dans `doc-v3.css`.
   ========================================================================== */

const COMPONENT_COUNT = SHOWCASE_CATALOG.length;

/* La commande de la release courante : l'archive construite quand elle
   existe, le tag Git sinon — la même que la page Installation. */
const INSTALL = installCommands(INSTALL_REF, INSTALL_REF_KIND);
const INSTALL_COMMAND = INSTALL.archive ?? INSTALL.git;

/* L'APERÇU D'UNE PAGE ENTIÈRE : un vrai `PageScaffold`, rendu dans un cadre
   `inert` (et `aria-hidden`, pour les outils qui ignorent encore `inert`).
   Ce n'est qu'une image de page — ni le clavier ni un lecteur d'écran n'y
   entrent ; la légende de la figure la décrit, et le lien qui
   suit mène à l'exemple qui, lui, se manipule. Son titre est un `<h3>`, sous
   le `<h2>` de la bande, et `mainAs="div"` laisse à la vitrine son seul
   `<main>`. */
function ScaffoldPreview({ copy }: { readonly copy: HomeCopy['pages']['scaffold'] }) {
  /* Les liens visent tous l'exemple : inertes, ils ne mènent nulle part, mais
     une page qui se lierait à elle-même serait un défaut du registre. */
  const example = hrefFor('composants/page-scaffold');
  const navigation = [
    { id: 'home', href: example, label: copy.home },
    { id: 'work', href: example, label: copy.work },
    { id: 'about', href: example, label: copy.about },
  ];
  return (
    <PageScaffold
      className="tc-doc-landing__scaffold"
      mainAs="div"
      titleAs="h3"
      siteName={copy.site}
      homeHref={example}
      navigation={navigation}
      activeId="home"
      showLanguageSelector={false}
      pageTitle={copy.title}
      pageDescription={copy.description}
      footerLinks={[{ id: 'legal', href: example, label: copy.legal }]}
      copyrightYear={2026}
    >
      <Card title={copy.card}>{copy.body}</Card>
    </PageScaffold>
  );
}

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
        {/* L'aura : trois halos flous, derrière le texte et sans contenu. */}
        <div className="tc-doc-landing__aura" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="tc-doc-landing__wrap tc-doc-landing__hero">
          <p className="tc-doc-landing__eyebrow">{copy.hero.eyebrow(UI_VERSION)}</p>
          <SplitHeading
            {...titleProps}
            level={1}
            trigger="mount"
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
            <Reveal>
              <p className="tc-doc-landing__lede">{copy.components.lede(COMPONENT_COUNT)}</p>
            </Reveal>
          </div>
          <Reveal>
            <Carousel
              label={copy.components.carousel}
              labels={copy.components.carouselLabels}
              slideSize="min(86%, 24rem)"
              className="tc-doc-landing__carousel"
            >
              {homeSlides(copy.components)}
            </Carousel>
          </Reveal>
        </div>
      </ScrollSection>

      <ScrollSection
        ground="night"
        aria-labelledby="tc-doc-landing-qualities"
        className="tc-doc-landing__band"
      >
        <div className="tc-doc-landing__wrap">
          <div className="tc-doc-landing__head">
            <SplitHeading id="tc-doc-landing-qualities" className="tc-doc-landing__title">
              {copy.qualities.title}
            </SplitHeading>
            <Reveal>
              <p className="tc-doc-landing__lede">{copy.qualities.lede}</p>
            </Reveal>
          </div>
          {/* Du texte seul : la copie de la boucle est inerte, un lien y
              serait cliquable une fois sur deux. */}
          <Reveal>
            <Marquee
              label={copy.qualities.marquee}
              labels={copy.qualities.marqueeLabels}
              className="tc-doc-landing__marquee"
            >
              {copy.qualities.marqueeItems(COMPONENT_COUNT).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </Marquee>
          </Reveal>
          <ul className="tc-doc-landing__proofs">
            {copy.qualities.proofs(RUNTIME_DEPENDENCIES).map((proof, index) => (
              <Reveal key={proof.title} as="li" delay={index} className="tc-doc-landing__proof">
                <h3>{proof.title}</h3>
                <p>{proof.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </ScrollSection>

      <ScrollSection
        ground="paper"
        aria-labelledby="tc-doc-landing-pages"
        className="tc-doc-landing__band"
      >
        <div className="tc-doc-landing__wrap">
          <div className="tc-doc-landing__head">
            <SplitHeading id="tc-doc-landing-pages" className="tc-doc-landing__title">
              {copy.pages.title}
            </SplitHeading>
            <Reveal>
              <p className="tc-doc-landing__lede">{copy.pages.lede}</p>
            </Reveal>
          </div>
          <figure className="tc-doc-landing__preview" aria-labelledby="tc-doc-landing-preview">
            <div className="tc-doc-landing__frame" inert aria-hidden="true">
              <ScaffoldPreview copy={copy.pages.scaffold} />
            </div>
            <figcaption id="tc-doc-landing-preview">{copy.pages.caption}</figcaption>
          </figure>
          <Link className="tc-doc-landing__link" href={hrefFor('composants/page-scaffold')}>
            {copy.pages.link}
          </Link>
        </div>
      </ScrollSection>

      <ScrollSection
        ground="blue"
        aria-labelledby="tc-doc-landing-install"
        className="tc-doc-landing__band"
      >
        <div className="tc-doc-landing__wrap">
          <div className="tc-doc-landing__head">
            <SplitHeading id="tc-doc-landing-install" className="tc-doc-landing__title">
              {copy.install.title}
            </SplitHeading>
            <Reveal>
              <p className="tc-doc-landing__lede">{copy.install.lede}</p>
            </Reveal>
          </div>
          <Reveal className="tc-doc-landing__command">
            <pre aria-label={copy.install.commandLabel}>
              <code>{INSTALL_COMMAND}</code>
            </pre>
            <Clipboard value={INSTALL_COMMAND} labels={copy.install.clipboardLabels}>
              {copy.install.copy}
            </Clipboard>
          </Reveal>
          <div className="tc-doc-landing__actions">
            <a
              className="opale-button opale-button--primary opale-button--large"
              href={hrefFor('installation')}
            >
              {copy.install.guide}
            </a>
            <Link className="tc-doc-landing__link" href={hrefFor('migrer-vers-4')}>
              {copy.install.migrate}
            </Link>
          </div>
        </div>
      </ScrollSection>
    </ScrollStage>
  );
}
