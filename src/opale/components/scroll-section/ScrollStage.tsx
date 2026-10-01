import {
  Children,
  Fragment,
  isValidElement,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import { ScrollSection, type ScrollGround } from './ScrollSection';
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

   LA SECTION ACTIVE SE MESURE, ELLE NE S'OBSERVE PAS. Un observateur réduit
   à la ligne du milieu ne signalait jamais une bande plus courte que la
   demi-vue en bas ou en haut de page, laissait un fond périmé à une section
   imbriquée et prévenait dès le montage. À chaque image où la page défile ou
   se redimensionne, la scène relit les boîtes de ses sections — elles sont
   peu nombreuses —, trouvées dans son propre DOM, et prend, parmi celles
   dont l'intervalle demi-ouvert `[haut, bas[` contient la ligne de
   référence, la DERNIÈRE dans l'ordre du document : une section imbriquée
   gagne tant que la ligne est en elle. La ligne est le milieu de la vue ; en
   haut du document, la première section visible gagne, en bas, la dernière.
   Rien ne contient la ligne : le fond reste. Les sections d'une scène
   imbriquée comptent aussi pour celle-ci, comme toute section imbriquée.

   AUCUN FONDU NI APPEL AU MONTAGE. Le fond de départ est lu AU RENDU
   (`initialGround`, sinon la première `ScrollSection` des enfants) et écrit
   par le serveur avec `data-instant`, qui retire la transition. La première
   mesure — à l'hydratation, puis à la première image, qui rattrape un
   défilement restauré ou une ancre — corrige le fond d'un coup, sans
   `onGroundChange`. Seul un défilement ensuite retire `data-instant`, dans le
   même rendu que le nouveau fond : celui-là fond.

   LA FENÊTRE SEULEMENT. La scène mesure contre la vue du document : une
   scène dans un conteneur qui défile lui-même, ou dans une `iframe` d'une
   autre origine, n'est pas prise en charge.
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
   * Le fond rendu avant la première mesure — au serveur, sans script, à
   * l'impression. Défaut : celui de la première `ScrollSection` des enfants,
   * fragments compris ; une section enveloppée dans un autre composant ne s'y
   * voit pas, et la scène retombe alors sur `paper`.
   */
  initialGround?: ScrollGround;
  /**
   * Appelée quand le fond de la scène change au défilement, avec le nouveau
   * fond. Jamais au montage, jamais deux fois de suite pour le même fond.
   */
  onGroundChange?: (ground: ScrollGround) => void;
}

/* La première `ScrollSection` des enfants, fragments compris. */
const firstGround = (children: ReactNode): ScrollGround | undefined => {
  for (const child of Children.toArray(children)) {
    const ground =
      isValidElement<{ ground: ScrollGround; children?: ReactNode }>(child) &&
      (child.type === ScrollSection
        ? child.props.ground
        : child.type === Fragment && firstGround(child.props.children));
    if (ground) return ground;
  }
};

/**
 * La scène qui suit la `ScrollSection` active et expose son couple
 * (`data-ground`, `--opale-stage-ground`, `--opale-stage-ink`) à ce qu'elle
 * contient. Elle ne repeint jamais les sections. Un texte posé directement
 * sur la scène, hors section, passe pendant le fondu par des couples
 * intermédiaires : il lit plutôt `--opale-stage-*` sur son propre fond, qui
 * change d'un coup.
 */
export function ScrollStage({
  as: Tag = 'div',
  initialGround,
  onGroundChange,
  className,
  children,
  ref,
  ...rest
}: ScrollStageProps) {
  const local = useRef<HTMLDivElement>(null);
  /* La ref de l'appelant reçoit le même nœud, sans `mergeRefs` : un module de
     plus coûte son en-tête au budget de poids. */
  useImperativeHandle(ref, () => local.current as HTMLDivElement);
  /* Le fond mesuré, et s'il vient d'un vrai défilement : `data-instant`
     retire le fondu tant qu'il n'en vient pas. Un seul état, posé d'un coup
     avec le fond : celui-là fond. */
  const [active, setActive] = useState<[ScrollGround, boolean]>();
  const onChange = useRef(onGroundChange);
  useLayoutEffect(() => {
    onChange.current = onGroundChange;
  });

  /* Avant la peinture : une scène hydratée au milieu de la page prend la
     bonne section avant d'être vue. */
  useLayoutEffect(() => {
    const stage = local.current as HTMLElement;
    let calls = 0;
    let frame = 0;
    const measure = () => {
      frame = 0;
      /* Les deux premières mesures — le montage, puis sa première image, qui
         rattrape un défilement restauré — restent muettes. */
      const live = calls++ > 1;
      const height = innerHeight;
      const top = scrollY <= 0;
      const bottom = scrollY + height >= document.documentElement.scrollHeight - 1;
      let next: string | undefined;
      for (const node of stage.querySelectorAll<HTMLElement>('.opale-scroll-section')) {
        const box = node.getBoundingClientRect();
        /* En haut, la première qui n'est pas au-dessus de la vue ; en bas,
           la dernière qui n'est pas en dessous ; ailleurs, la dernière qui
           contient la ligne du milieu. Une section d'une scène imbriquée
           compte aussi, comme toute section imbriquée. */
        if (
          top
            ? box.bottom > 0 && !next
            : bottom
              ? box.top < height
              : box.top <= height / 2 && height / 2 < box.bottom
        )
          next = node.dataset.ground;
      }
      /* Le fond affiché se relit sur la scène : il est déjà rendu quand la
         mesure suivante part, une image plus tard. */
      if (next && next !== stage.dataset.ground) {
        if (live) onChange.current?.(next as ScrollGround);
        setActive([next as ScrollGround, live]);
      }
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(measure);
    };
    const EVENTS = ['scroll', 'resize'];
    measure();
    schedule();
    for (const type of EVENTS) addEventListener(type, schedule);
    return () => {
      cancelAnimationFrame(frame);
      for (const type of EVENTS) removeEventListener(type, schedule);
    };
  }, []);

  return (
    <Tag
      {...rest}
      ref={local}
      data-ground={active?.[0] ?? initialGround ?? firstGround(children) ?? 'paper'}
      data-instant={active?.[1] ? undefined : ''}
      className={clsx('opale-scroll-stage', styles.stage, className)}
    >
      {children}
    </Tag>
  );
}
