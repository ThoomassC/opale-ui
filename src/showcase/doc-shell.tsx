import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { Topbar } from '../magic';
import type { DocPage } from './doc-model';
import { HOME_SLUG, findPage, hrefFor } from './doc-model';
import {
  DOC_NAV_WIDTH_DEFAULT,
  DOC_NAV_WIDTH_MAX,
  DOC_NAV_WIDTH_MOBILE_DEFAULT,
  DOC_NAV_WIDTH_MOBILE_MAX,
  DOC_NAV_WIDTH_MOBILE_MIN,
  DOC_NAV_WIDTH_MIN,
  DOC_NAV_WIDTH_STEP,
  DocNav,
} from './doc-nav';
import { DocSearch } from './doc-search';
import { LanguageSelector } from './language-selector';
import { copyFor, pageTitleFor, type InterfaceCopy } from './localization';
import { PageBoundary } from './page-boundary';
import { ThemeToggle } from './theme-toggle';
import { useLanguage } from './use-language';
import { useRoute } from './use-route';
import { UI_VERSION } from './version';

/* La coquille conserve les composants historiques de navigation, mais son
   habillage V3 suit désormais les tokens Opale. Le thème global est limité au
   clair/sombre ; les composants Opale activent leur surface Liquid Glass avec
   leur contrôle local et le prop `liquidGlass`. */

/** Le nom du paquet, affiché dans la barre du haut et dans `document.title`. */
const SITE_NAME = 'opaleUI';
const COMPACT_NAV_MEDIA_QUERY = '(max-width: 59.999rem)';

function compactNavViewport() {
  return typeof window !== 'undefined' && window.matchMedia?.(COMPACT_NAV_MEDIA_QUERY).matches;
}

/**
 * Le repli du repli : un registre sans page d'accueil.
 *
 * `findPage(pages, HOME_SLUG)` peut rendre `undefined` — un registre où le
 * slug `''` manque est un bug, mais il ne doit pas rendre une page blanche ni
 * demander une assertion non nulle. Cette page dit ce qui s'est passé.
 */
const EMPTY_REGISTRY_PAGE: DocPage = {
  slug: HOME_SLUG,
  label: 'Accueil',
  group: 'introduction',
  title: 'Aucune page à servir',
  render: () => (
    <p className="tc-doc-prose">
      Le registre <code>src/showcase/pages/index.tsx</code> ne déclare pas de page de slug{' '}
      <code>&apos;&apos;</code>.
    </p>
  ),
};

export interface DocShellProps {
  readonly pages: readonly DocPage[];
}

/**
 * Le corps de la page, appelé DEPUIS UN COMPOSANT et non depuis la coquille.
 *
 * Cette indirection d'une ligne est tout ce qui sépare la frontière d'erreur
 * de l'inutilité. `<PageBoundary>{page.render()}</PageBoundary>` paraît juste
 * et ne l'est pas : l'appel est évalué pendant le rendu de la COQUILLE, donc
 * au-dessus de la frontière, qui n'en reçoit que le résultat. Une page dont le
 * corps jette était bien bornée ; une page dont `render()` jette lui-même
 * remontait hors de la coquille et démontait la racine — la page blanche que
 * la frontière existe pour empêcher. Rendu ici, l'appel a lieu SOUS la
 * frontière, et les deux cas sont couverts.
 */
function PageContent({ page }: { page: DocPage }): ReactNode {
  return page.render();
}

interface HeaderNavProps {
  readonly page: DocPage;
  readonly className: string;
  readonly ariaLabel: string;
  readonly copy: InterfaceCopy;
}

function HeaderNav({ page, className, ariaLabel, copy }: HeaderNavProps) {
  return (
    <nav className={className} aria-label={ariaLabel}>
      <a
        className="tc-doc-topbar__tab"
        href={hrefFor(HOME_SLUG)}
        aria-current={page.slug === HOME_SLUG ? 'page' : undefined}
        onClick={(event) => {
          event.currentTarget.closest('details')?.removeAttribute('open');
        }}
      >
        {copy.home}
      </a>
      <a
        className="tc-doc-topbar__tab"
        href={hrefFor('installation')}
        aria-current={page.slug === 'installation' ? 'page' : undefined}
        onClick={(event) => {
          event.currentTarget.closest('details')?.removeAttribute('open');
        }}
      >
        {copy.installation}
      </a>
      <a
        className="tc-doc-topbar__tab"
        href={hrefFor('notes-de-versions')}
        aria-current={page.slug === 'notes-de-versions' ? 'page' : undefined}
        onClick={(event) => {
          event.currentTarget.closest('details')?.removeAttribute('open');
        }}
      >
        {copy.releaseNotes}
      </a>
    </nav>
  );
}

/**
 * La coquille du site de documentation : barre du haut, barre de gauche,
 * contenu, pied de page.
 *
 * Elle ne connaît AUCUNE page — elle reçoit le registre et lit le fragment.
 * C'est ce qui permet d'écrire les pages sans toucher à la coquille, et
 * inversement.
 *
 * UN FRAGMENT INCONNU SERT L'ACCUEIL, sans redirection. Ni `history.replaceState`
 * ni réécriture du `hash` : réécrire l'adresse ferait perdre au visiteur ce
 * qu'il avait tapé ou suivi, et empêcherait le bouton « retour » de revenir en
 * arrière (le fragment corrigé remplacerait l'entrée d'historique d'origine).
 * L'adresse reste donc fausse et la page rendue est l'accueil, qui est
 * navigable — c'est le repli le moins destructeur des trois.
 */
export function DocShell({ pages }: DocShellProps) {
  const slug = useRoute();
  const page = findPage(pages, slug) ?? findPage(pages, HOME_SLUG) ?? EMPTY_REGISTRY_PAGE;
  const { language, setLanguage } = useLanguage();
  const copy = copyFor(language);
  const pageTitle = pageTitleFor(page, language);
  const [compactNav, setCompactNav] = useState(compactNavViewport);
  const [navWidth, setNavWidth] = useState(
    compactNavViewport() ? DOC_NAV_WIDTH_MOBILE_DEFAULT : DOC_NAV_WIDTH_DEFAULT,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(COMPACT_NAV_MEDIA_QUERY);

    if (!mediaQuery) return;

    const updateCompactNav = () => setCompactNav(mediaQuery.matches);

    updateCompactNav();
    mediaQuery.addEventListener?.('change', updateCompactNav);

    return () => mediaQuery.removeEventListener?.('change', updateCompactNav);
  }, []);

  const navWidthMin = compactNav ? DOC_NAV_WIDTH_MOBILE_MIN : DOC_NAV_WIDTH_MIN;
  const navWidthMax = compactNav ? DOC_NAV_WIDTH_MOBILE_MAX : DOC_NAV_WIDTH_MAX;
  const defaultNavWidth = compactNav ? DOC_NAV_WIDTH_MOBILE_DEFAULT : DOC_NAV_WIDTH_DEFAULT;
  const effectiveNavWidth =
    navWidth >= navWidthMin && navWidth <= navWidthMax ? navWidth : defaultNavWidth;
  /* LE TITRE, ET NON `<main>`, EST LA CIBLE DU FOCUS. Deux raisons mesurées :
     — `<main>` fait la hauteur entière de la page, donc l'anneau de
       `:focus-visible` devenait un rectangle de plusieurs milliers de pixels
       dont on ne voyait que deux traits verticaux, le bord haut passant sous
       la barre collante. Sur le titre, l'anneau se pose là où l'œil doit aller ;
     — un `<main>` sans nom accessible s'annonce « main », c'est-à-dire rien.
       Un titre focalisé s'annonce « Button, titre niveau 1 » chez NVDA, JAWS
       et VoiceOver : le nom de la page, une fois, par le mécanisme le plus
       universel. C'est ce qui a permis de SUPPRIMER la région live qui doublait
       l'annonce. */
  const docRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const topbarRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const menu = headerMenuRef.current;
      if (!menu?.open || !(event.target instanceof Node) || menu.contains(event.target)) return;
      menu.open = false;
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, []);

  /* Le header a plusieurs hauteurs selon le breakpoint : sur petit écran les
     onglets, la recherche et les actions peuvent occuper plusieurs lignes. La
     variable historique `--doc-topbar-size` est un token, pas la hauteur
     réellement peinte. Le rail mesure donc son voisin réel et partage cette
     valeur avec le CSS afin que sa fin reste toujours dans la fenêtre. */
  useEffect(() => {
    const docElement = docRef.current;
    const topbarElement = topbarRef.current;

    if (!docElement || !topbarElement) return;

    const updateTopbarHeight = () => {
      const height = topbarElement.getBoundingClientRect().height;

      if (height > 0) {
        docElement.style.setProperty('--tc-doc-topbar-height', `${height}px`);
      }
    };

    updateTopbarHeight();
    window.addEventListener('resize', updateTopbarHeight);
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateTopbarHeight);
    resizeObserver?.observe(topbarElement);

    return () => {
      window.removeEventListener('resize', updateTopbarHeight);
      resizeObserver?.disconnect();
      docElement.style.removeProperty('--tc-doc-topbar-height');
    };
  }, []);

  /* Synchronisation avec un système extérieur — le titre du document — donc un
     effet est ici l'outil juste. Le titre suit la page RENDUE, repli compris. */
  useEffect(() => {
    document.title = `${pageTitle} — ${SITE_NAME}`;
  }, [pageTitle]);

  /* La page rendue lors du dernier passage de cet effet. UNE CHAÎNE ET NON UN
     BOOLÉEN « déjà monté », et c'est ce qui rend le mode strict inoffensif :
     React monte, démonte puis remonte le composant en gardant ses `ref`, si
     bien qu'un drapeau serait déjà à `true` au second montage — la vitrine
     volerait alors le focus au chargement, exactement ce que ce garde existe
     pour empêcher. Avec le slug, le second passage voit la même valeur et ne
     fait rien. */
  const settledSlug = useRef<string | null>(null);

  useEffect(() => {
    if (settledSlug.current === page.slug) return;

    const isFirstRoute = settledSlug.current === null;
    settledSlug.current = page.slug;

    /* Au premier rendu on ne touche à rien : déplacer le focus au chargement
       le volerait à la barre d'adresse et couperait la lecture qui commence
       (WCAG 3.2.1). Le titre est déjà le premier élément du contenu — il n'y a
       rien à faire gagner à personne. */
    if (isFirstRoute) return;

    /* `preventScroll` puis remise à zéro à la main : donner le focus fait
       défiler le navigateur jusqu'à l'élément, ce qui rejouerait le défilement
       qu'on est en train de remettre en haut. */
    titleRef.current?.focus({ preventScroll: true });

    /* `scrollTop` et non `window.scrollTo` : l'accesseur est un simple attribut
       de l'élément défilant, là où `scrollTo` n'est pas implémenté par jsdom et
       y émet une erreur de console à chaque navigation testée. */
    const scroller = document.scrollingElement ?? document.documentElement;
    scroller.scrollTop = 0;
  }, [page.slug]);

  const previewNavWidth = (width: number) => {
    bodyRef.current?.style.setProperty('--tc-doc-nav-width', `${width}px`);
  };

  const commitNavWidth = (width: number) => {
    setNavWidth(width);
  };

  return (
    <div className="tc-doc" ref={docRef}>
      {/* =====================================================================
          LA BARRE DU HAUT EST LE `Topbar` DE LA LIBRAIRIE, ET LE `<div>` QUI
          L'ENTOURE N'EST PAS DÉCORATIF.

          `Topbar` rend son `<header>` À L'INTÉRIEUR d'un `Glass`, dont
          l'enveloppe porte depuis peu `z-index: 0` — donc un contexte
          d'empilement. Une barre collante posée sur le composant serait
          enfermée à 0 dans son propre contexte, et le `z-index` qui la met
          au-dessus du contenu ne peut pas vivre là : c'est l'élément qu'on
          positionne AUTOUR qui doit le porter. `.tc-doc-topbar` est donc le
          calque collant (`position: sticky; z-index: 2`) et le sol opaque ; le
          composant est le matériau posé dessus.

          CE `<div>` NE VOLE PAS LE POINT DE REPÈRE. `<header>` prend le rôle
          `banner` dès qu'il n'est pas dans un `article`, `aside`, `main`,
          `nav` ou `section` — un `<div>` n'en fait pas partie, donc la barre
          reste le `banner` du document. Vérifié : `getByRole('banner')` de
          `doc-shell.test.tsx` continue de la trouver.

          LE SOL OPAQUE EST AUSSI CE QUI REND LE VERRE SÛR. `Glass` floute son
          arrière-plan (`backdrop-filter: blur(0.75px) saturate(1.08)`) : sur un fond
          TRANSPARENT, ce serait le contenu de la page qui remonterait sous
          l'encre de la barre — le défaut exact que `doc.css` mesurait pour
          refuser le verre sur la barre en 1.x (encre de marque à 2,64:1
          au-dessus d'une plaque sombre qui défile). Avec un sol opaque, le
          flou n'échantillonne qu'un aplat : la surface composée est constante,
          et c'est elle qui est mesurée.

          `elevated={false}`, ET C'EST DÉSORMAIS UN CHOIX D'APPARENCE — ça ne
          l'a pas toujours été, et la distinction vaut d'être écrite.

          L'ombre d'`elevated` était posée sur le `<header>`, c'est-à-dire À
          L'INTÉRIEUR de l'enveloppe de verre, qui porte `overflow: hidden` :
          elle était rognée par son propre parent et ne se voyait pas. La
          demander revenait à annoncer une élévation que rien ne peignait.
          `Topbar` a depuis déplacé la largeur et l'ombre SUR L'ENVELOPPE, donc
          l'ombre se peindrait maintenant.

          On continue de ne pas la vouloir, pour une autre raison : la barre est
          pleine largeur, à ras du haut de la fenêtre, et son enveloppe porte
          déjà une arête mesurée (`--doc-shell-edge`, 3,11:1 contre le blanc,
          plancher WCAG 1.4.11). Une ombre portée en plus doublerait une
          séparation qui est déjà faite, et le ferait par un moyen non mesuré.
          ================================================================== */}
      <div className="tc-doc-topbar" ref={topbarRef}>
        <Topbar
          className="tc-doc-topbar__bar"
          rootClassName="tc-doc-topbar__glass"
          size="spacious"
          elevated={false}
        >
          {/* `Topbar.Brand` EST EMPLOYÉ, MAIS NI `icon`, NI `title`, NI
              `subtitle`, et c'est la même raison que pour `Sidebar.Item` :
              les trois rendent des `<span>`. Or la marque est LE LIEN DE
              RETOUR À L'ACCUEIL — clic milieu, « copier le lien », ouverture
              dans un onglet, et une annonce « lien » plutôt que « texte ». Le
              `<a>` est donc passé en enfants, avec l'icône du favicon dedans pour
              qu'il fasse partie de la cible ; le composant apporte la boîte
              (`min-w-0`, l'alignement, la gouttière). */}
          <Topbar.Brand className="tc-doc-topbar__side tc-doc-topbar__brand-container">
            <a className="tc-doc-topbar__brand" href={hrefFor(HOME_SLUG)}>
              <span className="tc-doc-topbar__glyph" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="tc-doc-topbar__brand-name" aria-label={SITE_NAME}>
                <span>opale</span>
                <span className="tc-doc-topbar__brand-name--accent">UI</span>
              </span>
              <span className="tc-doc-topbar__version">v{UI_VERSION}</span>
            </a>
          </Topbar.Brand>

          <Topbar.Section className="tc-doc-topbar__tabs" gap="tight">
            <HeaderNav
              page={page}
              className="tc-doc-topbar__tabs-nav"
              ariaLabel={copy.primaryNavigation}
              copy={copy}
            />
            <details className="tc-doc-topbar__menu" ref={headerMenuRef}>
              <summary className="tc-doc-topbar__menu-toggle" aria-label={copy.openMenu}>
                <span aria-hidden="true" />
              </summary>
              <HeaderNav
                page={page}
                className="tc-doc-topbar__menu-nav"
                ariaLabel={copy.primaryMenu}
                copy={copy}
              />
            </details>
          </Topbar.Section>

          {/* LA RECHERCHE EST LA SECTION ÉLASTIQUE, et `grow` est exactement ce
              que `doc.css` écrivait à la main : `flex: 1 1 auto` avec un
              plancher. Elle reste ENTRE la marque et les contrôles — c'est ce
              qui lui donne la place, la marque se tronquant et la bascule
              ayant une largeur fixe. Le combobox lui-même n'a pas changé d'une
              ligne : il est déplacé, pas réécrit. */}
          <Topbar.Section className="tc-doc-topbar__field" grow align="center">
            <DocSearch pages={pages} language={language} />
          </Topbar.Section>

          {/* LE SÉPARATEUR EST DANS LES ACTIONS ET NON ENTRE ELLES ET LE CHAMP,
              et c'est de la géométrie et non du rangement : les deux pistes
              latérales sont égales par construction (`flex: 1 1 0`), donc la
              section du milieu est centrée sur la barre quoi qu'elles portent.
              Un `Topbar.Divider` posé en FRÈRE ajouterait sa largeur et sa
              gouttière — 17 px mesurés — d'un seul côté, et le champ cesserait
              d'être centré. */}
          <Topbar.Actions className="tc-doc-topbar__side tc-doc-topbar__actions">
            <ThemeToggle label={copy.darkTheme} />
            <LanguageSelector language={language} label={copy.language} onChange={setLanguage} />
          </Topbar.Actions>
        </Topbar>
      </div>

      <div
        className="tc-doc-body"
        ref={bodyRef}
        style={{ '--tc-doc-nav-width': `${effectiveNavWidth}px` } as CSSProperties}
      >
        <DocNav
          pages={pages}
          currentSlug={page.slug}
          language={language}
          resize={{
            width: effectiveNavWidth,
            min: navWidthMin,
            max: navWidthMax,
            step: DOC_NAV_WIDTH_STEP,
            onPreview: previewNavWidth,
            onChange: (width) =>
              commitNavWidth(Math.max(navWidthMin, Math.min(navWidthMax, width))),
            onCommit: (width) =>
              commitNavWidth(Math.max(navWidthMin, Math.min(navWidthMax, width))),
          }}
        />

        <div className="tc-doc-column">
          <main
            className={`tc-doc-main${page.slug === HOME_SLUG ? ' tc-doc-main--home' : ''}${page.group === 'composants' ? ' tc-doc-main--components' : ''}`}
            id="contenu"
          >
            <h1 className="tc-doc-page__title" ref={titleRef} tabIndex={-1}>
              {pageTitle}
            </h1>
            {copy.contentLanguageNotice ? (
              <p className="tc-doc-language-notice" lang={language.toLowerCase()}>
                {copy.contentLanguageNotice}
              </p>
            ) : null}
            {/* La frontière n'entoure QUE le contenu de la page : le titre, le
                sommaire et les deux bascules restent rendus quoi qu'il
                arrive. Une page sur vingt et une qui jette ne doit pas
                emporter les vingt autres avec elle — c'est l'incident que
                `src/index.ts` documente, arrivé une fois avec un `Pill`. */}
            <PageBoundary resetKey={page.slug}>
              <PageContent page={page} />
            </PageBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
