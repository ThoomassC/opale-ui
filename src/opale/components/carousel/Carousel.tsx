import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import type { StackGap } from '../../catalog/layout';
import { resolveLabels } from '../../shared/labels';
import { useControllableState } from '../../shared/use-controllable-state';
import { nearestSlide, visibleSlides } from './carousel-geometry';
import styles from './style/Carousel.module.css';

/* =============================================================================
   LE CARROUSEL, SELON LE MOTIF « CAROUSEL » DE L'APG.

   LE DÉFILEMENT EST NATIF. La piste défile d'elle-même au doigt, au trackpad
   et à la molette, et s'aimante en CSS. Le script n'ajoute que ce que le
   navigateur ne fait pas : glisser à la souris, flèches, points, clavier,
   lecture automatique. Sans JavaScript, toutes les diapositives sont là, dans
   l'ordre, et la piste défile.

   LA VALEUR EST L'INDEX DE LA PREMIÈRE DIAPOSITIVE VISIBLE. Elle suit le
   défilement : chaque image de défilement mesure la piste, et la diapositive
   dont le bord de départ est le plus proche de celui de la piste devient la
   valeur — la dernière quand la piste est au bout. Pendant un défilement
   demandé (flèche, point, clavier), les positions intermédiaires ne
   remontent pas à l'appelant : seule la cible compte.

   CE QUI EST HORS DE LA PISTE EST INERTE. Une diapositive entièrement cachée
   reçoit `inert` : la tabulation ne s'y pose jamais hors de l'écran. Le calcul
   est pur (`carousel-geometry.ts`) ; tant qu'il n'a pas mesuré — au serveur,
   à l'hydratation —, rien n'est inerte.

   ANNONCER SANS COUPER LA PAROLE. La région polie ne reçoit « 2 sur 6 »
   qu'après un changement voulu ; la lecture automatique la vide au lieu de
   l'écrire (APG). Elle est vide au serveur.

   LA LECTURE AUTOMATIQUE se met en pause sous le pointeur, tant que le focus
   est dedans, et au bouton qu'elle rend toujours (WCAG 2.2.2). Sous
   `prefers-reduced-motion: reduce`, elle ne démarre pas d'elle-même et les
   défilements demandés sont instantanés.
   ========================================================================== */

/** Les textes de `Carousel`. */
export interface CarouselLabels {
  /** Le nom de la flèche de retour. Défaut : « Diapositive précédente ». */
  previous: string;
  /** Le nom de la flèche d'avance. Défaut : « Diapositive suivante ». */
  next: string;
  /** Le nom d'une diapositive, et l'annonce d'un changement. Défaut : « 2 sur 6 ». */
  slide: (index: number, total: number) => string;
  /** Le nom d'un point. Défaut : « Aller à la diapositive 3 ». */
  goTo: (index: number) => string;
  /** Le nom du groupe de points. Défaut : « Choisir une diapositive ». */
  dots: string;
  /** Le bouton qui suspend la lecture automatique. Défaut : « Mettre en pause ». */
  pause: string;
  /** Le bouton qui la reprend. Défaut : « Lire ». */
  play: string;
}

const DEFAULT_CAROUSEL_LABELS: CarouselLabels = {
  previous: 'Diapositive précédente',
  next: 'Diapositive suivante',
  slide: (index, total) => `${index} sur ${total}`,
  goTo: (index) => `Aller à la diapositive ${index}`,
  dots: 'Choisir une diapositive',
  pause: 'Mettre en pause',
  play: 'Lire',
};

export interface CarouselProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'children'
> {
  /** Le nom de la région, obligatoire : il dit ce que le carrousel fait défiler. */
  label: string;
  /** Les diapositives, des `CarouselSlide`. */
  children?: ReactNode;
  /** L'index de la première diapositive visible ; présent, il rend l'appelant maître. */
  value?: number;
  /** L'index de départ, sans contrôle. Défaut : 0. */
  defaultValue?: number;
  /** Appelée à chaque changement de diapositive, voulu ou par défilement, avec le nouvel index. */
  onValueChange?: (index: number) => void;
  /** La largeur d'une diapositive, en longueur CSS. Défaut : `min(78%, 22rem)`. */
  slideSize?: string;
  /** L'espace entre les diapositives, sur l'échelle `--opale-space-*`. Défaut : `md`. */
  gap?: StackGap;
  /** Affiche les flèches précédente et suivante. Défaut : `true`. */
  showArrows?: boolean;
  /** Affiche un point par diapositive. Défaut : `true`. */
  showDots?: boolean;
  /**
   * Avance d'une diapositive toutes les `autoPlay` millisecondes, et revient
   * à la première après la dernière. Rend un bouton pause / lecture. Ne
   * démarre pas sous `prefers-reduced-motion: reduce`. Absente : pas de
   * lecture automatique.
   */
  autoPlay?: number;
  /** Remplace les textes français, clé par clé. */
  labels?: Partial<CarouselLabels>;
}

export interface CarouselSlideProps extends ComponentPropsWithRef<'div'> {
  /** Le contenu de la diapositive. */
  children?: ReactNode;
}

interface SlideState {
  readonly label: string;
  readonly inert: boolean;
}

const SlideContext = createContext<SlideState | null>(null);

/* LA PRÉFÉRENCE DE MOUVEMENT, LUE SANS ÉCART D'HYDRATATION : `false` au
   serveur et pendant l'hydratation, la vraie valeur ensuite. Le magasin n'est
   pas écouté — un changement de préférence vaut au prochain montage —, ce
   qui épargne un abonnement au poids de l'import isolé. */
const subscribeNever = () => () => {};
const getReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const getServerReducedMotion = () => false;

const isRtl = (element: Element) => getComputedStyle(element).direction === 'rtl';

/* La classe stable d'une partie, et celle de la feuille. */
const part = (name: string) => clsx(`opale-carousel__${name}`, styles[name]);

/* L'index montré par la piste : la diapositive la plus proche du bord de
   départ, ou la dernière quand la piste est au bout. */
function shownSlide(track: HTMLElement, box: DOMRect, rects: readonly DOMRect[]): number {
  const max = track.scrollWidth - track.clientWidth;
  return max > 2 && Math.abs(track.scrollLeft) >= max - 2
    ? rects.length - 1
    : nearestSlide(box, rects, isRtl(track));
}

const rectsOf = (track: HTMLElement) =>
  Array.from(track.children, (child) => child.getBoundingClientRect());

/* Le délai au-delà duquel un défilement demandé est tenu pour fini, même si
   la cible n'a pas été atteinte : l'utilisateur a pu l'interrompre. */
const SETTLE_MS = 1000;

/** Une diapositive : un groupe nommé « 2 sur 6 », rendu dans la piste du `Carousel`. */
export function CarouselSlide({ className, ref, ...rest }: CarouselSlideProps) {
  const slide = useContext(SlideContext);
  return (
    <div
      role="group"
      aria-roledescription="diapositive"
      aria-label={slide?.label}
      inert={slide?.inert || undefined}
      {...rest}
      ref={ref}
      className={clsx(part('slide'), className)}
    />
  );
}

/** Le carrousel : une piste de diapositives qui défile, avec flèches, points et lecture automatique. */
export function Carousel({
  label,
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  slideSize,
  gap,
  showArrows = true,
  showDots = true,
  autoPlay,
  labels: labelsProp,
  className,
  style,
  children,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ref,
  ...rest
}: CarouselProps) {
  const labels = resolveLabels(DEFAULT_CAROUSEL_LABELS, labelsProp);
  const items = Children.toArray(children).filter(isValidElement);
  const total = items.length;
  const last = Math.max(0, total - 1);
  const [rawValue, setValue] = useControllableState(valueProp, defaultValue, onValueChange);
  const value = Math.min(Math.max(rawValue, 0), last);
  const reduced = useSyncExternalStore(subscribeNever, getReducedMotion, getServerReducedMotion);

  /* Les index visibles, joints par des virgules — une chaîne, pour que React
     ignore la mesure qui ne change rien ; `null` tant que rien n'est mesuré. */
  const [visible, setVisible] = useState<string | null>(null);
  /* L'index annoncé après un changement voulu ; `null` : rien à dire. */
  const [announced, setAnnounced] = useState<number | null>(null);
  /* Le choix de l'utilisateur au bouton ; `null` : celui du composant. */
  const [playChoice, setPlayChoice] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  /* L'index que la piste montre ou va montrer : la valeur qui en diffère
     vient de l'appelant, et la piste doit la rejoindre. */
  const shown = useRef(0);
  /* La cible d'un défilement demandé, tant qu'elle n'est pas atteinte. */
  const target = useRef<number | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const frame = useRef(0);
  const mounted = useRef(false);
  const drag = useRef({ x: 0, left: 0, active: false, moved: false });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const box = track.getBoundingClientRect();
    const rects = rectsOf(track);
    setVisible(visibleSlides(box, rects).join());
    /* Sans mise en page, rien ne dit quelle diapositive est montrée. */
    if (box.width <= 0 || rects.length === 0) return;
    const current = shownSlide(track, box, rects);
    if (target.current !== null) {
      if (current === target.current) target.current = null;
    } else if (current !== shown.current) {
      shown.current = current;
      setValue(current);
    }
  }, [setValue]);

  const scrollToSlide = useCallback(
    (index: number, animate: boolean) => {
      shown.current = index;
      const track = trackRef.current;
      const slide = track?.children[index];
      if (!track || !slide) return;
      target.current = index;
      clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        target.current = null;
        measure();
      }, SETTLE_MS);
      const box = track.getBoundingClientRect();
      const rect = slide.getBoundingClientRect();
      track.scrollTo?.({
        left: track.scrollLeft + (isRtl(track) ? rect.right - box.right : rect.left - box.left),
        behavior: animate ? 'smooth' : 'auto',
      });
    },
    [measure],
  );

  const go = useCallback(
    (index: number, announce: boolean) => {
      const next = Math.min(Math.max(index, 0), last);
      scrollToSlide(next, !reduced);
      setValue(next);
      setAnnounced(announce ? next : null);
    },
    [last, reduced, scrollToSlide, setValue],
  );

  /* La valeur de l'appelant — ou l'index de départ — que la piste ne montre
     pas encore : on l'y amène, sans animation au montage. */
  useEffect(() => {
    if (value !== shown.current) scrollToSlide(value, mounted.current && !reduced);
    mounted.current = true;
  }, [reduced, scrollToSlide, value]);

  useEffect(() => {
    measure();
    addEventListener('resize', measure);
    return () => {
      removeEventListener('resize', measure);
      cancelAnimationFrame(frame.current);
      clearTimeout(settleTimer.current);
    };
  }, [measure]);

  const playing = !!autoPlay && (playChoice ?? !reduced);
  const running = playing && !hovered && !focused && total > 1;

  useEffect(() => {
    if (!running) return undefined;
    const timer = setTimeout(() => go(value >= last ? 0 : value + 1, false), autoPlay);
    return () => clearTimeout(timer);
  }, [autoPlay, go, last, running, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    /* Les flèches d'un champ, dans une diapositive, restent au champ. */
    if (event.target !== event.currentTarget) return;
    const step = isRtl(event.currentTarget) ? -1 : 1;
    const destination = {
      ArrowRight: value + step,
      ArrowLeft: value - step,
      Home: 0,
      End: last,
    }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    go(destination, true);
  };

  /* GLISSER À LA SOURIS. Le toucher et le stylet défilent nativement ; la
     capture du pointeur n'est prise qu'une fois le seuil (4 px) franchi, pour
     qu'un simple clic atteigne toujours le lien ou le bouton visé. */
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button) return;
    drag.current = {
      x: event.clientX,
      left: event.currentTarget.scrollLeft,
      active: true,
      moved: false,
    };
    target.current = null;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = drag.current;
    const track = event.currentTarget;
    const dx = event.clientX - gesture.x;
    if (gesture.active && !gesture.moved && Math.abs(dx) > 4) {
      gesture.moved = true;
      track.dataset.dragging = '';
      track.setPointerCapture?.(event.pointerId);
    }
    if (gesture.active && gesture.moved) track.scrollLeft = gesture.left - dx;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = drag.current;
    const track = event.currentTarget;
    if (!gesture.active || !gesture.moved) {
      gesture.active = false;
      return;
    }
    gesture.active = false;
    delete track.dataset.dragging;
    go(shownSlide(track, track.getBoundingClientRect(), rectsOf(track)), true);
    /* Le clic qui termine le geste est avalé ; s'il ne vient pas, le
       suivant passe. */
    setTimeout(() => (gesture.moved = false));
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!drag.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current.moved = false;
  };

  return (
    <div
      {...rest}
      ref={ref}
      role="region"
      aria-roledescription="carrousel"
      aria-label={label}
      className={clsx('opale-carousel', styles.root, className)}
      style={
        {
          ...style,
          '--opale-carousel-slide-size': slideSize,
          '--opale-carousel-gap': gap && (gap === 'none' ? '0px' : `var(--opale-space-${gap})`),
        } as CSSProperties
      }
      onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
        onPointerEnter?.(event);
        if (event.pointerType === 'mouse') setHovered(true);
      }}
      onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(event);
        setHovered(false);
      }}
      onFocus={(event: FocusEvent<HTMLDivElement>) => {
        onFocus?.(event);
        setFocused(true);
      }}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- la piste est la zone défilante, focalisable (WCAG 2.1.1) : ses flèches et le glisser la font défiler. */}
      <div
        ref={trackRef}
        className={part('track')}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- même raison : une zone défilante doit s'atteindre au clavier.
        tabIndex={0}
        onScroll={() => {
          cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(measure);
        }}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClickCapture={handleClickCapture}
        onDragStart={(event) => event.preventDefault()}
      >
        {items.map((item, index) => (
          <SlideContext
            key={item.key}
            value={{
              label: labels.slide(index + 1, total),
              inert: visible !== null && !visible.split(',').includes(`${index}`),
            }}
          >
            {item}
          </SlideContext>
        ))}
      </div>
      <div className={part('controls')}>
        {!!autoPlay && (
          <button
            type="button"
            className={part('play')}
            onClick={() => {
              setPlayChoice(!playing);
              /* Reprendre au bouton vaut aussi pour le focus qui est dessus. */
              setFocused(false);
            }}
          >
            {playing ? labels.pause : labels.play}
          </button>
        )}
        {showDots && (
          <div role="group" aria-label={labels.dots} className={part('dots')}>
            {items.map((item, index) => (
              <button
                key={item.key}
                type="button"
                aria-label={labels.goTo(index + 1)}
                aria-current={index === value || undefined}
                className={part('dot')}
                onClick={() => go(index, true)}
              />
            ))}
          </div>
        )}
        {showArrows &&
          [-1, 1].map((step) => (
            /* Les flèches ← et → sont retournées par la feuille de droite à
               gauche ; leur nom vient de `aria-label`. */
            <button
              key={step}
              type="button"
              aria-label={step < 0 ? labels.previous : labels.next}
              disabled={step < 0 ? value <= 0 : value >= last}
              className={part('arrow')}
              onClick={() => go(value + step, true)}
            >
              {step < 0 ? '←' : '→'}
            </button>
          ))}
      </div>
      <div className="opale-carousel__status opale-visually-hidden" aria-live="polite">
        {announced === null ? '' : labels.slide(announced + 1, total)}
      </div>
    </div>
  );
}
