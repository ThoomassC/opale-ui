import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
  type CSSProperties,
} from 'react';
import clsx from 'clsx';

import type { HeadingLevel } from '../../catalog/display';
import { warnOnce } from '../../shared/dev-warning';
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

   UNE SEULE LECTURE. Une fois les animations finies (ou annulées), le titre
   passe à `done`, qui retire la règle : ni un `display: none`, ni un autre
   niveau, ni un texte neuf ne la relancent. Un titre HYDRATÉ déjà à l'écran
   ne joue jamais : ses mots, peints par le serveur, tomberaient à l'opacité
   nulle avant de remonter. Seul un titre `view` hydraté sous la vue joue, à
   son entrée.

   AUCUN DÉCALAGE DE MISE EN PAGE. Les mots sont des `inline-block` dès le
   rendu serveur, séparés par de vraies espaces : les lignes coupent au même
   endroit avant et après l'hydratation. Seuls `transform` et `opacity`
   s'animent.
   ========================================================================== */

/* =============================================================================
   LE DÉCOUPAGE EN MOTS, EN CALCUL PUR — ICI ET NON DANS SON MODULE : un module de
   plus coûte son en-tête au budget de poids.

   Les mots sont coupés sur les espaces sécables seulement : une espace
   insécable (U+00A0, U+202F) lie déjà deux signes, elle reste dans le mot.
   Un texte sans espace — le chinois, le japonais — reste un seul mot.

   LA PONCTUATION ISOLÉE RESTE AVEC SON MOT. Le texte brut ne coupe jamais la
   ligne avant « ! » ni après « ( » (UAX 14) ; deux `inline-block` voisins, si.
   Un signe sans lettre ni chiffre rejoint donc le mot qui le précède, et un
   signe ouvrant (« ( », « « ») le mot qui le suit.
   ========================================================================== */

const SPACE = /[ \t\n\r\f]+/;
const LETTER = /[\p{L}\p{N}]/u;
const OPENING = /^[\p{Ps}\p{Pi}]+$/u;

/** Les mots d'un texte, dans l'ordre, la ponctuation isolée collée à son mot. */
/* Exportée pour ses tests, et non par l'index du paquet. Son propre module
   coûterait son en-tête au budget ; le rechargement à chaud de la vitrine
   recharge donc la page entière quand ce fichier change. */
// eslint-disable-next-line react-refresh/only-export-components
export function splitWords(text: string): string[] {
  const words: string[] = [];
  let glue = false;
  for (const token of text.split(SPACE)) {
    if (!token) continue;
    const last = words.length - 1;
    if (last >= 0 && (glue || (!LETTER.test(token) && !OPENING.test(token))))
      words[last] += ` ${token}`;
    else words.push(token);
    glue = OPENING.test(token);
  }
  return words;
}

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

/* L'HYDRATATION, LUE SANS ÉCART : `false` au rendu qui hydrate (la valeur du
   serveur), `true` à un montage purement client. Aucun abonnement. */
const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

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
  /* Le premier rendu a-t-il hydraté des mots déjà peints par le serveur ?
     Gardé du premier rendu : le suivant lit déjà la valeur client. */
  const [hydrated] = useState(!useSyncExternalStore(subscribeNever, onClient, onServer));
  /* La lecture : rien (repos), le texte en cours de lecture, puis `true`
     quand elle est finie. */
  const [played, setPlayed] = useState<string | true>();
  /* `play` pour le texte joué ; `done` ensuite, qui retire la règle
     d'animation — rien ne la relance. Un texte changé en pleine lecture est
     `done` dès ce rendu : la phrase neuve est immobile, sans cascade rejouée
     à moitié. */
  const state = played === undefined ? undefined : played === children ? 'play' : 'done';

  useLayoutEffect(() => {
    if (!text) {
      warnOnce('split-heading', '[Opale] SplitHeading : seul un texte est découpé en mots.');
      return;
    }
    const node = local.current;
    if (!node) return;
    /* Une seule lecture : jamais depuis `done`. Le mouvement réduit n'est pas
       lu ici : la feuille y retire l'animation, et la lecture finit aussitôt. */
    const play = () => setPlayed((current) => current ?? children);
    const box = node.getBoundingClientRect();
    /* À l'écran, sur les deux axes : l'observateur ne préviendrait qu'après
       une peinture, et les mots, montrés, seraient cachés puis animés. Un
       titre client joue donc tout de suite ; un titre hydraté, déjà peint par
       le serveur, ne joue jamais. */
    if (
      trigger === 'mount' ||
      (box.top < innerHeight && box.bottom > 0 && box.left < innerWidth && box.right > 0)
    ) {
      if (!hydrated) play();
      return;
    }
    /* Sans observateur, le titre reste simplement immobile. */
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          play();
          observer.disconnect();
        }
      },
      /* Aucune marge en bas : pas de bande morte. Une marge sans fin en haut :
         un titre qu'un saut (touche Fin, ancre) a fait passer au-dessus de la
         vue y est encore « dans la vue », et compte comme vu. */
      { rootMargin: '100000px 0px 0px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [children, text, trigger, level, hydrated]);

  /* LA FIN DE LA LECTURE : toutes les animations des mots finies — ou
     annulées, par un `display: none` en cours de route. Aucune animation
     (mouvement réduit, impression) : la lecture finit aussitôt. */
  useEffect(() => {
    if (state === 'play')
      void Promise.allSettled(
        (local.current?.getAnimations?.({ subtree: true }) ?? []).map(
          (animation) => animation.finished,
        ),
      ).then(() => setPlayed(true));
  }, [state]);

  return (
    <Tag
      {...rest}
      ref={ref}
      data-split={state}
      className={clsx('opale-heading opale-split-heading', styles.root, className)}
    >
      {text
        ? [
            <span
              /* Une clé tirée du texte : des mots neufs pour une phrase neuve,
                 jamais ceux d'avant réutilisés au même rang. */
              key={children}
              ref={local}
              aria-hidden="true"
            >
              {/* L'espace vit ENTRE les mots, pas dedans : en tête d'un
                  `inline-block`, elle serait retirée et les mots se colleraient. */}
              {splitWords(children).flatMap((word, index) => [
                index ? ' ' : '',
                <span
                  key={index}
                  className="opale-split-heading__word"
                  style={{ '--opale-split-index': index } as CSSProperties}
                >
                  {word}
                </span>,
              ])}
            </span>,
            /* La copie lisible, APRÈS les mots : la feuille la désigne ainsi,
               sans classe de module de plus. */
            <span key="text" className="opale-visually-hidden">
              {children}
            </span>,
          ]
        : children}
    </Tag>
  );
}
