import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
} from 'react';
import clsx from 'clsx';

import { mergeRefs } from '../../shared/merge-refs';
import { isBelowFold } from './reveal-fold';
import styles from './style/Reveal.module.css';

/* =============================================================================
   L'APPARITION AU DÉFILEMENT : UN BLOC QUI MONTE QUAND IL ENTRE DANS LA VUE.

   VISIBLE AU REPOS, TOUJOURS. Le serveur, et une page sans script, rendent le
   contenu à son état final : ni opacité nulle, ni `hidden`, ni transformation
   en ligne. Aucun contenu n'attend un script pour exister.

   LE NATIF D'ABORD. Là où `animation-timeline: view()` existe, la montée est
   une animation CSS liée à la vue de l'élément : la feuille fait tout, le
   script ne crée rien.

   LE REPLI NE CACHE QUE CE QUI EST SOUS LA VUE. Ailleurs, un
   `IntersectionObserver` prend le relais, mais pour les seuls éléments sous
   la ligne de flottaison au montage : ceux-là passent en attente
   (`data-reveal="pending"`) dans un effet de mise en page, avant la première
   peinture, puis sont montrés (`shown`) à leur entrée. Un élément déjà à
   l'écran n'est jamais caché, pas même une image. Sans observateur, ou sous
   `prefers-reduced-motion: reduce`, rien n'est caché.

   SEULS `transform` ET `opacity` S'ANIMENT : la boîte est en place dès la
   première image, la mise en page ne bouge pas.
   ========================================================================== */

/** Les balises qu'une apparition peut rendre. */
export type RevealElement =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'li'
  | 'figure';

export interface RevealProps extends ComponentPropsWithRef<'div'> {
  /**
   * La balise rendue. Défaut : `div`. `ref` reste typée `HTMLDivElement` ;
   * avec `as`, elle reçoit l'élément effectivement rendu.
   */
  as?: RevealElement;
  /**
   * Le rang dans une cascade : la montée part `delay` × `--opale-reveal-stagger`
   * (60 ms par défaut) plus tard. Absent : aucun décalage.
   */
  delay?: number;
  /**
   * Montre l'élément une fois, sans jamais le recacher. Défaut : `true`. À
   * `false`, le repli le remet en attente quand il repasse sous la vue ; la
   * montée native, liée au défilement, se rejoue de toute façon à chaque
   * entrée par le bas.
   */
  once?: boolean;
}

type RevealState = 'pending' | 'shown';

/* Le natif : une animation liée à la vue, que la feuille pose seule. */
const supportsViewTimeline = () =>
  typeof CSS !== 'undefined' && !!CSS.supports?.('animation-timeline: view()');

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Un bloc qui monte en fondu quand il entre dans la vue, visible au repos. */
export function Reveal({
  as = 'div',
  delay,
  once = true,
  className,
  style,
  ref,
  ...rest
}: RevealProps) {
  /* UNE SEULE SIGNATURE DE TYPE POUR TOUTES LES BALISES, comme `Stack`. */
  const Tag = as as 'div';
  const local = useRef<HTMLDivElement>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => mergeRefs(local, ref)(node),
    [ref],
  );
  /* Absent au serveur et à l'hydratation : le contenu est à son état final. */
  const [state, setState] = useState<RevealState>();

  useLayoutEffect(() => {
    const node = local.current;
    if (
      !node ||
      supportsViewTimeline() ||
      typeof IntersectionObserver === 'undefined' ||
      prefersReducedMotion() ||
      !isBelowFold(node.getBoundingClientRect(), window.innerHeight)
    ) {
      return;
    }
    setState('pending');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('shown');
            if (once) observer.disconnect();
          } else if (!once && isBelowFold(entry.boundingClientRect, window.innerHeight)) {
            setState('pending');
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      {...rest}
      ref={setRef}
      data-reveal={state}
      className={clsx('opale-reveal', styles.root, className)}
      style={
        delay !== undefined && delay > 0
          ? ({ ...style, '--opale-reveal-index': delay } as CSSProperties)
          : style
      }
    />
  );
}
