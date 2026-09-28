import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type ForwardRefExoticComponent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefAttributes,
} from 'react';

import Glass, { type GlassProps } from '../glass/Glass';
import styles from './style/Tabs.module.css';

/* =============================================================================
   LES ONGLETS, ÉCRITS PAR OPALE.

   POURQUOI CE FICHIER A ÉTÉ RÉÉCRIT. Il était copié d'une librairie tierce, et
   c'était le plus gros des composants repris — 796 lignes. `Tabs` n'est pas un
   assemblage de `<div>` : c'est un MOTIF, décrit au mot près par les pratiques
   ARIA, et un motif se tient ou ne se tient pas. Tant qu'il venait d'ailleurs,
   Opale héritait aussi de ce qui, chez eux, ne tenait pas.

   LE CONTRAT, POINT PAR POINT, ET C'EST LUI LA SPÉCIFICATION.

     — `role="tablist"` porte `aria-orientation` ; chaque déclencheur porte
       `role="tab"`, `aria-selected` et `aria-controls` ; chaque panneau porte
       `role="tabpanel"` et `aria-labelledby`. Les identifiants des deux bouts
       sont dérivés d'un même `useId`, donc ils ne peuvent pas se désapparier.

     — UN SEUL ARRÊT DE TABULATION POUR TOUT LE GROUPE. L'onglet qui compte est
       à `tabIndex` 0, les autres à -1 : la tabulation traverse le groupe d'un
       coup au lieu de le parcourir onglet par onglet, et ce sont les flèches
       qui circulent à l'intérieur.

     — LES FLÈCHES SUIVENT L'AXE : gauche/droite en horizontal, haut/bas en
       vertical, plus Début et Fin. En horizontal, haut et bas ne sont PAS
       interceptées — elles appartiennent au défilement de la page.

     — `activationMode` distingue enfin deux comportements. En `"auto"`, se
       déplacer change de panneau ; en `"manual"`, le déplacement ne fait que
       déplacer, et c'est Entrée ou Espace qui confirme. Le `<button>` natif
       fait ce dernier point sans une ligne de code.

   CE QUI CHANGE PAR RAPPORT À LA VERSION TIERCE, ET POURQUOI.

   — `activationMode` ÉTAIT INERTE. Le mode n'était lu que par une fonction
     `deactivate` exposée dans le contexte et JAMAIS APPELÉE : les deux modes
     se comportaient à l'identique, et la documentation promettait une
     distinction qui n'existait pas. La fonction disparaît, le mode agit.

   — LE PREMIER ONGLET NON DÉSACTIVÉ SE SÉLECTIONNAIT EN DERNIER. Sans
     `defaultValue`, chaque déclencheur portait un effet qui se sélectionnait
     lui-même s'il ne voyait aucune sélection. Or les effets d'un même rendu
     lisent tous la MÊME valeur périmée : les trois se croyaient premiers, les
     trois appelaient, et c'est le DERNIER qui l'emportait. Le composant
     s'ouvrait donc sur le dernier onglet en prétendant ouvrir le premier. La
     décision est remontée en un seul endroit — la liste, qui voit ses onglets
     dans l'ordre du document.

   — LE REGISTRE PARALLÈLE DES DÉCLENCHEURS A DISPARU. Le parent tenait une
     `Map` de déclencheurs et un tableau d'ordre, alimentés par quatre
     fonctions de contexte (`registerTrigger`, `unregisterTrigger`,
     `updateTriggerDisabled`, `focusValue`) — un second état, tenu à la main, à
     côté d'un DOM qui dit déjà tout : qui est là, dans quel ordre, et lequel
     est désactivé. Deux registres qui décrivent la même chose finissent par se
     contredire ; celui-ci se contredisait déjà, puisque son ORDRE était celui
     des montages et non celui du document. Le groupe se lit désormais dans le
     DOM, qui est la source de vérité — la même que celle sur laquelle
     l'indicateur se mesure.

   — UN `onFocus` QUI REDONNAIT LE FOCUS À L'ÉLÉMENT DÉJÀ FOCALISÉ. Le
     déclencheur se cherchait par `getElementById` pour appeler `focus()` sur
     lui-même, au moment précis où il venait de le recevoir. Supprimé.

   — LE PANNEAU EST ATTEIGNABLE À LA TABULATION (`tabIndex` 0). Sans lui, un
     panneau sans élément focalisable est un cul-de-sac : on lit son onglet, on
     tabule, et on saute par-dessus son contenu.

   — `lazyMount` GARDE CE QU'IL A MONTÉ. Il démontait le panneau à chaque fois
     qu'on le quittait, ce qui n'est pas « monter tard » mais « remonter
     toujours » : la carte rechargée, le formulaire vidé, le défilement perdu à
     chaque aller-retour. Le panneau n'existe toujours pas avant sa première
     ouverture ; ensuite il reste, simplement caché.

   — AUCUN TAILWIND. La feuille tierce empruntait chacune de ses déclarations
     à Tailwind par directive, et le TSX posait en plus des classes
     utilitaires en chaîne. Tailwind n'était une dépendance de ce paquet QUE
     pour ce code-là : il s'en va avec lui.

   L'INDICATEUR QUI GLISSE — la mécanique est celle de `SegmentedControl` dans
   `opale.tsx`, et elle est reprise plutôt que réinventée. Trois points pesés :

     1. `translate3d` ET `width`/`height`, PLUTÔT QU'UN AXE CHOISI SELON
        L'ORIENTATION. Poser les quatre grandeurs rend le code indifférent à
        l'axe : la liste verticale est animée par la même ligne que
        l'horizontale, et une liste qui passerait à la ligne resterait juste.

     2. LE PREMIER PLACEMENT NE S'ANIME PAS. À la première mise en page, les
        rectangles valent encore 0 ; un indicateur animé dès le montage
        partirait du coin haut gauche à chaque chargement de page. La
        transition n'est armée qu'APRÈS le premier placement réel, et après une
        lecture forcée de `offsetWidth` qui fait de cette position l'état de
        départ plutôt que la cible.

     3. `aria-selected` RESTE LA SOURCE DE VÉRITÉ. La position est lue dans le
        DOM : il ne peut donc pas y avoir de désaccord entre ce que
        l'assistance technique annonce et ce que la pastille montre. La
        pastille est `aria-hidden` — elle ne dit rien de plus.

   `prefers-reduced-motion` est traité dans `Tabs.module.css`, au plus près de
   la transition qu'il annule.
   ========================================================================== */

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivationMode = 'auto' | 'manual';

export type TabsContextValue = {
  /** L'onglet retenu, ou `undefined` tant qu'aucun ne l'est. */
  readonly value: string | undefined;
  /** Retient un onglet, et prévient l'appelant dans les deux modes. */
  readonly setValue: (next: string) => void;
  readonly activationMode: TabsActivationMode;
  readonly orientation: TabsOrientation;
  /** Vrai quand l'appelant tient la valeur : le composant n'écrit alors rien. */
  readonly isControlled: boolean;
  readonly getTriggerId: (value: string) => string;
  readonly getContentId: (value: string) => string;
  /* LA MATIÈRE PASSE PAR LE CONTEXTE, et elle n'a pas le choix : les
     déclencheurs sont écrits par l'appelant, un par un. Leur demander de
     répéter `liquidGlass` garantirait qu'un onglet finisse en verre au milieu
     de cinq onglets pleins. La racine décide, la liste suit. */
  readonly liquidGlass: boolean;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error(`${component} doit être rendu à l’intérieur de Tabs.`);
  }

  return context;
}

const classes = (...values: readonly (string | false | undefined)[]): string =>
  values.filter(Boolean).join(' ');

/* Une valeur d'onglet est écrite par l'appelant et se retrouve dans un `id` :
   tout ce qui n'est pas sûr dans un identifiant est remplacé. Le `useId` qui
   préfixe garde l'unicité même si deux valeurs se réduisent au même mot. */
const sanitizeIdPart = (part: string): string => part.replace(/[^a-zA-Z0-9_-]/g, '-');

/** Les déclencheurs de cette liste, dans l'ordre du document. */
function tabsOf(list: HTMLElement): readonly HTMLElement[] {
  return [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
}

/** Ceux d'entre eux qu'on peut atteindre : un bouton désactivé ne se focalise pas. */
function focusableTabsOf(list: HTMLElement): readonly HTMLElement[] {
  return tabsOf(list).filter(
    (tab) => !tab.hasAttribute('disabled') && tab.getAttribute('aria-disabled') !== 'true',
  );
}

/**
 * Pose l'arrêt de tabulation unique du groupe.
 *
 * POURQUOI CE RÉGLAGE EST IMPÉRATIF ALORS QUE LE DÉCLENCHEUR REND DÉJÀ SON
 * `tabIndex`. Le rendu suffit au cas courant — l'onglet sélectionné est
 * l'arrêt — mais il ne peut pas connaître les deux cas où ça ne suffit pas, et
 * les deux laissent le groupe SANS AUCUN arrêt, c'est-à-dire un composant que
 * la tabulation saute et que le clavier n'atteint plus du tout :
 *
 *   — en mode contrôlé, une `value` qui ne désigne aucun onglet (faute
 *     d'appel, valeur venue d'une URL, onglet retiré depuis) ;
 *   — un onglet sélectionné qui est aussi `disabled`.
 *
 * Et en activation manuelle, l'arrêt doit suivre le FOCUS et non la sélection :
 * qui s'est déplacé sur le troisième onglet sans le confirmer doit retrouver le
 * troisième onglet en revenant par la tabulation, pas le premier.
 *
 * Un déclencheur ne peut répondre à rien de tout cela depuis son seul rendu —
 * c'est une question de GROUPE, et le groupe se lit dans le DOM. Ce réglage est
 * donc rejoué après chaque rendu de la liste et à chaque prise de focus : c'est
 * toujours lui qui a le dernier mot, jamais un reste du rendu précédent.
 */
function roveTabStop(list: HTMLElement): void {
  const reachable = focusableTabsOf(list);

  if (reachable.length === 0) return;

  const focused = reachable.find((tab) => tab === document.activeElement);
  const selected = reachable.find((tab) => tab.getAttribute('aria-selected') === 'true');
  const stop = focused ?? selected ?? reachable[0];

  for (const tab of tabsOf(list)) {
    tab.tabIndex = tab === stop ? 0 : -1;
  }
}

/**
 * Les flèches, Début et Fin — le déplacement à l'intérieur du groupe.
 *
 * ÉCRIT HORS DU COMPOSANT, ET APPELÉ PAR LE DÉCLENCHEUR FOCALISÉ. Se déplacer
 * demande de connaître ses voisins, lesquels sont atteignables et dans quel
 * ordre ils sont posés — c'est-à-dire de lire le groupe entier. Le déclencheur
 * n'a rien de tout ça en mémoire, mais il a mieux : il est DANS le groupe, donc
 * il le retrouve par `closest`. Le registre parallèle que tenait la version
 * copiée servait à répondre à ces trois questions ; le DOM y répond déjà, et
 * sans jamais se désynchroniser.
 *
 * L'autre écriture possible — un seul gestionnaire posé sur la liste, qui
 * profite de la remontée des événements — a été essayée et écartée : elle
 * oblige à rendre la liste focalisable pour satisfaire `jsx-a11y`, c'est-à-dire
 * à poser un `tabIndex` sur un conteneur qui n'a aucune raison d'en avoir un.
 */
function moveWithKeyboard(
  event: KeyboardEvent<HTMLButtonElement>,
  orientation: TabsOrientation,
  activationMode: TabsActivationMode,
  setValue: (next: string) => void,
): void {
  const current = event.currentTarget;
  const list = current.closest<HTMLElement>('[role="tablist"]');

  if (!list) return;

  const reachable = focusableTabsOf(list);
  const index = reachable.indexOf(current);

  if (index === -1) return;

  const previousKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
  const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

  let destination: HTMLElement | undefined;

  switch (event.key) {
    /* La boucle est délibérée : après le dernier onglet vient le premier.
       C'est ce que décrivent les pratiques ARIA, et c'est ce qui évite qu'une
       flèche « ne fasse rien » en bout de liste. */
    case previousKey:
      destination = reachable[(index - 1 + reachable.length) % reachable.length];
      break;
    case nextKey:
      destination = reachable[(index + 1) % reachable.length];
      break;
    case 'Home':
      destination = reachable[0];
      break;
    case 'End':
      destination = reachable[reachable.length - 1];
      break;
    default:
      /* Tout le reste appartient à la page — en horizontal, haut et bas la
         font défiler, et les intercepter serait un vol. */
      return;
  }

  if (!destination) return;

  event.preventDefault();
  destination.focus();

  /* LA DIFFÉRENCE ENTRE LES DEUX MODES TIENT EN CES TROIS LIGNES. En activation
     automatique, le déplacement change de panneau ; en manuelle, il ne fait que
     déplacer, et c'est Entrée ou Espace — donc le clic natif du `<button>` —
     qui confirme. */
  if (activationMode === 'auto' && destination.dataset.value !== undefined) {
    setValue(destination.dataset.value);
  }
}

/**
 * Mesure l'onglet actif et y pose la pastille. Rend `true` quand la mesure
 * était exploitable, c'est-à-dire quand quelque chose a vraiment été placé.
 */
function placeIndicator(list: HTMLElement, indicator: HTMLElement): boolean {
  const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');

  if (!active) {
    indicator.style.opacity = '0';
    return false;
  }

  const listRect = list.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();

  /* Deux situations rendent la mesure inexploitable et une seule est une
     erreur : la première mise en page, où tout vaut encore 0, et jsdom, qui
     n'a pas de mise en page du tout. Dans les deux, on ne place RIEN plutôt
     que de poser une pastille de 0 px dans le coin — c'est ce placement
     fantôme qui produirait le glissement depuis le coin au premier vrai
     calcul. */
  if (activeRect.width === 0 || activeRect.height === 0) return false;

  /* Coordonnées du CONTENU, pas du visible : la pastille est absolue dans la
     liste, donc elle défile avec elle. Sans les `scroll*`, une liste d'onglets
     débordante la laisserait derrière. */
  const x = activeRect.left - listRect.left + list.scrollLeft;
  const y = activeRect.top - listRect.top + list.scrollTop;

  indicator.style.opacity = '1';
  indicator.style.width = `${activeRect.width}px`;
  indicator.style.height = `${activeRect.height}px`;
  indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;

  return true;
}

export type TabsProps = ComponentPropsWithoutRef<'div'> & {
  /** Présente, l'appelant tient la valeur : le composant n'écrit plus la sienne. */
  readonly value?: string;
  /** L'onglet initial en mode non contrôlé. */
  readonly defaultValue?: string;
  readonly onValueChange?: (next: string) => void;
  readonly activationMode?: TabsActivationMode;
  readonly orientation?: TabsOrientation;
  /**
   * Rend les onglets dans le matériau « verre liquide ».
   *
   * PAR DÉFAUT ILS SONT ORIGINAUX. Ce composant ne savait rendre que du verre :
   * le matériau est une OPTION de chaque composant d'Opale, jamais son seul
   * état.
   */
  readonly liquidGlass?: boolean;
} & GlassProps;

const TabsBase = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    activationMode = 'auto',
    orientation = 'horizontal',
    liquidGlass = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  const isControlled = valueProp !== undefined;
  const [ownValue, setOwnValue] = useState(defaultValue);
  const value = isControlled ? valueProp : ownValue;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setOwnValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const baseId = useId();
  const getTriggerId = useCallback(
    (triggerValue: string) => `${baseId}-trigger-${sanitizeIdPart(triggerValue)}`,
    [baseId],
  );
  const getContentId = useCallback(
    (triggerValue: string) => `${baseId}-content-${sanitizeIdPart(triggerValue)}`,
    [baseId],
  );

  const context = useMemo<TabsContextValue>(
    () => ({
      value,
      setValue,
      activationMode,
      orientation,
      isControlled,
      getTriggerId,
      getContentId,
      liquidGlass,
    }),
    [
      value,
      setValue,
      activationMode,
      orientation,
      isControlled,
      getTriggerId,
      getContentId,
      liquidGlass,
    ],
  );

  const contenu = classes(
    styles.tabs,
    orientation === 'vertical' && styles.tabsVertical,
    className,
  );

  return (
    <TabsContext.Provider value={context}>
      {liquidGlass ? (
        <Glass ref={ref} className={contenu} {...rest}>
          {children}
        </Glass>
      ) : (
        <div ref={ref} className={classes(contenu, styles.plain)} {...rest}>
          {children}
        </div>
      )}
    </TabsContext.Provider>
  );
});

TabsBase.displayName = 'Tabs';

export type TabsListProps = ComponentPropsWithoutRef<'div'> & {
  readonly children: ReactNode;
};

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, children, ...rest },
  ref,
) {
  const { value, setValue, isControlled, orientation } = useTabsContext('Tabs.List');

  const listRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const hasPlacedRef = useRef(false);

  const composedRef = useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node;

      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useLayoutEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;

    if (!list || !indicator) return undefined;

    /* AUCUNE SÉLECTION ET PERSONNE POUR EN DÉCIDER : c'est ici, et nulle part
       ailleurs, que le premier onglet atteignable se sélectionne. La liste est
       le seul endroit qui voit ses onglets DANS L'ORDRE DU DOCUMENT, donc le
       seul qui puisse dire lequel est le premier. En effet de mise en page, et
       non de rendu : la sélection est posée avant que le navigateur ne peigne,
       donc on ne voit jamais l'état sans onglet. L'effet est relancé aussitôt
       par le changement de valeur — d'où le retour immédiat. */
    if (!isControlled && value === undefined) {
      const first = focusableTabsOf(list)[0]?.dataset.value;

      if (first !== undefined) {
        setValue(first);
        return undefined;
      }
    }

    const sync = () => {
      roveTabStop(list);

      if (placeIndicator(list, indicator) && !hasPlacedRef.current) {
        hasPlacedRef.current = true;
        /* Lecture forcée de la mise en page : elle vide le calcul de style en
           attente, donc la position qu'on vient d'écrire devient l'état de
           DÉPART de la transition armée juste après, au lieu d'en être la
           cible. */
        void indicator.offsetWidth;
        indicator.dataset.animated = 'true';
      }
    };

    sync();

    /* Un onglet peut changer de largeur sans que la liste bouge (une police
       qui finit de charger, un libellé traduit), et la liste peut changer de
       largeur sans qu'aucun onglet bouge. Les deux sont observés. */
    const sizes = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(sync);
    const observeEverything = () => {
      if (!sizes) return;
      sizes.observe(list);
      for (const tab of tabsOf(list)) sizes.observe(tab);
    };

    observeEverything();

    /* Les onglets peuvent aussi APPARAÎTRE et DISPARAÎTRE — une liste rendue
       depuis des données qui arrivent. Ni le redimensionnement ni un rendu de
       ce composant ne le signalent : c'est le DOM qui change sous lui. On
       observe donc la liste elle-même, ce qui remet la pastille et l'arrêt de
       tabulation d'aplomb, et met les nouveaux onglets sous surveillance.
       Aucune boucle possible : `sync` n'écrit que des attributs, jamais un
       nœud, et seuls les nœuds sont observés ici. */
    const nodes =
      typeof MutationObserver === 'undefined'
        ? undefined
        : new MutationObserver(() => {
            observeEverything();
            sync();
          });

    nodes?.observe(list, { childList: true, subtree: true });
    window.addEventListener('resize', sync);

    return () => {
      sizes?.disconnect();
      nodes?.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [value, orientation, isControlled, setValue]);

  return (
    <div
      ref={composedRef}
      role="tablist"
      aria-orientation={orientation}
      className={classes(
        styles.tabsList,
        orientation === 'vertical' ? styles.tabsListVertical : styles.tabsListHorizontal,
        className,
      )}
      {...rest}
    >
      <span ref={indicatorRef} aria-hidden="true" className={styles.tabsIndicator} />
      {children}
    </div>
  );
});

TabsList.displayName = 'Tabs.List';

export type TabsTriggerProps = ComponentPropsWithoutRef<'button'> & {
  readonly value: string;
};

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { value, className, children, disabled, onClick, onKeyDown, onFocus, ...rest },
  ref,
) {
  const {
    value: selected,
    setValue,
    orientation,
    activationMode,
    getTriggerId,
    getContentId,
    liquidGlass,
  } = useTabsContext('Tabs.Trigger');

  const isSelected = selected === value;

  /* L'ORDRE EST LE MÊME POUR LES TROIS GESTIONNAIRES : le gestionnaire de
     l'appelant d'abord, le nôtre ensuite. Et pour les deux qui décident de
     quelque chose — le clic et la touche —, le nôtre ne s'exécute que si
     l'appelant n'a pas coupé court : un composant composé doit pouvoir se faire
     préempter sur un événement précis sans qu'on ait à le réécrire. */
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (!event.defaultPrevented) setValue(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);

    if (!event.defaultPrevented) moveWithKeyboard(event, orientation, activationMode, setValue);
  };

  /* L'arrêt de tabulation suit le focus : voir `roveTabStop`. C'est le seul
     moment où il se déplace sans qu'un rendu ait lieu — l'activation manuelle
     ne change rien à l'état tant qu'on n'a pas confirmé. */
  const handleFocus = (event: FocusEvent<HTMLButtonElement>) => {
    onFocus?.(event);

    const list = event.currentTarget.closest<HTMLElement>('[role="tablist"]');

    if (list) roveTabStop(list);
  };

  const attributsCommuns = {
    type: 'button',
    role: 'tab',
    id: getTriggerId(value),
    'data-value': value,
    'aria-selected': isSelected,
    'aria-controls': getContentId(value),
    tabIndex: isSelected ? 0 : -1,
    disabled,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
  } as const;

  if (!liquidGlass) {
    return (
      <button
        ref={ref}
        {...attributsCommuns}
        className={classes(
          styles.tabsTriggerRoot,
          styles.tabsTrigger,
          styles.plainTrigger,
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <Glass
      as="button"
      ref={ref}
      type="button"
      role="tab"
      id={getTriggerId(value)}
      /* La valeur est écrite dans le DOM parce que c'est le DOM qui sert de
         registre : le déplacement au clavier lit ici de quel onglet il s'agit,
         sans qu'un second état ait à être tenu à côté. */
      data-value={value}
      aria-selected={isSelected}
      aria-controls={getContentId(value)}
      /* L'arrêt de tabulation du cas courant. La liste le reprend après chaque
         rendu pour les cas qu'un déclencheur seul ne peut pas voir — voir
         `roveTabStop`. */
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      enableLiquidAnimation={!disabled}
      className={classes(styles.tabsTrigger, className)}
      rootClassName={styles.tabsTriggerRoot}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      {...rest}
    >
      {children}
    </Glass>
  );
});

TabsTrigger.displayName = 'Tabs.Trigger';

export type TabsContentProps = ComponentPropsWithoutRef<'div'> & {
  readonly value: string;
  /** Ne monte le panneau qu'à sa première ouverture. Ensuite il reste monté. */
  readonly lazyMount?: boolean;
};

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { value, lazyMount = false, className, children, ...rest },
  ref,
) {
  const { value: selected, getTriggerId, getContentId } = useTabsContext('Tabs.Content');

  const isActive = selected === value;

  /* « Monter tard » et « remonter à chaque fois » sont deux choses, et c'est la
     seconde que faisait le code d'origine. Ce drapeau retient que le panneau a
     déjà été ouvert : il n'est donc monté qu'à la première ouverture, puis il
     reste — caché, mais entier, avec son défilement, son formulaire à moitié
     rempli et ce qu'il a chargé. L'ajustement se fait pendant le rendu, ce que
     React permet pour son propre état, et non dans un effet qui aurait fait
     peindre une image de trop. */
  const [hasBeenActive, setHasBeenActive] = useState(isActive);

  if (isActive && !hasBeenActive) setHasBeenActive(true);

  if (lazyMount && !isActive && !hasBeenActive) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={getContentId(value)}
      aria-labelledby={getTriggerId(value)}
      hidden={!isActive}
      /* Le panneau est un arrêt de tabulation : sans lui, un panneau dont le
         contenu n'est pas focalisable serait purement et simplement sauté. */
      tabIndex={0}
      className={classes(styles.tabsContent, className)}
      {...rest}
    >
      {children}
    </div>
  );
});

TabsContent.displayName = 'Tabs.Content';

type TabsComponent = ForwardRefExoticComponent<TabsProps & RefAttributes<HTMLDivElement>> & {
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
  useTabs: () => TabsContextValue;
};

const Tabs = TabsBase as TabsComponent;

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;
Tabs.useTabs = () => useTabsContext('Tabs.useTabs');

export default Tabs;
