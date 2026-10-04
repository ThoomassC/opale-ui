import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react';
import clsx from 'clsx';

import Glass, { type GlassSurfaceProps } from '../glass/Glass';
import { normalizeSize, type OpaleSize } from '../../shared/vocabulary';
import styles from './style/Topbar.module.css';

/* =============================================================================
   LA BARRE D'APPLICATION, ÉCRITE PAR OPALE.

   POURQUOI CE FICHIER A ÉTÉ RÉÉCRIT. Il était copié d'une librairie tierce. Le
   propriétaire veut l'indépendance du paquet : plus une ligne qui vienne
   d'ailleurs, donc plus un défaut dont on hérite sans pouvoir le corriger.

   L'INTERFACE PUBLIQUE NE BOUGE PAS. `TopbarProps`, `TopbarSectionProps`,
   `TopbarBrandProps`, `TopbarActionsProps`, `TopbarDividerProps` gardent leurs
   noms, leurs props et leur comportement ; `Topbar.useTopbar()` rend toujours
   `{ size }`. Les pages de la vitrine documentent cette surface, et un
   document qui ment est pire qu'un document absent.

   CE QUI CHANGE, ET POURQUOI.

   — LA LARGEUR ET L'OMBRE PASSENT SUR L'ENVELOPPE DU VERRE. Les deux étaient
     posées sur le `<header>` INTÉRIEUR, c'est-à-dire du mauvais côté de
     `overflow: hidden` et du mauvais côté d'un `width: fit-content`. L'ombre
     d'`elevated` était donc rognée par son propre parent — la vitrine l'avait
     mesuré et demandait `elevated={false}` pour ne pas annoncer une élévation
     que rien ne peignait — et la barre ne s'étendait pas hors d'un conteneur
     qui l'étirait de lui-même. Voir la feuille pour le détail.

   — `as` QUITTE LA SURFACE PUBLIQUE. `TopbarProps` intersectait `GlassProps`
     en entier, donc exposait le `as` du verre ; et le composant étalait
     `{...rest}` APRÈS son propre `as="header"`. Un appelant pouvait donc
     remplacer l'élément rendu — c'est-à-dire faire disparaître le point de
     repère `banner` — en passant une prop que la documentation ne mentionne
     nulle part. Seules les deux props d'habillage de l'enveloppe restent
     (`rootClassName`, `rootStyle`), nommées une par une ; l'onde
     (`enableLiquidAnimation`, `triggerAnimation`) est interne au matériau
     depuis la 4.0.0.

   — L'ENCRE N'EST PLUS ÉCRITE. Voir la feuille : la version tierce posait
     `text-white` en dur, ce qui condamnait la barre aux fonds sombres.

   `Topbar` N'A TOUJOURS AUCUN ÉTAT, et c'est ce qui le distingue des autres
   composants composés du paquet : son contexte ne porte qu'une taille, lue par
   la marque et par le séparateur pour s'y accorder. Il n'y a rien à contrôler,
   rien à synchroniser, aucune valeur à remonter.
   ========================================================================== */

/** Le vocabulaire de taille que lisent la marque, le séparateur et `useTopbar`. */
type TopbarSize = 'compact' | 'comfortable' | 'spacious';

/* `useTopbar().size` garde les noms historiques : ses lecteurs comparent à
   `compact`, `comfortable` ou `spacious`. */
const TOPBAR_SIZE: Readonly<Record<OpaleSize, TopbarSize>> = {
  small: 'compact',
  medium: 'comfortable',
  large: 'spacious',
};

export type TopbarContextValue = {
  size: TopbarSize;
};

const TopbarContext = createContext<TopbarContextValue | null>(null);

/**
 * Le contexte, ou une erreur qui nomme le coupable.
 *
 * `Topbar.Brand` et `Topbar.Divider` accordent leur taille à celle de la barre.
 * Rendus hors d'un `Topbar`, ils n'ont pas de repli raisonnable : une taille
 * par défaut silencieuse donnerait une pastille de marque qui ne s'accorde à
 * rien, et le défaut ne se verrait qu'à l'écran. On jette, avec le nom du
 * composant fautif — c'est ce que la page de la vitrine promet.
 */
const useTopbarContext = (component: string) => {
  const context = useContext(TopbarContext);

  if (!context) {
    throw new Error(`${component} must be used within Topbar`);
  }

  return context;
};

/** L'espacement entre les éléments d'une section de la barre. */
export type TopbarGap = 'tight' | 'regular' | 'relaxed';

export type TopbarProps = ComponentPropsWithoutRef<'header'> & {
  /** La hauteur de la barre. `compact`, `comfortable` et `spacious` valent `small`, `medium` et `large`. */
  size?: OpaleSize | TopbarSize;
  /** Pose l'ombre d'élévation sous la barre. Défaut : `true`. */
  elevated?: boolean;
  /**
   * Rend la barre dans le matériau « verre liquide ».
   *
   * PAR DÉFAUT ELLE EST ORIGINALE. Ce composant ne savait rendre que du verre :
   * le matériau est une OPTION de chaque composant d'Opale, jamais son seul
   * état.
   */
  liquidGlass?: boolean;
} & Pick<GlassSurfaceProps, 'rootClassName' | 'rootStyle'>;

const sizeClassMap: Record<TopbarSize, string> = {
  compact: styles.compact,
  comfortable: styles.comfortable,
  spacious: styles.spacious,
};

const TopbarBase = forwardRef<HTMLElement, TopbarProps>(
  (
    {
      size: sizeProp,
      elevated = true,
      liquidGlass = false,
      className,
      rootClassName,
      rootStyle,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    const size = TOPBAR_SIZE[normalizeSize(sizeProp, 'medium')];
    const value = useMemo<TopbarContextValue>(() => ({ size }), [size]);

    const shellClasses = clsx(
      'opale-topbar__shell',
      styles.topbarRoot,
      elevated && styles.elevated,
      rootClassName,
    );
    const contentClasses = clsx('opale-topbar', styles.topbar, sizeClassMap[size], className);

    /* SANS VERRE, LES DEUX CLASSES SE POSENT SUR UN SEUL ÉLÉMENT. Le matériau
       a besoin d'une enveloppe — c'est elle qui porte la silhouette et les
       trois couches — et le contenu vit dedans. Une barre pleine n'a pas cette
       contrainte : la même géométrie tient sur un `<header>` unique. */
    if (!liquidGlass) {
      return (
        <TopbarContext.Provider value={value}>
          <header
            ref={ref}
            className={clsx(shellClasses, contentClasses, styles.plain)}
            style={rootStyle ? { ...rootStyle, ...style } : style}
            {...rest}
          >
            {children}
          </header>
        </TopbarContext.Provider>
      );
    }

    return (
      <TopbarContext.Provider value={value}>
        <Glass
          as="header"
          ref={ref}
          /* `rootClassName` EST FUSIONNÉE ET NON REMPLACÉE. L'enveloppe porte
             désormais la largeur et l'ombre : la laisser écraser par celle de
             l'appelant lui ferait perdre les deux au moment précis où il veut
             juste ajouter un crochet de style. */
          rootClassName={shellClasses}
          rootStyle={rootStyle}
          className={contentClasses}
          style={style}
          {...rest}
        >
          {children}
        </Glass>
      </TopbarContext.Provider>
    );
  },
);

TopbarBase.displayName = 'Topbar';

export type TopbarSectionProps = ComponentPropsWithoutRef<'div'> & {
  /** La section prend l'espace restant. Défaut : `false`. */
  grow?: boolean;
  /** L'alignement des éléments de la section. Défaut : `left`. */
  align?: 'left' | 'center' | 'right' | 'between';
  /** L'espacement entre les éléments. Défaut : `regular`. */
  gap?: TopbarGap;
  /** Autorise le retour à la ligne des éléments. Défaut : `false`. */
  wrap?: boolean;
};

const alignClassMap: Record<NonNullable<TopbarSectionProps['align']>, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
  between: styles.alignBetween,
};

const gapClassMap: Record<TopbarGap, string> = {
  tight: styles.gapTight,
  regular: styles.gapRegular,
  relaxed: styles.gapRelaxed,
};

const TopbarSection = forwardRef<HTMLDivElement, TopbarSectionProps>(
  ({ grow = false, align = 'left', gap = 'regular', wrap = false, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'opale-topbar__section',
        styles.section,
        wrap ? styles.sectionWrap : styles.sectionNoWrap,
        gapClassMap[gap],
        grow && styles.sectionGrow,
        alignClassMap[align],
        className,
      )}
      {...rest}
    />
  ),
);

TopbarSection.displayName = 'Topbar.Section';

export type TopbarBrandProps = ComponentPropsWithoutRef<'div'> & {
  /** Le visuel de la marque, décoratif. */
  icon?: ReactNode;
  /** Le nom de la marque. */
  title?: ReactNode;
  /** La ligne sous le nom. */
  subtitle?: ReactNode;
  /** Une classe ajoutée au cadre de l'icône. */
  iconClassName?: string;
};

const brandIconClassMap: Record<TopbarSize, string> = {
  compact: styles.brandIconCompact,
  comfortable: styles.brandIconComfortable,
  spacious: styles.brandIconSpacious,
};

/**
 * La marque : une pastille, un titre, un sous-titre — ou ce que vous voulez.
 *
 * `children` REMPLACE `title` ET `subtitle` À LA FOIS, et pas seulement l'un
 * des deux. C'est le comportement d'origine, il est documenté, et il a une
 * raison : les trois emplacements rendent des `<span>`, ce qui ne convient pas
 * dès que la marque doit être un LIEN de retour à l'accueil. La coquille de
 * cette vitrine est exactement ce cas — elle passe son `<a>` en enfants et ne
 * garde du composant que la boîte.
 */
const TopbarBrand = forwardRef<HTMLDivElement, TopbarBrandProps>(
  ({ icon, title, subtitle, iconClassName, children, className, ...rest }, ref) => {
    const { size } = useTopbarContext('Topbar.Brand');

    return (
      <div ref={ref} className={clsx('opale-topbar__brand', styles.brand, className)} {...rest}>
        {icon ? (
          /* L'ICÔNE EST DÉCORATIVE, et elle l'est vraiment : le titre est à
             côté, dans le même bloc. L'annoncer reviendrait à faire lire
             « image, Voyages » là où « Voyages » suffit. */
          <span
            className={clsx(
              'opale-topbar__brand-icon',
              styles.brandIcon,
              brandIconClassMap[size],
              iconClassName,
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}

        <div className={clsx('opale-topbar__brand-content', styles.brandContent)}>
          {/* LE TEST DE PRÉSENCE EST UNE VÉRACITÉ ET NON UN `??`, comme dans
              l'original : `children` vaut `false` dès qu'un appelant écrit
              `{condition && <a/>}`, et un `??` rendrait alors ni le lien ni le
              titre — une marque vide, sans erreur nulle part. */}
          {children ? (
            children
          ) : (
            <>
              {title ? (
                <span className={clsx('opale-topbar__brand-title', styles.brandTitle)}>
                  {title}
                </span>
              ) : null}
              {subtitle ? (
                <span className={clsx('opale-topbar__brand-subtitle', styles.brandSubtitle)}>
                  {subtitle}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  },
);

TopbarBrand.displayName = 'Topbar.Brand';

export type TopbarActionsProps = ComponentPropsWithoutRef<'div'> & {
  /** L'espacement entre les actions. Défaut : `tight`. */
  gap?: TopbarGap;
};

/** Une `Topbar.Section` préréglée : alignée à droite, gouttière serrée. */
const TopbarActions = forwardRef<HTMLDivElement, TopbarActionsProps>(
  ({ gap = 'tight', className, ...rest }, ref) => (
    <TopbarSection
      ref={ref}
      align="right"
      gap={gap}
      className={clsx('opale-topbar__actions', styles.actions, className)}
      {...rest}
    />
  ),
);

TopbarActions.displayName = 'Topbar.Actions';

export type TopbarDividerProps = ComponentPropsWithoutRef<'div'>;

const dividerClassMap: Record<TopbarSize, string> = {
  compact: styles.dividerCompact,
  comfortable: styles.dividerComfortable,
  spacious: styles.dividerSpacious,
};

/**
 * Le filet vertical entre deux groupes.
 *
 * `aria-hidden` ET NON `role="separator"`, et c'est délibéré. Un séparateur
 * annoncé n'a de sens que s'il sépare deux ensembles qu'un lecteur d'écran
 * parcourt en séquence et risque de confondre ; ici il découpe une rangée
 * d'outils dont chacun porte déjà son propre nom. Annoncer « séparateur » deux
 * fois dans une barre de six contrôles est du bruit, pas de l'information.
 */
const TopbarDivider = forwardRef<HTMLDivElement, TopbarDividerProps>(
  ({ className, ...rest }, ref) => {
    const { size } = useTopbarContext('Topbar.Divider');

    return (
      <div
        ref={ref}
        className={clsx('opale-topbar__divider', styles.divider, dividerClassMap[size], className)}
        aria-hidden="true"
        {...rest}
      />
    );
  },
);

TopbarDivider.displayName = 'Topbar.Divider';

type TopbarCompoundComponent = ForwardRefExoticComponent<
  TopbarProps & RefAttributes<HTMLElement>
> & {
  Section: typeof TopbarSection;
  Brand: typeof TopbarBrand;
  Actions: typeof TopbarActions;
  Divider: typeof TopbarDivider;
  useTopbar: () => TopbarContextValue;
};

const Topbar = TopbarBase as TopbarCompoundComponent;

Topbar.Section = TopbarSection;
Topbar.Brand = TopbarBrand;
Topbar.Actions = TopbarActions;
Topbar.Divider = TopbarDivider;
Topbar.useTopbar = () => useTopbarContext('Topbar.useTopbar');

export default Topbar;

/* LES PARTIES SOUS LEUR PROPRE NOM, pour les Server Components : une référence
   client ne se lit pas par un point, `Topbar.Section` y lève une erreur.
   `TopbarSection` est le même objet que `Topbar.Section`. */
export { TopbarSection, TopbarBrand, TopbarActions, TopbarDivider };
