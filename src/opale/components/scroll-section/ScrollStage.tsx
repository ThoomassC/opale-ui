import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from 'react';
import clsx from 'clsx';

import { ScrollContext, type ScrollGround } from './scroll-context';
import styles from './style/ScrollSection.module.css';

/* =============================================================================
   LA SCÈNE : ELLE DIT QUELLE SECTION EST ACTIVE, ELLE NE LES REPEINT JAMAIS.

   POURQUOI ELLE NE REPEINT PAS. Fondre le fond de toute la page pendant que
   chaque section garde son encre pose, à mi-chemin, le texte d'une section
   sur le fond d'une autre — une encre ambrée sur la nuit ne se lit plus.
   Chaque `ScrollSection` peint donc son propre couple ; la scène ne fait
   qu'EXPOSER celui de la section active : l'attribut `data-ground` et les
   propriétés `--opale-stage-ground` / `--opale-stage-ink`, que la feuille
   pose et qu'un en-tête, une gouttière ou une navigation collante lisent.
   Son propre fond — visible là où aucune section ne la couvre — fond d'un
   couple à l'autre en `--opale-stage-duration`.

   LA SECTION ACTIVE est celle qui croise le milieu de la vue : un seul
   observateur pour toute la scène, réduit à la ligne du milieu
   (`rootMargin: -50% 0px -50% 0px`). Un saut (touche Fin, ancre) finit sur
   la section d'arrivée : c'est la seule qui croise la ligne.

   AUCUN ÉCART À L'HYDRATATION. Le fond de départ est lu AU RENDU, dans les
   enfants : le premier qui porte une prop `ground`. Le serveur l'écrit déjà ;
   sans script, à l'impression, avant l'hydratation, la scène a ce fond, sans
   transition. Le mouvement réduit garde le suivi — c'est une information —
   mais sans fondu.
   ========================================================================== */

/** Les balises qu'une scène peut rendre. */
export type ScrollStageElement = 'div' | 'main' | 'article';

export interface ScrollStageProps extends ComponentPropsWithRef<'div'> {
  /**
   * La balise rendue. Défaut : `div`. `ref` reste typée `HTMLDivElement` ;
   * avec `as`, elle reçoit l'élément effectivement rendu.
   */
  as?: ScrollStageElement;
  /**
   * Appelée quand le fond de la scène change — une autre section croise le
   * milieu de la vue —, avec le nouveau fond. Jamais au montage, jamais deux
   * fois de suite pour le même fond.
   */
  onGroundChange?: (ground: ScrollGround) => void;
}

/**
 * La scène qui suit la `ScrollSection` active et expose son couple
 * (`data-ground`, `--opale-stage-ground`, `--opale-stage-ink`) à ce qu'elle
 * contient. Elle ne repeint jamais les sections. Un texte posé directement
 * sur la scène, hors section, passe pendant le fondu par des couples
 * intermédiaires : il lit plutôt `--opale-stage-*` sur son propre fond, qui
 * change d'un coup.
 */
export function ScrollStage({
  as = 'div',
  onGroundChange,
  className,
  children,
  ref,
  ...rest
}: ScrollStageProps) {
  const Tag = as as 'div';
  /* Le fond de départ, lu au rendu : le premier enfant qui porte `ground`. */
  const first =
    Children.toArray(children)
      .map((child) => (isValidElement<{ ground?: ScrollGround }>(child) ? child.props.ground : 0))
      .find(Boolean) || 'paper';
  const [active, setActive] = useState<ScrollGround>();
  const ground = active ?? first;
  const shown = useRef(ground);
  /* Les sections inscrites, et l'observateur qui les suit. Les refs des
     sections s'attachent avant les effets de la scène : l'effet observe donc
     celles déjà inscrites, et chaque inscription suivante s'ajoute. */
  const nodes = useRef(new Set<HTMLElement>());
  const observer = useRef<IntersectionObserver>(undefined);

  const register = useCallback((node: HTMLElement) => {
    nodes.current.add(node);
    observer.current?.observe(node);
    return () => {
      nodes.current.delete(node);
      observer.current?.unobserve(node);
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const watcher = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setActive(entry.target.getAttribute('data-ground') as ScrollGround);
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    observer.current = watcher;
    for (const node of nodes.current) watcher.observe(node);
    return () => {
      watcher.disconnect();
      observer.current = undefined;
    };
  }, []);

  /* Au changement seulement, avec le `onGroundChange` le plus récent. */
  useEffect(() => {
    if (shown.current !== ground) {
      shown.current = ground;
      onGroundChange?.(ground);
    }
  });

  return (
    <Tag
      {...rest}
      ref={ref}
      data-ground={ground}
      className={clsx('opale-scroll-stage', styles.stage, className)}
    >
      <ScrollContext value={register}>{children}</ScrollContext>
    </Tag>
  );
}
