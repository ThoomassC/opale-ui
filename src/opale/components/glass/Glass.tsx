import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ForwardedRef,
  type MouseEvent,
  type ReactNode,
} from 'react';

import styles from './style/Glass.module.css';

/* =============================================================================
   LE MATÉRIAU VERRE, ÉCRIT PAR OPALE.

   POURQUOI CE FICHIER A ÉTÉ RÉÉCRIT. Il était copié d'une librairie tierce, et
   c'était la dernière dépendance réelle du paquet : le verre est ce sur quoi
   reposent tous les rendus `liquidGlass`. Tant qu'il venait d'ailleurs, Opale
   n'était pas indépendante — elle embarquait du code qu'elle ne maîtrisait pas
   et dont elle héritait les défauts.

   TROIS COUCHES, ET CHACUNE FAIT UNE CHOSE.

     1. LA RÉFRACTION (`__refraction`) échantillonne ce qu'il y a DERRIÈRE le
        composant : un `backdrop-filter` de 0,75 px, puis un déplacement par
        bruit fractal qui gauchit légèrement l'arrière-plan. C'est cette couche
        qui fait qu'un verre posé sur une photographie se voit, et qu'un verre
        posé sur du blanc ne se voit pas — flouter du blanc donne du blanc.

     2. LE LAVIS (`__tint`) pose la teinte et le dégradé de bombé. C'est la
        seule couche colorée, et elle lit `--opale-glass-*`.

     3. LE FILET SPÉCULAIRE (`__specular`) dessine l'arête de lumière en
        `inset box-shadow`. C'est lui, et lui seul, qui donne le bord : aucune
        bordure n'est peinte, sans quoi le verre aurait deux contours.

   LE CONTENU passe au-dessus des trois, dans son propre plan.

   CE QUI CHANGE PAR RAPPORT À LA VERSION TIERCE, ET POURQUOI.

   — LE FILTRE SVG EST MONTÉ UNE SEULE FOIS POUR TOUTE LA PAGE. La version
     copiée en montait un PAR INSTANCE, tous porteurs du même `id` : dix champs
     de verre donnaient dix `id="lg-dist"` en double dans le document. Un
     identifiant dupliqué est un document invalide, et `url(#…)` n'en résout
     qu'un. Ici un compteur de montages pose le filtre au premier verre et le
     retire au dernier.

   — LES CLASSES SONT NOMMÉES, PAS DEVINÉES. L'habillage des couches internes
     se faisait par `[class*='glassFilter']`, faute de pouvoir nommer une classe
     hachée par le module. Les couches portent désormais des noms d'Opale,
     stables et documentés.

   — AUCUN `@apply`. La feuille tierce s'appuyait sur Tailwind, qui n'était une
     dépendance de ce paquet QUE pour cela.

   — LE RAYON EST UN JETON. `--opale-glass-radius` est réglable par l'appelant ;
     la valeur par défaut suit le rayon moyen d'Opale au lieu d'un `22px` figé.
   ========================================================================== */

/* =============================================================================
   LES BALISES QUI RÉPONDENT À UN APPUI.

   LE DÉFAUT QUI A MOTIVÉ CETTE LISTE. Le rebond était posé sur `.glass:active`,
   sans condition. Or `:active` ne vise pas que l'élément pressé : il remonte à
   TOUS SES ANCÊTRES. Cliquer une entrée du sommaire faisait donc rebondir le
   sommaire ENTIER — 1 408 px de panneau —, et il en allait de même de la barre
   du haut, de la modale, de la carte et du bandeau d'onglets : tout conteneur
   de verre sautait dès qu'on touchait quoi que ce soit à l'intérieur.

   CE QUI DÉCIDE MAINTENANT, C'EST LE RÔLE DE L'ÉLÉMENT RENDU, pas la matière.
   Un bouton, un lien, un `<summary>` sont des cibles d'activation : le rebond y
   est la réponse au geste. Un `<div>`, un `<aside>`, une `<section>` sont des
   SURFACES : elles n'ont rien à répondre, on ne les presse pas.

   `pressFeedback` reste là pour le cas que cette règle ne peut pas voir : la
   case à cocher et l'interrupteur, dont le contrôle natif est posé À CÔTÉ du
   verre — la coquille y est un `<span>`, alors que le geste, lui, est bien une
   activation.
   ========================================================================== */
const PRESSABLE_TAGS = new Set(['button', 'a', 'summary']);

/** L'identifiant du filtre de déplacement, cité par la feuille. */
const FILTER_ID = 'opale-glass-displacement';

/* Le filtre est un singleton de document : autant de verres qu'on veut, un
   seul `<svg>`. Le compteur vit au niveau du module — il est donc partagé par
   toutes les instances, ce qui est exactement la portée voulue. */
let mountedGlassCount = 0;

function ensureFilterMounted(): () => void {
  mountedGlassCount += 1;

  if (mountedGlassCount === 1 && !document.getElementById(FILTER_ID)) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.pointerEvents = 'none';
    /* Le bruit fractal et son déplacement : mêmes valeurs que celles réglées à
       l'œil sur la page « Le verre liquide », qui est la référence visuelle du
       matériau. `stdDeviation` adoucit le bruit pour que la déformation ondule
       au lieu de grésiller. */
    svg.innerHTML = `
      <filter id="${FILTER_ID}" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.025 0.018" numOctaves="2" seed="18" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="0.7" result="softNoise" />
        <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="12" xChannelSelector="R" yChannelSelector="G" />
      </filter>`;
    document.body.append(svg);
  }

  return () => {
    mountedGlassCount -= 1;
    if (mountedGlassCount === 0) document.getElementById(FILTER_ID)?.closest('svg')?.remove();
  };
}

export type GlassProps<T extends ElementType = 'div'> = {
  /** L'élément rendu pour le CONTENU. L'enveloppe reste un `<div>`. */
  readonly as?: T;
  readonly children?: ReactNode;
  /** Classe posée sur l'enveloppe, celle qui porte la silhouette et l'ombre. */
  readonly rootClassName?: string;
  readonly rootStyle?: CSSProperties;
  /** Fait naître une onde au point cliqué. */
  readonly enableLiquidAnimation?: boolean;
  /** Déclenche la même onde sans clic, depuis le centre. */
  readonly triggerAnimation?: boolean;
  /**
   * Le rebond d'appui. Par défaut, il ne part que sur un élément activable —
   * voir `PRESSABLE_TAGS`. À forcer quand le contrôle est frère du verre.
   */
  readonly pressFeedback?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

const RIPPLE_MS = 800;

function GlassInner<T extends ElementType = 'div'>(
  {
    as,
    children,
    className,
    rootClassName,
    rootStyle,
    enableLiquidAnimation = false,
    triggerAnimation = false,
    pressFeedback,
    onClick,
    ...props
  }: GlassProps<T>,
  ref: ForwardedRef<Element>,
) {
  const Component = (as ?? 'div') as ElementType;
  const pressable =
    pressFeedback ?? (typeof Component === 'string' && PRESSABLE_TAGS.has(Component));
  const container = useRef<HTMLDivElement>(null);
  /* LA CLÉ EST UN COMPTEUR, PAS UN HORODATAGE. `Date.now()` est impur : appelé
     pendant le rendu, il rend le composant non idempotent — deux rendus du même
     état donneraient deux clés. Le numéro de séquence se dérive de l'état
     précédent, donc il est stable à état égal tout en changeant à chaque onde,
     ce qui est exactement ce qu'on demande à cette clé : relancer l'animation
     quand deux clics se suivent plus vite qu'elle. */
  const [ripple, setRipple] = useState<{ x: number; y: number; seq: number } | null>(null);

  useEffect(() => ensureFilterMounted(), []);

  /* L'onde s'efface d'elle-même. Le `key` la remonte à neuf quand deux clics
     se suivent plus vite que l'animation : sans lui, le second clic ne
     relancerait rien, l'élément n'ayant pas changé. */
  useEffect(() => {
    if (!ripple) return undefined;
    const timer = setTimeout(() => setRipple(null), RIPPLE_MS);
    return () => clearTimeout(timer);
  }, [ripple]);

  /* L'ONDE PROGRAMMÉE S'AJUSTE PENDANT LE RENDU, PAS DANS UN EFFET.

     Écrite en effet, cette réaction déclenchait un second rendu après le
     premier — le motif que `react-hooks/set-state-in-effect` signale, et à
     juste titre : l'onde apparaissait une image trop tard. React documente
     pour ce cas l'ajustement d'état pendant le rendu, gardé par la comparaison
     avec la valeur précédente de la prop. C'est ce que fait ce bloc, et c'est
     la seule façon de lire `triggerAnimation` comme un FRONT (elle vient de
     passer à vrai) plutôt que comme un niveau. */
  const [wasTriggered, setWasTriggered] = useState(triggerAnimation);

  if (triggerAnimation !== wasTriggered) {
    setWasTriggered(triggerAnimation);
    if (triggerAnimation)
      setRipple((previous) => ({ x: 50, y: 50, seq: (previous?.seq ?? 0) + 1 }));
  }

  const handleClick = useCallback(
    (event: MouseEvent<Element>) => {
      if (enableLiquidAnimation && container.current) {
        const box = container.current.getBoundingClientRect();
        setRipple((previous) => ({
          x: ((event.clientX - box.left) / box.width) * 100,
          y: ((event.clientY - box.top) / box.height) * 100,
          seq: (previous?.seq ?? 0) + 1,
        }));
      }

      (onClick as ((event: MouseEvent<Element>) => void) | undefined)?.(event);
    },
    [enableLiquidAnimation, onClick],
  );

  return (
    <div
      ref={container}
      /* UN REPÈRE STABLE SUR L'ENVELOPPE. La classe du module est hachée à la
         compilation : ni un test, ni une feuille d'hôte ne peut la nommer. Cet
         attribut est le contrat par lequel on reconnaît « ceci est du verre »
         — c'est ce que vérifient les gardes, et ce qu'un hôte peut cibler pour
         adapter la scène autour du matériau. */
      data-opale-glass=""
      /* L'ABSENCE VAUT « NE REBONDIT PAS ». L'attribut n'est posé que sur les
         verres pressables, si bien qu'un conteneur ne peut pas hériter du
         rebond par accident : la feuille exige sa présence. */
      data-opale-glass-press={pressable ? 'true' : undefined}
      className={[styles.glass, ripple && styles.squishing, rootClassName]
        .filter(Boolean)
        .join(' ')}
      style={rootStyle}
    >
      {/* CHAQUE COUCHE EST NOMMÉE POUR L'HÔTE, pas seulement pour nous.

          Les feuilles de la vitrine habillent ces couches — la page du
          matériau leur pose un filtre de déplacement plus marqué, la barre du
          haut les atténue. Elles les visaient par `[class*='glassFilter']`,
          faute de mieux : la classe d'un module CSS est hachée à la
          compilation, donc innommable de l'extérieur. Ce raccourci a cassé net
          le jour où les couches ont changé de nom, et il l'a fait en silence —
          un sélecteur qui ne correspond à rien ne rougit nulle part.

          Ces attributs sont donc un CONTRAT, au même titre que les props. */}
      <div data-opale-glass-layer="refraction" className={styles.refraction} aria-hidden="true" />
      <div data-opale-glass-layer="tint" className={styles.tint} aria-hidden="true" />
      <div data-opale-glass-layer="specular" className={styles.specular} aria-hidden="true" />
      {ripple && (
        <span
          key={ripple.seq}
          className={styles.ripple}
          style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }}
          aria-hidden="true"
        />
      )}
      <Component
        {...props}
        ref={ref}
        onClick={handleClick}
        data-opale-glass-layer="content"
        className={[styles.content, className].filter(Boolean).join(' ')}
      >
        {children}
      </Component>
    </div>
  );
}

/* LA `ref` SUIT L'ÉLÉMENT DEMANDÉ, ET C'EST UNE CORRECTION.

   Une première version la typait `ForwardedRef<Element>`. C'est vrai à
   l'intérieur — le composant ne fait que la transmettre — mais faux à l'appel :
   `<Glass as="button" ref={monRefDeBouton}>` était refusé, `HTMLButtonElement`
   n'étant pas assignable à `Element` dans cette position (une `ref` est
   contravariante). Sept appelants ont cassé d'un coup.

   `ComponentPropsWithRef<T>['ref']` prend la ref que l'élément demandé accepte
   vraiment : `HTMLButtonElement` pour `as="button"`, `HTMLDivElement` par
   défaut. Le cast reste nécessaire parce que `forwardRef` efface la généricité
   — c'est le prix connu d'un composant polymorphe en TypeScript. */
const Glass = forwardRef(GlassInner) as <T extends ElementType = 'div'>(
  props: GlassProps<T> & { ref?: ComponentPropsWithRef<T>['ref'] },
) => ReturnType<typeof GlassInner>;

export default Glass;
