import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { Sidebar } from '../opale';
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
/* Le rail compact (30 à 60 rem) garde 12 px aux titres et 14 px aux liens :
   sous 10 rem, ces libellés ne tiennent plus, même sur deux lignes. */
export const DOC_NAV_WIDTH_MOBILE_MIN = 10 * 16;
export const DOC_NAV_WIDTH_MOBILE_MAX = 14 * 16;
export const DOC_NAV_WIDTH_MOBILE_DEFAULT = 12 * 16;
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
 * la librairie (`Sidebar`, `.Header`, `.Items`).
 *
 * Les entrées sont des `<a href>` dans `Sidebar.Items`, et non des
 * `Sidebar.Item`, qui rendent des `<button>` : une adresse doit rester un lien.
 * Pas de titre de section : la nav précède le `<h1>` dans le DOM. Chaque groupe
 * se plie par un bouton natif, sa liste reste montée et nommée par
 * `aria-labelledby` ; le lien courant rouvre son groupe à la navigation.
 */
export function DocNav({ pages, currentSlug, resize, language = 'FR' }: DocNavProps) {
  const sections = navSectionsForPages(pages);
  const activeSectionId = sections.find((section) =>
    section.entries.some(({ page }) => page.slug === currentSlug),
  )?.id;
  const copy = copyFor(language);
  const [closedSections, setClosedSections] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );

  /* Le groupe d'une nouvelle page redevient visible, même s'il avait été plié
     ailleurs. Les autres gardent leur choix, sans effet de synchronisation. */
  const isSectionExpanded = (id: string) => {
    const closedAtSlug = closedSections.get(id);
    return closedAtSlug === undefined || (id === activeSectionId && closedAtSlug !== currentSlug);
  };

  const toggleSection = (id: string) => {
    setClosedSections((closed) => {
      const next = new Map(closed);
      const closedAtSlug = closed.get(id);
      const expanded =
        closedAtSlug === undefined || (id === activeSectionId && closedAtSlug !== currentSlug);
      if (expanded) next.set(id, currentSlug);
      else next.delete(id);
      return next;
    });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLSpanElement>(null);
  const dragRef = useRef<ScrollbarDrag | null>(null);
  const resizeDragRef = useRef<ResizeDrag | null>(null);
  const scrollbarStateRef = useRef<ScrollbarState>(INITIAL_SCROLLBAR_STATE);

  /* Sous 30 rem, le sommaire est replié au chargement pour laisser voir la
     page. Le bouton permet de retrouver le rail de la recette ; le choix de
     visibilité reste en place pendant la navigation. Au-delà, le rail est
     permanent et le bouton est masqué par la feuille de style. */
  const [menuOpen, setMenuOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  /* Échap replie le sommaire déplié quand le focus est dedans, et rend le
     focus à son bouton. Pressée ailleurs, la touche appartient à la page (une
     modale de démonstration, par exemple). */
  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (!(event.target instanceof Node) || !shellRef.current?.contains(event.target)) return;
      setMenuOpen(false);
      menuToggleRef.current?.focus();
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

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
      attributeFilter: ['hidden'],
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
    /* `Sidebar` rend son `<aside>` dans un `Glass` qui ouvre un contexte
       d'empilement et prend `fit-content` : le collage, la piste de grille et
       le sol opaque vivent donc sur cette enveloppe. */
    <div className="tc-doc-nav" data-menu={menuOpen ? 'open' : 'closed'} ref={shellRef}>
      <button
        type="button"
        className="tc-doc-nav__menu"
        ref={menuToggleRef}
        aria-expanded={menuOpen}
        aria-controls="tc-doc-nav-scroll"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {copy.contents}
      </button>
      {menuOpen && (
        <div className="tc-doc-nav__shortcuts" role="group" aria-label="Rubriques du sommaire">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setClosedSections((closed) => {
                  if (!closed.has(section.id)) return closed;
                  const next = new Map(closed);
                  next.delete(section.id);
                  return next;
                });
                const target = document.getElementById(`tc-doc-nav-section-${section.id}`);
                if (target && scrollRef.current)
                  scrollRef.current.scrollTop = target.offsetTop - scrollRef.current.offsetTop;
              }}
            >
              {sectionLabelFor(section.id, section.label, language)}
            </button>
          ))}
        </div>
      )}
      <Sidebar
        /* Un nom à elle : les démos rendent aussi des Sidebar, sans nom. */
        aria-label={copy.documentation}
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
              const sectionId = `tc-doc-nav-section-${section.id}`;
              const listId = `tc-doc-nav-list-${section.id}`;
              const expanded = isSectionExpanded(section.id);

              return (
                <section className="tc-doc-nav__group" key={section.id} aria-labelledby={sectionId}>
                  <button
                    className="tc-doc-nav__grouptitle"
                    id={sectionId}
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={listId}
                    onClick={() => toggleSection(section.id)}
                  >
                    {sectionLabel}
                  </button>
                  <ul
                    className="tc-doc-nav__list"
                    id={listId}
                    aria-labelledby={sectionId}
                    hidden={!expanded}
                  >
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
        {/* DANS LE REPÈRE DU SOMMAIRE : hors de tout repère, la poignée était
            un contenu orphelin pour qui navigue par régions. */}
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
      </Sidebar>
    </div>
  );
}
