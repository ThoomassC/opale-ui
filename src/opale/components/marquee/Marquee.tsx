import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import type { StackGap } from '../../catalog/layout';
import { resolveLabels } from '../../shared/labels';
import { mergeRefs } from '../../shared/merge-refs';
import styles from './style/Marquee.module.css';

/* =============================================================================
   LE BANDEAU DÉFILANT : UNE RANGÉE QUI PASSE EN BOUCLE, SANS FIN.

   LA FEUILLE ANIME, LE SCRIPT NE COMPTE RIEN. La piste porte deux copies du
   contenu et glisse de -50 % : exactement une copie, d'où une boucle sans
   couture. Chaque copie fait au moins la largeur de la vue (`100cqi`), si
   bien qu'un contenu étroit ne laisse jamais de vide. Seul `transform`
   s'anime.

   UNE SEULE COPIE EXISTE POUR LES TECHNIQUES D'ASSISTANCE. La seconde est
   `aria-hidden` et `inert` : ni lue, ni atteinte à la tabulation.

   IMMOBILE AU REPOS. Sans script, sous `prefers-reduced-motion: reduce` et à
   l'impression, le contenu est rendu une fois et passe à la ligne ; ni copie
   ni bouton : rien ne bouge, il n'y a rien à suspendre. Ailleurs, la bande
   est posée par la feuille dès la première peinture ; le mouvement et la
   copie (`data-animated`) n'arrivent qu'après l'hydratation, sans écart ni
   saut de mise en page.

   WCAG 2.2.2. Le mouvement dure plus de 5 s : un bouton le suspend, placé
   avant le contenu dans l'ordre de tabulation. Il change de nom (« Mettre en
   pause » / « Lire »), comme le bouton de lecture du `Carousel` et celui du
   motif « Carousel » de l'APG, plutôt que de porter `aria-pressed` — les deux
   ensemble se contrediraient. Le survol et le focus du contenu suspendent
   aussi ; ceux du bouton, non : « Lire » cliqué doit reprendre aussitôt.

   PAS D'`aria-roledescription`. Le rôle `region` dit déjà « région » dans la
   langue du lecteur ; une description maison le remplacerait par un mot à
   traduire, sans rien apprendre de plus que le nom (`label`).
   ========================================================================== */

/** Les textes de `Marquee`. */
export interface MarqueeLabels {
  /** Le bouton qui suspend le défilement. Défaut : « Mettre en pause ». */
  pause: string;
  /** Le bouton qui le reprend. Défaut : « Lire ». */
  play: string;
}

const DEFAULT_MARQUEE_LABELS: MarqueeLabels = { pause: 'Mettre en pause', play: 'Lire' };

export interface MarqueeProps extends ComponentPropsWithRef<'div'> {
  /** Le nom de la région, obligatoire : il dit ce que le bandeau fait défiler. */
  label: string;
  /**
   * Les entrées, en enfants directs : chacune défile comme un bloc. Elles sont
   * rendues deux fois à l'écran ; évitez-y les `id`.
   */
  children?: ReactNode;
  /** La durée d'une boucle complète, en secondes. Défaut : 28 (le jeton `--opale-marquee-duration`). */
  duration?: number;
  /** Défile dans l'autre sens : vers la fin de la ligne au lieu de son début. */
  reverse?: boolean;
  /** L'espace entre deux entrées, sur l'échelle `--opale-space-*`. Défaut : `xl`. */
  gap?: StackGap;
  /** Estompe les deux bords du bandeau. Défaut : `true`. */
  fade?: boolean;
  /** Remplace les textes français, clé par clé. */
  labels?: Partial<MarqueeLabels>;
}

/* LE MOUVEMENT, LU SANS ÉCART D'HYDRATATION : `false` au serveur et pendant
   l'hydratation, puis vrai sauf sous mouvement réduit. Pas d'abonnement : un
   changement de préférence vaut au prochain montage, et la feuille, elle,
   l'applique tout de suite. */
const subscribeNever = () => () => {};
const getMotion = () => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const getServerMotion = () => false;

/* La classe stable d'une partie, et celle de la feuille. */
const part = (name: string) => clsx(`opale-marquee__${name}`, styles[name]);

/** Un bandeau qui fait défiler son contenu en boucle, avec un bouton pause. */
export function Marquee({
  label,
  duration,
  reverse,
  gap,
  fade = true,
  labels: labelsProp,
  className,
  style,
  children,
  ref,
  ...rest
}: MarqueeProps) {
  const labels = resolveLabels(DEFAULT_MARQUEE_LABELS, labelsProp);
  const animated = useSyncExternalStore(subscribeNever, getMotion, getServerMotion);
  const [paused, setPaused] = useState(false);
  /* LA DIRECTION CALCULÉE, lue une fois montée : `:dir(rtl)` ne suffit pas,
     certains builds le réécrivent en `:lang()` (voir `Carousel`). */
  const [rtl, setRtl] = useState(false);
  const local = useRef<HTMLDivElement>(null);
  const setRef = useCallback((node: HTMLDivElement | null) => mergeRefs(local, ref)(node), [ref]);

  useLayoutEffect(() => {
    if (local.current) setRtl(getComputedStyle(local.current).direction === 'rtl');
  }, []);

  return (
    <div
      {...rest}
      ref={setRef}
      role="region"
      aria-label={label}
      data-animated={animated || undefined}
      data-paused={paused || undefined}
      data-reverse={reverse || undefined}
      data-fade={fade || undefined}
      data-dir={rtl ? 'rtl' : undefined}
      className={clsx('opale-marquee', styles.root, className)}
      style={
        {
          ...style,
          '--opale-marquee-duration':
            duration !== undefined && duration > 0 && Number.isFinite(duration)
              ? `${duration}s`
              : undefined,
          '--opale-marquee-gap': gap && (gap === 'none' ? '0px' : `var(--opale-space-${gap})`),
        } as CSSProperties
      }
    >
      <button type="button" className={part('toggle')} onClick={() => setPaused(!paused)}>
        {paused ? labels.play : labels.pause}
      </button>
      <div
        className={part('viewport')}
        /* Le navigateur fait défiler la vue pour montrer une entrée focalisée ;
           le décalage, resté après, ouvrirait un trou à chaque fin de boucle. */
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            event.currentTarget.scrollLeft = 0;
        }}
      >
        <div className={part('track')}>
          <div className={part('copy')}>{children}</div>
          {animated && (
            <div className={clsx(part('copy'), styles.clone)} aria-hidden="true" inert>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
