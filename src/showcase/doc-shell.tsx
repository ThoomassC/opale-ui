import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { Topbar } from '../opale';
import { HeaderNavigation } from '../opale/components/header-controls/HeaderNavigation';
import type { DocPage, DocPageContext } from './doc-model';
import { HOME_SLUG, findPage, hrefFor, navSectionsForPages } from './doc-model';
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
import { DocFooter } from './doc-footer';
import { DocSearch } from './doc-search';
import { LanguageSelector } from './language-selector';
import {
  copyFor,
  pageTitleFor,
  sectionLabelFor,
  type InterfaceCopy,
  type Language,
} from './localization';
import { PageBoundary } from './page-boundary';
import { ThemeToggle } from './theme-toggle';
import { useLanguage } from './use-language';
import { useRoute } from './use-route';
import { UI_VERSION } from './version';

/* La coquille conserve les composants historiques de navigation, mais son
   habillage V3 suit désormais les tokens Opale. Le thème global est limité au
   clair/sombre ; les composants Opale activent leur surface en verre liquide avec
   leur contrôle local et le prop `liquidGlass`. */

/** Le nom du paquet, affiché dans la barre du haut et dans `document.title`. */
const SITE_NAME = 'OpaleUI';
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
 * Le corps de la page, rendu par un composant et non par la coquille : ainsi
 * `page.render()` s'exécute sous `PageBoundary`, qui en borne aussi les erreurs.
 */
function PageContent({ page, context }: { page: DocPage; context: DocPageContext }): ReactNode {
  return page.render(context);
}

/* Le libellé d'une rubrique en capitales (« PRISE EN MAIN »), écrit en
   phrase pour le menu : « Prise en main ». */
function sentenceCase(label: string): string {
  const lower = label.toLocaleLowerCase();
  return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
}

interface HeaderNavProps {
  readonly page: DocPage;
  readonly className: string;
  readonly ariaLabel: string;
  readonly copy: InterfaceCopy;
  /** Les rubriques du sommaire, ajoutées aux onglets quand le sommaire n'est pas rendu. */
  readonly sections?: { readonly pages: readonly DocPage[]; readonly language: Language };
}

function HeaderNav({ page, className, ariaLabel, copy, sections }: HeaderNavProps) {
  /* UNE ENTRÉE PAR RUBRIQUE, vers sa première page : sans sommaire, le menu
     reste le chemin vers toute la documentation, la recherche l'autre. */
  const sectionLinks = sections
    ? navSectionsForPages(sections.pages).flatMap((section) => {
        const first = section.entries[0];
        return first
          ? [
              {
                id: `section-${section.id}`,
                href: hrefFor(first.page.slug),
                label: sentenceCase(sectionLabelFor(section.id, section.label, sections.language)),
              },
            ]
          : [];
      })
    : [];
  const links = [
    { id: HOME_SLUG, href: hrefFor(HOME_SLUG), label: copy.home },
    { id: 'installation', href: hrefFor('installation'), label: copy.installation },
    {
      id: 'notes-de-versions',
      href: hrefFor('notes-de-versions'),
      label: copy.releaseNotes,
    },
    ...sectionLinks,
  ];

  return (
    <HeaderNavigation
      links={links}
      activeId={page.slug}
      className={className}
      ariaLabel={ariaLabel}
      siteClassNames
      onNavigate={(_link, event) => event.currentTarget.closest('details')?.removeAttribute('open')}
    />
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
 * Un fragment inconnu sert l'accueil sans réécrire l'adresse : le visiteur
 * garde ce qu'il a suivi et le bouton « retour » reste utile.
 */
export function DocShell({ pages }: DocShellProps) {
  const slug = useRoute();
  const page = findPage(pages, slug) ?? findPage(pages, HOME_SLUG) ?? EMPTY_REGISTRY_PAGE;
  const { language, setLanguage } = useLanguage();
  const copy = copyFor(language);
  const pageTitle = pageTitleFor(page, language);
  const fullBleed = page.fullBleed === true;
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
  /* Le titre, et non `<main>`, reçoit le focus à la navigation : l'anneau
     se pose sur une cible de la taille du texte, et le titre focalisé
     annonce le nom de la page sans région live. */
  const docRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pageContext: DocPageContext = { language, titleProps: { ref: titleRef, tabIndex: -1 } };
  const topbarRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const menu = headerMenuRef.current;
      if (!menu?.open || !(event.target instanceof Node) || menu.contains(event.target)) return;
      menu.open = false;
    };
    /* Échap referme le menu ouvert et rend le focus à son bouton, comme tout
       disclosure ; menu fermé, la touche reste aux autres composants. */
    const closeOnEscape = (event: KeyboardEvent) => {
      const menu = headerMenuRef.current;
      if (event.key !== 'Escape' || !menu?.open) return;
      menu.open = false;
      menu.querySelector('summary')?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
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
        /* Aussi sur la racine : `scroll-padding` se lit sur `<html>`, et le
           coussin doit valoir la barre peinte, pas le jeton (WCAG 2.4.11). */
        document.documentElement.style.setProperty('--tc-doc-topbar-height', `${height}px`);
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
      document.documentElement.style.removeProperty('--tc-doc-topbar-height');
    };
  }, []);

  /* Synchronisation avec un système extérieur — le titre du document — donc un
     effet est ici l'outil juste. Le titre suit la page RENDUE, repli compris. */
  useEffect(() => {
    document.title = `${pageTitle} — ${SITE_NAME}`;
  }, [pageTitle]);

  /* Le slug de la dernière page traitée, et non un booléen : le mode strict
     remonte le composant en gardant ses `ref`, et un drapeau volerait le focus
     au chargement. */
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
    <div className={fullBleed ? 'tc-doc tc-doc--full-bleed' : 'tc-doc'} ref={docRef}>
      {/* `.tc-doc-topbar` porte le collage, le `z-index` et un sol opaque :
          l'enveloppe `Glass` de `Topbar` ouvre son propre contexte
          d'empilement, et le flou du verre n'échantillonne ainsi qu'un aplat.
          Un `<div>` laisse au `<header>` son rôle `banner`. `elevated={false}` :
          l'arête `--doc-shell-edge` sépare déjà la barre du contenu. */}
      <div className="tc-doc-topbar" ref={topbarRef}>
        <Topbar
          className="tc-doc-topbar__bar"
          rootClassName="tc-doc-topbar__glass"
          size="large"
          elevated={false}
        >
          {/* La marque est le lien de retour à l'accueil : un `<a>` en enfant,
              favicon compris, plutôt que `icon`/`title`/`subtitle`, qui rendent
              des `<span>`. */}
          <Topbar.Brand className="tc-doc-topbar__side tc-doc-topbar__brand-container">
            <a className="tc-doc-topbar__brand" href={hrefFor(HOME_SLUG)}>
              <img className="tc-doc-topbar__glyph" src="/favicon.svg" alt="" aria-hidden="true" />
              <span className="tc-doc-topbar__brand-name" aria-label={SITE_NAME}>
                <span>Opale</span>
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
                sections={fullBleed ? { pages, language } : undefined}
              />
            </details>
          </Topbar.Section>

          {/* La recherche est la section élastique (`grow`), entre la marque
              et les contrôles. */}
          <Topbar.Section className="tc-doc-topbar__field" grow align="center">
            <DocSearch pages={pages} language={language} />
          </Topbar.Section>

          {/* Le séparateur appartient aux actions : les pistes latérales sont
              égales (`flex: 1 1 0`), un `Topbar.Divider` frère décentrerait le
              champ. */}
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
        {/* Une page pleine largeur n'a pas de sommaire : le menu de la barre du
            haut en reprend les rubriques. */}
        {fullBleed ? null : (
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
        )}

        <div className="tc-doc-column">
          <main
            className={`tc-doc-main${fullBleed ? ' tc-doc-main--full-bleed' : ''}${!fullBleed && page.slug === HOME_SLUG ? ' tc-doc-main--home' : ''}${page.group === 'composants' ? ' tc-doc-main--components' : ''}`}
            id="contenu"
          >
            {/* La page pleine largeur rend son propre `<h1>`, avec
                `titleProps`, et traduit son corps : ni titre ni avis ici. */}
            {fullBleed ? null : (
              <h1 className="tc-doc-page__title" ref={titleRef} tabIndex={-1}>
                {pageTitle}
              </h1>
            )}
            {!fullBleed && copy.contentLanguageNotice ? (
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
              <PageContent page={page} context={pageContext} />
            </PageBoundary>
          </main>
          <DocFooter copy={copy} />
        </div>
      </div>
    </div>
  );
}
