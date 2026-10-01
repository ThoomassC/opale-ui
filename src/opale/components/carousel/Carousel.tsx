import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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
import {
  nearestStop,
  slideOffsets,
  slideStops,
  visibleSlides,
  type SlideStop,
} from './carousel-geometry';
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

/* LA PAGE CACHÉE (onglet en arrière-plan) suspend la lecture automatique. */
const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
};
const getHidden = () => document.visibilityState === 'hidden';

const isRtl = (element: Element) => getComputedStyle(element).direction === 'rtl';

/* La classe stable d'une partie, et celle de la feuille. */
const part = (name: string) => clsx(`opale-carousel__${name}`, styles[name]);

/* Le défilement demandé est fini : l'aimant coupé par un glisser revient. */
const settle = (track: HTMLElement) => {
  delete track.dataset.dragging;
};

const rectsOf = (track: HTMLElement) =>
  Array.from(track.children, (child) => child.getBoundingClientRect());

/* CE QUE MONTRE LA PISTE, LU D'UNE FOIS : les diapositives visibles, les
   positions atteignables, le bout. `null` sans mise en page ni diapositive.
   `key` résume ce que le rendu en lit, pour qu'une mesure identique n'en
   déclenche pas. */
function readTrack(track: HTMLElement) {
  const box = track.getBoundingClientRect();
  const rects = rectsOf(track);
  if (box.width <= 0 || rects.length === 0) return null;
  const rtl = isRtl(track);
  const scroll = Math.abs(track.scrollLeft);
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  const stops = slideStops(slideOffsets(box, rects, scroll, rtl), max);
  const visible = visibleSlides(box, rects);
  const atEnd = max > 2 && scroll >= max - 2;
  const key = [
    rects.length,
    visible,
    stops.map((stop) => `${stop.first}-${stop.last}`),
    atEnd,
    rtl,
  ];
  return { key: key.join('|'), count: rects.length, visible, stops, atEnd, rtl, scroll };
}

type TrackReading = NonNullable<ReturnType<typeof readTrack>>;

/* Ce que les gestionnaires et les minuteries lisent du dernier rendu. */
interface Latest {
  readonly onValueChange: ((index: number) => void) | undefined;
  readonly value: number;
  readonly stops: readonly SlideStop[];
  readonly current: number;
  readonly isControlled: boolean;
  readonly reduced: boolean;
}

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
  const reduced = useSyncExternalStore(subscribeNever, getReducedMotion, getServerReducedMotion);
  const hidden = useSyncExternalStore(subscribeVisibility, getHidden, getServerReducedMotion);
  /* La mesure de la piste ; `null` tant que rien n'est mesuré. */
  const [layout, setLayout] = useState<TrackReading | null>(null);
  /* L'index visé par le dernier changement voulu : annoncé une fois atteint,
     jamais s'il ne l'est pas (un parent qui refuse, une lecture automatique). */
  const [announced, setAnnounced] = useState<number | null>(null);
  /* Le choix de l'utilisateur au bouton ; `null` : celui du composant. */
  const [playChoice, setPlayChoice] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  /* LE RAPPEL DE L'APPELANT EST LU AU DERNIER RENDU. Écrit en ligne, il
     change à chaque rendu du parent ; s'il entrait dans les dépendances, la
     mesure et la lecture automatique repartiraient de zéro à chaque fois. */
  const latest = useRef<Latest>({
    onValueChange,
    value: 0,
    stops: [],
    current: 0,
    isControlled: false,
    reduced: false,
  });
  const emit = useCallback((index: number) => latest.current.onValueChange?.(index), []);
  const [rawValue, setValue, isControlled] = useControllableState(valueProp, defaultValue, emit);
  const value = Math.min(Math.max(Number.isFinite(rawValue) ? Math.round(rawValue) : 0, 0), last);

  /* LES POSITIONS ATTEIGNABLES. Une mesure faite pour un autre nombre de
     diapositives ne vaut rien : la suivante arrive avec l'observation
     relancée. Sans mesure, chaque diapositive est sa propre position. */
  const measured = layout?.count === total ? layout : null;
  const stops: readonly SlideStop[] =
    measured?.stops ?? items.map((_, index) => ({ position: 0, first: index, last: index, index }));
  const current = Math.max(
    0,
    stops.findIndex((stop) => value <= stop.last),
  );
  const shownIndex = stops[current]?.index ?? 0;
  const atEnd = current >= stops.length - 1 || !!measured?.atEnd;

  useLayoutEffect(() => {
    latest.current = { onValueChange, value, stops, current, isControlled, reduced };
  });

  const trackRef = useRef<HTMLDivElement>(null);
  /* L'index que la piste montre ou va montrer : la valeur qui en diffère
     vient de l'appelant, et la piste doit la rejoindre. */
  const shown = useRef(0);
  /* La cible d'un défilement demandé, tant qu'elle n'est pas atteinte. */
  const target = useRef<number | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const frame = useRef(0);
  const mounted = useRef(false);
  /* Vrai quand la dernière mesure a trouvé une piste avec une largeur. */
  const laidOut = useRef(false);
  const drag = useRef({ x: 0, left: 0, active: false, moved: false });

  /* Amène la diapositive `index` au bord de départ — au bout de la piste
     quand elle ne peut pas y venir. Rien à faire, rien n'est visé. */
  const scrollToSlide = useCallback((index: number, animate: boolean) => {
    shown.current = index;
    const track = trackRef.current;
    const slide = track?.children[index];
    if (!track || !slide) return;
    const box = track.getBoundingClientRect();
    const rtl = isRtl(track);
    const scroll = Math.abs(track.scrollLeft);
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    const [offset = 0] = slideOffsets(box, [slide.getBoundingClientRect()], scroll, rtl);
    const to = Math.min(Math.max(offset, 0), max);
    if (box.width > 0 && Math.abs(to - scroll) < 1) {
      target.current = null;
      settle(track);
      return;
    }
    target.current = index;
    clearTimeout(settleTimer.current);
    /* La cible tenue pour atteinte, la piste se remesure par son propre
       événement de défilement. */
    settleTimer.current = setTimeout(() => {
      target.current = null;
      settle(track);
      track.dispatchEvent(new Event('scroll'));
    }, SETTLE_MS);
    track.scrollTo?.({ left: rtl ? -to : to, behavior: animate ? 'smooth' : 'auto' });
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    /* Une diapositive devenue inerte perd le focus sans `focusout` : la
       pause qu'il tenait est levée à la mesure suivante. */
    if (!track.parentElement?.contains(document.activeElement)) setFocused(false);
    const reading = readTrack(track);
    /* Sans mise en page ni diapositive, rien n'est mesuré : rien n'est
       inerte, et rien ne dit quelle diapositive est montrée. */
    if (!reading) {
      laidOut.current = false;
      setLayout(null);
      return;
    }
    setLayout((previous) => (previous?.key === reading.key ? previous : reading));
    /* La piste prend sa largeur (onglet ouvert, parent affiché) : elle
       rejoint la valeur, que le défilement d'une piste nulle n'a pas pu
       montrer. */
    if (!laidOut.current) {
      laidOut.current = true;
      scrollToSlide(latest.current.value, false);
      return;
    }
    const reached = reading.stops[nearestStop(reading.stops, reading.scroll)];
    if (!reached) return;
    const within = (index: number) => index >= reached.first && index <= reached.last;
    if (target.current !== null) {
      if (within(target.current)) {
        target.current = null;
        settle(track);
      }
      return;
    }
    /* Le glisser ne rappelle qu'au lâcher ; une position qui montre déjà la
       valeur ne rappelle rien. */
    if (drag.current.active || within(latest.current.value)) return;
    shown.current = reached.index;
    setValue(reached.index);
  }, [scrollToSlide, setValue]);

  /* Va à la position atteignable `stop`. Contrôlé, le carrousel ne bouge
     qu'une fois la valeur acceptée par l'appelant ; la même position ne
     rappelle ni n'annonce rien, mais y ramène la piste. */
  const go = useCallback(
    (stop: number, announce: boolean) => {
      const { stops: all, current: at, isControlled: controlled, reduced: still } = latest.current;
      const next = all[Math.min(Math.max(stop, 0), all.length - 1)];
      if (!next) return;
      const changed = next !== all[at];
      if (!controlled || !changed) scrollToSlide(next.index, !still);
      if (!changed) return;
      setAnnounced(announce ? next.index : null);
      setValue(next.index);
    },
    [scrollToSlide, setValue],
  );

  /* La valeur de l'appelant — ou l'index de départ — que la piste ne montre
     pas encore : on l'y amène, sans animation au montage. Joué à chaque
     rendu, pour qu'un parent qui refuse un défilement natif y ramène la
     piste. */
  useEffect(() => {
    const at = stops.findIndex((stop) => shown.current <= stop.last);
    if (at !== current && !drag.current.active) {
      scrollToSlide(value, mounted.current && !reduced);
    }
    mounted.current = true;
  });

  /* LA PISTE ET SES DIAPOSITIVES SONT OBSERVÉES, pas la fenêtre : une piste
     masquée qui s'affiche, une diapositive qui change de taille remesurent.
     L'observation repart quand le nombre de diapositives change. */
  useEffect(() => {
    const track = trackRef.current;
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (track) for (const node of [track, ...track.children]) observer?.observe(node);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [measure, total]);

  /* La minuterie qui libère une cible ne s'efface qu'au démontage — avec la
     cible, pour qu'un double montage (StrictMode) ne la laisse pas tenue. */
  useEffect(
    () => () => {
      clearTimeout(settleTimer.current);
      target.current = null;
    },
    [],
  );

  const playing = !!autoPlay && (playChoice ?? !reduced);
  const running = playing && !hovered && !focused && !hidden && total > 1;

  /* La minuterie ne dépend que de ce qui la règle : `go` est stable, et la
     position courante est lue à l'échéance. */
  useEffect(() => {
    if (!running) return undefined;
    const timer = setTimeout(() => {
      const { current: at, stops: all } = latest.current;
      go(at >= all.length - 1 ? 0 : at + 1, false);
    }, autoPlay);
    return () => clearTimeout(timer);
  }, [autoPlay, go, running, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    /* Les flèches d'un champ, dans une diapositive, restent au champ ; une
       flèche modifiée (Alt+← : page précédente) reste au navigateur. */
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const step = isRtl(event.currentTarget) ? -1 : 1;
    const destination = {
      ArrowRight: current + step,
      ArrowLeft: current - step,
      Home: 0,
      End: stops.length - 1,
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

  /* Le lâcher, la capture perdue ou un bouton relâché hors de la piste
     terminent le geste. L'aimant reste coupé (`data-dragging`) jusqu'à la fin
     du calage programmé : rétabli tout de suite, il se disputerait le
     défilement avec lui. */
  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = drag.current;
    const track = event.currentTarget;
    if (!gesture.active || !gesture.moved) {
      gesture.active = false;
      return;
    }
    gesture.active = false;
    const reading = readTrack(track);
    go(reading ? nearestStop(reading.stops, reading.scroll) : current, true);
    /* Le clic qui termine le geste est avalé ; s'il ne vient pas, le
       suivant passe. */
    setTimeout(() => (gesture.moved = false));
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = drag.current;
    if (!gesture.active) return;
    /* Le bouton a été relâché hors de la piste, avant toute capture : le
       survol qui suit n'est pas un glisser. */
    if (!(event.buttons & 1)) {
      handlePointerEnd(event);
      return;
    }
    const track = event.currentTarget;
    const dx = event.clientX - gesture.x;
    if (!gesture.moved && Math.abs(dx) > 4) {
      gesture.moved = true;
      track.dataset.dragging = '';
      getSelection()?.removeAllRanges();
      try {
        track.setPointerCapture(event.pointerId);
      } catch {
        /* Un pointeur déjà relâché ne se capture pas : le geste continue. */
      }
    }
    if (gesture.moved) track.scrollLeft = gesture.left - dx;
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
        onLostPointerCapture={handlePointerEnd}
        onClickCapture={handleClickCapture}
        onDragStart={(event) => event.preventDefault()}
      >
        {items.map((item, index) => (
          <SlideContext
            key={item.key}
            value={{
              label: labels.slide(index + 1, total),
              inert: !!measured && !measured.visible.includes(index),
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
            {stops.map((stop, at) => (
              <button
                key={stop.index}
                type="button"
                aria-label={labels.goTo(stop.index + 1)}
                aria-current={at === current || undefined}
                className={part('dot')}
                onClick={() => go(at, true)}
              />
            ))}
          </div>
        )}
        {showArrows &&
          [-1, 1].map((step) => {
            const off = step < 0 ? current <= 0 : atEnd;
            return (
              /* Les flèches ← et → sont retournées par la feuille de droite à
                 gauche ; leur nom vient de `aria-label`. `aria-disabled` et non
                 `disabled` : un bouton désactivé perdrait le focus vers
                 `<body>` (WCAG 2.4.3). */
              <button
                key={step}
                type="button"
                aria-label={step < 0 ? labels.previous : labels.next}
                aria-disabled={off || undefined}
                className={part('arrow')}
                onClick={() => {
                  if (!off) go(current + step, true);
                }}
              >
                {step < 0 ? '←' : '→'}
              </button>
            );
          })}
      </div>
      <div className="opale-carousel__status opale-visually-hidden" aria-live="polite">
        {announced === shownIndex ? labels.slide(shownIndex + 1, total) : ''}
      </div>
    </div>
  );
}
