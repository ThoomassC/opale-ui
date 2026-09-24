import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { Sidebar } from '../magic';
import type { DocPage } from './doc-model';
import { hrefFor, navSectionsForPages } from './doc-model';
import { copyFor, pageLabelFor, sectionLabelFor, type Language } from './localization';
import { UI_VERSION } from './version';

export interface DocNavProps {
  readonly pages: readonly DocPage[];
  readonly language?: Language;
  /**
   * Le slug de la page RÉELLEMENT rendue, repli compris. La coquille passe
   * `page.slug` et non le fragment brut : sur `#/inconnu`, c'est l'accueil qui
   * est à l'écran, donc c'est l'accueil qui porte `aria-current`.
   */
  readonly currentSlug: string;
  /**
   * Contrôle optionnel de la largeur du rail. Il reste optionnel pour que
   * `DocNav` puisse continuer à être utilisé seul dans les intégrations et
   * dans ses tests ; la coquille complète active le redimensionnement.
   */
  readonly resize?: DocNavResize;
}

export interface DocNavResize {
  readonly width: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** Mise à jour visuelle pendant le glissement, sans imposer un rendu React. */
  readonly onPreview?: (width: number) => void;
  readonly onChange: (width: number) => void;
  /** Validation de la dernière largeur quand le pointeur est relâché. */
  readonly onCommit?: (width: number) => void;
}

export const DOC_NAV_WIDTH_MIN = 14 * 16;
export const DOC_NAV_WIDTH_MAX = 30 * 16;
export const DOC_NAV_WIDTH_DEFAULT = 17 * 16;
export const DOC_NAV_WIDTH_MOBILE_MIN = 6 * 16;
export const DOC_NAV_WIDTH_MOBILE_MAX = 14 * 16;
export const DOC_NAV_WIDTH_MOBILE_DEFAULT = 8.5 * 16;
export const DOC_NAV_WIDTH_STEP = 16;

interface ScrollbarState {
  readonly size: number;
  readonly offset: number;
  readonly scrollTop: number;
  readonly maxScrollTop: number;
}

interface ScrollbarDrag {
  readonly pointerId: number;
  readonly startY: number;
  readonly startScrollTop: number;
  readonly maxScrollTop: number;
  readonly travel: number;
}

interface ResizeDrag {
  readonly pointerId: number;
  readonly startX: number;
  readonly startWidth: number;
  width: number;
}

const INITIAL_SCROLLBAR_STATE: ScrollbarState = {
  size: 0.28,
  offset: 0,
  scrollTop: 0,
  maxScrollTop: 0,
};

/**
 * La barre de navigation du site de documentation, bâtie avec le `Sidebar` de
 * la librairie.
 *
 * =============================================================================
 * CE QUI A CHANGÉ, ET CE QUI N'A PAS BOUGÉ
 *
 * La colonne était du HTML natif habillé par `doc.css`. Elle est désormais un
 * `Sidebar` — `Sidebar`, `.Header` et `.Items` — parce que la vitrine doit
 * manger sa propre cuisine. Le rail reste une navigation statique, toujours
 * visible, et le composant vendoré conserve la surface qu'il sait rendre.
 *
 * `Sidebar.Item` N'EST PAS EMPLOYÉ, ET C'EST LA SEULE PIÈCE NON ADOPTÉE.
 * Il est câblé sur `<button>` — `ComponentPropsWithoutRef<"button">`,
 * `forwardRef<HTMLButtonElement>`, aucune prop `as`. Les entrées
 * du sommaire sont des ADRESSES : les rendre en boutons retirerait le clic
 * milieu, le « copier le lien », l'ouverture dans un onglet, et ferait annoncer
 * « bouton » là où un lecteur d'écran doit dire « lien ». `Sidebar.Items` est un
 * `<nav>` nu qui rend ses enfants : les vrais `<a href>` y vivent, et `doc.css`
 * les accorde au reste. Corriger `Sidebar.Item` demanderait de toucher du code
 * vendoré, ce qui n'est pas une décision de ce fichier.
 *
 * AUCUN TITRE DE SECTION ICI, ET C'EST DÉLIBÉRÉ. La nav précède le contenu
 * dans le DOM ; un `<h2>` par groupe placerait plusieurs titres de niveau 2 avant
 * le `<h1>` de la page, c'est-à-dire un plan de document inversé pour qui
 * navigue par titres. Les libellés de groupe sont donc des `<div>` statiques —
 * ni `<h2>` ni `<h3>` —, et chaque liste est nommée par `aria-label`.
 *
 * Les groupes ne sont pas pliables : le rail reste permanent et aucun bouton
 * de navigation secondaire ne concurrence les onglets du header.
 *
 * Les libellés sont nommés par `aria-labelledby` afin que chaque liste
 * reste clairement associée à sa famille sans introduire de titre hiérarchique.
 * ==========================================================================
 */
export function DocNav({ pages, currentSlug, resize, language = 'FR' }: DocNavProps) {
  const sections = navSectionsForPages(pages);
  const copy = copyFor(language);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLSpanElement>(null);
  const dragRef = useRef<ScrollbarDrag | null>(null);
  const resizeDragRef = useRef<ResizeDrag | null>(null);
  const scrollbarStateRef = useRef<ScrollbarState>(INITIAL_SCROLLBAR_STATE);

  /* Sous 30 rem, le sommaire s'affiche au-dessus de la page comme sur la
     recette. Le bouton permet de le replier pour gagner de la place ; ce
     choix reste en place pendant la navigation. Au-delà, le rail permanent
     reste visible et le bouton est masqué par la feuille de style. */
  const [menuOpen, setMenuOpen] = useState(true);

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) return;

    /* Le rail défile souvent au même rythme que la molette. Modifier l'état
       React à chaque événement forçait le rendu de l'intégralité des entrées
       du sommaire et créait un retard perceptible. Le thumb est un indicateur
       décoratif : ses variables CSS et son état ARIA sont donc écrits
       directement dans le DOM, sans rerendre la navigation. */
    const applyScrollbarState = (next: ScrollbarState) => {
      scrollbarStateRef.current = next;

      const scrollbarElement = scrollbarRef.current;
      const thumbElement = scrollbarElement?.firstElementChild;

      if (thumbElement instanceof HTMLElement) {
        thumbElement.style.setProperty('--tc-doc-nav-thumb-size', `${next.size * 100}%`);
        thumbElement.style.setProperty('--tc-doc-nav-thumb-offset', `${next.offset * 100}%`);
      }

      if (!scrollbarElement) return;

      scrollbarElement.setAttribute('aria-valuemax', String(Math.round(next.maxScrollTop)));
      scrollbarElement.setAttribute('aria-valuenow', String(Math.round(next.scrollTop)));
      scrollbarElement.setAttribute(
        'aria-valuetext',
        next.maxScrollTop === 0
          ? copy.contentsStart
          : `${Math.round((next.scrollTop / next.maxScrollTop) * 100)} %`,
      );
    };

    const updateScrollbar = () => {
      const viewport = scrollElement.clientHeight;
      const content = scrollElement.scrollHeight;
      const maxScrollTop = Math.max(0, content - viewport);

      if (!viewport || maxScrollTop === 0) {
        applyScrollbarState({ size: 1, offset: 0, scrollTop: 0, maxScrollTop: 0 });
        return;
      }

      const size = Math.max(0.14, Math.min(1, viewport / content));
      const offset = (scrollElement.scrollTop / maxScrollTop) * (1 - size);

      applyScrollbarState({ size, offset, scrollTop: scrollElement.scrollTop, maxScrollTop });
    };

    updateScrollbar();
    scrollElement.addEventListener('scroll', updateScrollbar, { passive: true });
    window.addEventListener('resize', updateScrollbar);
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateScrollbar);
    const mutationObserver =
      resizeObserver && typeof MutationObserver !== 'undefined'
        ? new MutationObserver(updateScrollbar)
        : undefined;

    /* Les dimensions d'un conteneur Glass peuvent être nulles au premier
       effet, avant sa mise en page finale. Le recalcul différé n'est utile que
       dans un vrai navigateur : jsdom n'a ni layout ni ResizeObserver, et le
       programmer dans les tests créerait des mises à jour hors `act()`. */
    const frame = resizeObserver ? window.requestAnimationFrame(updateScrollbar) : undefined;
    const timeout = resizeObserver ? window.setTimeout(updateScrollbar, 0) : undefined;
    resizeObserver?.observe(scrollElement);
    mutationObserver?.observe(scrollElement, {
      attributes: true,
      attributeFilter: ['open'],
      childList: true,
      subtree: true,
    });

    return () => {
      scrollElement.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', updateScrollbar);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      if (timeout !== undefined) window.clearTimeout(timeout);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [copy.contentsStart, pages.length]);

  const handleScrollbarPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    const scrollElement = scrollRef.current;
    const scrollbarElement = scrollbarRef.current;

    const scrollbarState = scrollbarStateRef.current;

    if (!scrollElement || !scrollbarElement || scrollbarState.maxScrollTop === 0) return;

    const trackHeight = scrollbarElement.getBoundingClientRect().height;
    const thumbHeight = event.currentTarget.getBoundingClientRect().height;

    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: scrollElement.scrollTop,
      maxScrollTop: scrollbarState.maxScrollTop,
      travel: Math.max(1, trackHeight - thumbHeight),
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const handleScrollbarPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const scrollElement = scrollRef.current;
    const drag = dragRef.current;

    if (!scrollElement || !drag || event.pointerId !== drag.pointerId) return;

    const nextScrollTop =
      drag.startScrollTop + ((event.clientY - drag.startY) / drag.travel) * drag.maxScrollTop;

    scrollElement.scrollTop = Math.max(0, Math.min(drag.maxScrollTop, nextScrollTop));
  };

  const stopScrollbarDrag = (event: PointerEvent<HTMLSpanElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
  };

  const handleScrollbarKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const scrollElement = scrollRef.current;

    const scrollbarState = scrollbarStateRef.current;

    if (!scrollElement || scrollbarState.maxScrollTop === 0) return;

    const step = Math.max(24, scrollElement.clientHeight * 0.8);
    let nextScrollTop: number | undefined;

    switch (event.key) {
      case 'ArrowUp':
        nextScrollTop = scrollElement.scrollTop - step;
        break;
      case 'ArrowDown':
        nextScrollTop = scrollElement.scrollTop + step;
        break;
      case 'PageUp':
        nextScrollTop = scrollElement.scrollTop - scrollElement.clientHeight;
        break;
      case 'PageDown':
        nextScrollTop = scrollElement.scrollTop + scrollElement.clientHeight;
        break;
      case 'Home':
        nextScrollTop = 0;
        break;
      case 'End':
        nextScrollTop = scrollbarState.maxScrollTop;
        break;
      default:
        return;
    }

    event.preventDefault();
    scrollElement.scrollTop = Math.max(0, Math.min(scrollbarState.maxScrollTop, nextScrollTop));
  };

  const clampResizeWidth = (width: number) => {
    if (!resize) return width;

    return Math.max(resize.min, Math.min(resize.max, width));
  };

  const handleResizePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!resize) return;

    resizeDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: resize.width,
      width: resize.width,
    };
    event.currentTarget.closest('.tc-doc-nav')?.setAttribute('data-resizing', 'true');
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const handleResizePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = resizeDragRef.current;

    if (!resize || !drag || event.pointerId !== drag.pointerId) return;

    const nextWidth = clampResizeWidth(drag.startWidth + event.clientX - drag.startX);

    drag.width = nextWidth;
    event.currentTarget.setAttribute('aria-valuenow', String(nextWidth));

    if (resize.onPreview) {
      resize.onPreview(nextWidth);
    } else {
      resize.onChange(nextWidth);
    }
  };

  const stopResizeDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = resizeDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    resize?.onCommit?.(drag.width);
    event.currentTarget.closest('.tc-doc-nav')?.removeAttribute('data-resizing');
    resizeDragRef.current = null;
  };

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!resize) return;

    const step = event.shiftKey ? resize.step * 2 : resize.step;
    let nextWidth: number | undefined;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        nextWidth = resize.width - step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        nextWidth = resize.width + step;
        break;
      case 'Home':
        nextWidth = resize.min;
        break;
      case 'End':
        nextWidth = resize.max;
        break;
      default:
        return;
    }

    event.preventDefault();
    resize.onChange(clampResizeWidth(nextWidth));
  };

  return (
    /* L'ENVELOPPE EST À MOI, POUR LA MÊME RAISON QUE CELLE DE LA BARRE DU
       HAUT : `Sidebar` rend son `<aside>` dans un `Glass`, dont l'enveloppe
       est un contexte d'empilement et dont la largeur est `fit-content`. Le
       collant, la piste de grille et le sol opaque vivent donc dehors. Elle
       porte la surface visible, tandis que le rail statique porte l'état du
       sommaire sans contrôle de pliage. */
    <div className="tc-doc-nav" data-menu={menuOpen ? 'open' : 'closed'}>
      <button
        type="button"
        className="tc-doc-nav__menu"
        aria-expanded={menuOpen}
        aria-controls="tc-doc-nav-scroll"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {copy.contents}
      </button>
      <Sidebar
        className="tc-doc-nav__panel"
        /* L'ENVELOPPE A BESOIN DE SON PROPRE CROCHET, et pas seulement le
           contenu : c'est elle qui porte le rayon, le fond et l'arête de la
           coquille. `className` va sur l'`<aside>`, à l'intérieur du verre ;
           `rootClassName` va sur l'enveloppe, qui est la surface visible. */
        rootClassName="tc-doc-nav__glass"
      >
        <div className="tc-doc-nav__scroll" id="tc-doc-nav-scroll" ref={scrollRef}>
          {/* L'EN-TÊTE RESTE DANS LA COLONNE DÉFILANTE. Il est masqué visuellement
              par la couche V3 pour laisser le plan du catalogue commencer dès le
              premier groupe, mais sa structure est conservée pour les lecteurs
              et pour les intégrations qui réutilisent ce composant. */}
          <Sidebar.Header className="tc-doc-nav__head">
            <div className="tc-doc-nav__heading">
              <span className="tc-doc-nav__eyebrow">Opale UI</span>
              <span className="tc-doc-nav__title">{copy.documentation}</span>
            </div>
          </Sidebar.Header>

          {/* `Sidebar.Items` EST LE POINT DE REPÈRE DE NAVIGATION. C'est un
              `<nav>` nu : le nommer « Sommaire » est ce qui le fait annoncer
              « Sommaire, navigation », et les vrais liens restent des `<a>`. */}
          <Sidebar.Items className="tc-doc-nav__items" aria-label={copy.contents}>
            <p className="tc-doc-nav__version">
              <span className="tc-doc-nav__versionnumber">v{UI_VERSION}</span>
              <span className="tc-doc-nav__versionnote">
                {copy.stable} <span aria-hidden="true">·</span> React ≥ 19
              </span>
            </p>

            {sections.map((section) => {
              const sectionLabel = sectionLabelFor(section.id, section.label, language);

              return (
                <section
                  className="tc-doc-nav__group"
                  key={section.id}
                  aria-labelledby={'tc-doc-nav-section-' + section.id}
                >
                  <div className="tc-doc-nav__grouptitle" id={'tc-doc-nav-section-' + section.id}>
                    {sectionLabel}
                  </div>
                  <ul className="tc-doc-nav__list" aria-label={sectionLabel}>
                    {section.entries.map(({ page, label }) => {
                      const localizedLabel = pageLabelFor(page, language, label);

                      return (
                        <li key={page.slug}>
                          <a
                            className="tc-doc-nav__link"
                            href={hrefFor(page.slug)}
                            aria-current={page.slug === currentSlug ? 'page' : undefined}
                            title={localizedLabel}
                          >
                            {localizedLabel}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </Sidebar.Items>
        </div>

        <span
          className="tc-doc-nav__scrollbar"
          ref={scrollbarRef}
          role="scrollbar"
          aria-label={copy.contentsScroll}
          aria-controls="tc-doc-nav-scroll"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={0}
          aria-valuenow={0}
          aria-valuetext={copy.contentsStart}
          tabIndex={0}
          onKeyDown={handleScrollbarKeyDown}
        >
          <span
            className="tc-doc-nav__scrollbar-thumb"
            onPointerDown={handleScrollbarPointerDown}
            onPointerMove={handleScrollbarPointerMove}
            onPointerUp={stopScrollbarDrag}
            onPointerCancel={stopScrollbarDrag}
          >
            <span className="tc-doc-nav__scrollbar-grip" />
          </span>
        </span>
      </Sidebar>

      {resize ? (
        <div
          className="tc-doc-nav__resize"
          role="slider"
          aria-label={copy.contentsWidth}
          aria-orientation="horizontal"
          aria-valuemin={resize.min}
          aria-valuemax={resize.max}
          aria-valuenow={resize.width}
          tabIndex={0}
          onKeyDown={handleResizeKeyDown}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={stopResizeDrag}
          onPointerCancel={stopResizeDrag}
        >
          <span aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}
