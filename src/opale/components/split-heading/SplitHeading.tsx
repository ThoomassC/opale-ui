import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
} from 'react';
import clsx from 'clsx';

import type { HeadingLevel } from '../../catalog/display';
import { warnOnce } from '../../shared/dev-warning';
import { splitWords } from './split-words';
import styles from './style/SplitHeading.module.css';

/* =============================================================================
   LE TITRE DÉCOUPÉ EN MOTS : CHAQUE MOT MONTE À SON TOUR.

   UN TITRE COMME LES AUTRES. Mêmes balises et mêmes classes qu'un `Heading`
   du même niveau (`.opale-heading`) : au repos, rien ne les distingue.

   LU UNE FOIS, ET EN ENTIER. Les mots visibles sont `aria-hidden` ; la phrase
   est rendue une seconde fois, cachée de l'écran (`.opale-visually-hidden`),
   et c'est elle qui fait le nom du titre. Pas d'`aria-label` : certaines
   techniques d'assistance l'ignorent sur un titre. Cette copie ne se
   sélectionne pas : copier le titre rend la phrase une fois.

   VISIBLE AU REPOS, TOUJOURS. Le serveur, une page sans script, l'impression
   et le mouvement réduit montrent chaque mot à son état final. La lecture
   (`data-split="play"`) n'est posée que par le script, dans un effet de mise
   en page — avant la peinture —, et la feuille ne cache un mot que pendant
   son animation (`animation-fill-mode: backwards`).

   AUCUN DÉCALAGE DE MISE EN PAGE. Les mots sont des `inline-block` dès le
   rendu serveur, séparés par de vraies espaces : les lignes coupent au même
   endroit avant et après l'hydratation. Seuls `transform` et `opacity`
   s'animent.
   ========================================================================== */

/**
 * L'unité du découpage. Seuls les mots existent ; le type reste ouvert pour
 * un découpage en lignes à venir.
 */
export type SplitHeadingBy = 'word';

/** Ce qui lance la montée : l'entrée dans la vue, ou le montage. */
export type SplitHeadingTrigger = 'view' | 'mount';

export interface SplitHeadingProps extends Omit<ComponentPropsWithRef<'h2'>, 'children'> {
  /** Le niveau HTML du titre, de `1` à `6`, sur l'échelle de `Heading`. Défaut : `2`. */
  level?: HeadingLevel;
  /**
   * Le texte du titre, et seulement du texte : il est découpé en mots. Un
   * autre enfant est rendu tel quel, sans découpe ni animation, et un
   * avertissement de développement le signale.
   */
  children: string;
  /** L'unité du découpage. Défaut et seule valeur pour l'instant : `word`. */
  by?: SplitHeadingBy;
  /**
   * `view` (défaut) joue la montée une fois, quand le titre entre dans la vue ;
   * `mount` la joue au montage. Le pas de la cascade et la durée sont les
   * jetons `--opale-split-stagger` et `--opale-split-duration`.
   */
  trigger?: SplitHeadingTrigger;
}

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Un titre dont les mots montent en cascade, lu d'un seul tenant. */
export function SplitHeading({
  level = 2,
  children,
  /* Seule valeur : `word`. Retirée pour ne pas finir en attribut du DOM. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  by,
  trigger = 'view',
  className,
  ref,
  ...rest
}: SplitHeadingProps) {
  const Tag = `h${level}` as 'h2';
  const text = typeof children === 'string';
  /* L'observateur suit les mots, pas le titre : `ref` va droit au titre,
     sans fusion de références. */
  const local = useRef<HTMLSpanElement>(null);
  /* Absent au serveur et à l'hydratation : chaque mot est à son état final. */
  const [play, setPlay] = useState(false);

  useLayoutEffect(() => {
    if (!text) {
      warnOnce('split-heading', '[Opale] SplitHeading : seul un texte est découpé en mots.');
      return;
    }
    const node = local.current;
    if (!node || prefersReducedMotion()) return;
    /* Déjà à l'écran : l'observateur ne préviendrait qu'après une peinture, et
       les mots, montrés, seraient cachés puis animés. On joue tout de suite. */
    /* Sous la vue, la règle de `Reveal` (`isBelowFold`), écrite ici en une
       ligne : un module de plus coûte plus que la ligne au budget. */
    const height = window.innerHeight;
    if (trigger === 'mount' || !(height > 0 && node.getBoundingClientRect().top >= height)) {
      setPlay(true);
      return;
    }
    /* Sans observateur, le titre reste simplement immobile. */
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        /* Dans la vue, ou déjà au-dessus : un saut a pu la franchir d'un coup. */
        if (
          entry &&
          (entry.isIntersecting ||
            entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0) + 1)
        ) {
          setPlay(true);
          observer.disconnect();
        }
      },
      /* Aucune marge en bas : pas de bande morte. Une marge sans fin en haut :
         le titre dépassé d'un saut compte comme vu (voir `Reveal`). */
      { rootMargin: '100000px 0px 0px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [text, trigger, level]);

  return (
    <Tag
      {...rest}
      ref={ref}
      data-split={play ? 'play' : undefined}
      className={clsx('opale-heading', 'opale-split-heading', styles.root, className)}
    >
      {text ? (
        <>
          <span className={clsx('opale-visually-hidden', styles.text)}>{children}</span>
          <span ref={local} aria-hidden="true">
            {/* L'espace vit ENTRE les mots, pas dedans : en tête d'un
                `inline-block`, elle serait retirée et les mots se colleraient. */}
            {splitWords(children).map((word, index) => (
              <Fragment key={index}>
                {index > 0 && ' '}
                <span
                  className={clsx('opale-split-heading__word', styles.word)}
                  style={{ '--opale-split-index': index } as CSSProperties}
                >
                  {word}
                </span>
              </Fragment>
            ))}
          </span>
        </>
      ) : (
        children
      )}
    </Tag>
  );
}
