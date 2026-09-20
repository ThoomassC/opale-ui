/* Vendored from react-magic-ui — MIT, Copyright (c) 2025 tweeedlex.
   https://github.com/tweeedlex/react-magic-ui
   Kept byte-faithful on purpose: this file is NOT covered by Opale's colour
   contract and is not styled with Opale's tokens. See src/magic/README.md. */
/* ÉCART OPALE — UN INDICATEUR UNIQUE QUI GLISSE SOUS L'ONGLET ACTIF.

   Chez eux, la sélection est UNIQUEMENT une classe posée sur le déclencheur
   choisi (`.triggerSelected`). Deux fonds distincts s'allument et s'éteignent
   donc en même temps sur deux éléments différents : à l'écran, le fond SAUTE
   d'un onglet à l'autre, sans aucun déplacement à suivre des yeux. Aucune
   transition CSS ne peut rattraper ça, parce qu'il n'y a rien qui se déplace.

   Un seul élément décoratif est donc rendu dans la liste, et c'est LUI qui
   porte le fond de la sélection. Il est mesuré au déclencheur actif puis
   déplacé en `translate3d` + `width`/`height`. Trois conséquences pesées :

   - `translate3d` ET `width`/`height` PLUTÔT QU'UN AXE CHOISI SELON
     `orientation`. Poser les quatre grandeurs rend le code indifférent à
     l'axe : la liste verticale est animée par la même ligne que l'horizontale,
     et un `.tabsList` qui passe à la ligne (`flex-wrap` chez un consommateur)
     reste juste. Un indicateur qui n'animerait que `translateX` et `width`
     aurait demandé une seconde branche, et se serait trompé au retour à la
     ligne.

   - LE PREMIER PLACEMENT NE S'ANIME PAS. À la première mise en page, les
     rectangles valent encore 0 : un indicateur animé dès le montage partirait
     du coin haut-gauche et glisserait jusqu'à sa place sous les yeux de
     l'utilisateur, à chaque chargement de page. La transition n'est donc armée
     (`data-animated`) qu'APRÈS le premier placement, et après une lecture de
     `offsetWidth` qui force le navigateur à prendre cette position pour état
     de départ.

   - `role="tab"` + `aria-selected` RESTENT LA SOURCE DE VÉRITÉ. La position
     est lue dans le DOM, pas dans un second registre tenu en parallèle : il ne
     peut pas y avoir de désaccord entre ce que l'assistance technique annonce
     et ce que l'indicateur montre. L'indicateur est `aria-hidden` : il ne dit
     rien de plus que `aria-selected`, et n'a donc rien à faire dans l'arbre
     d'accessibilité.

   `prefers-reduced-motion` est traité dans `Tabs.module.scss`, au plus près de
   la transition qu'il annule. */

import React, {
  type ComponentPropsWithoutRef,
  type ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../../func";
import Glass, { type GlassProps } from "../glass/Glass";
import Button from "../button/Button";
import styles from "./style/Tabs.module.scss";

type TabsOrientation = "horizontal" | "vertical";
type TabsActivationMode = "auto" | "manual";

type TriggerEntry = {
  ref: HTMLButtonElement | null;
  disabled: boolean;
};

export type TabsContextValue = {
  value?: string;
  setValue: (next: string) => void;
  deactivate: (next: string) => void;
  activationMode: TabsActivationMode;
  orientation: TabsOrientation;
  isControlled: boolean;
  registerTrigger: (value: string, node: HTMLButtonElement | null, disabled: boolean) => void;
  unregisterTrigger: (value: string) => void;
  updateTriggerDisabled: (value: string, disabled: boolean) => void;
  focusValue: (value: string) => void;
  getEnabledTriggerValues: () => string[];
  getTriggerId: (value: string) => string;
  getContentId: (value: string) => string;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

const useTabsContext = (component: string) => {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error(`${component} must be used within Tabs`);
  }

  return context;
};

const sanitizeIdPart = (part: string) => part.replace(/[^a-zA-Z0-9_-]/g, "-");

export type TabsProps = ComponentPropsWithoutRef<"div"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (next: string) => void;
  activationMode?: TabsActivationMode;
  orientation?: TabsOrientation;
} & GlassProps;

const TabsBase = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value: valueProp,
      defaultValue,
      onValueChange,
      activationMode = "auto",
      orientation = "horizontal",
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const isControlled = valueProp !== undefined;
    const [valueState, setValueState] = useState(defaultValue);

    const value = isControlled ? valueProp : valueState;

    const setValue = useCallback(
      (next: string) => {
        if (!isControlled) {
          setValueState(next);
        }

        onValueChange?.(next);
      },
      [isControlled, onValueChange],
    );

    const triggerEntries = useRef<Map<string, TriggerEntry>>(new Map());
    const triggerOrder = useRef<string[]>([]);

    const registerTrigger = useCallback(
      (triggerValue: string, node: HTMLButtonElement | null, disabled: boolean) => {
        const sanitizedValue = triggerValue;

        if (node) {
          triggerEntries.current.set(sanitizedValue, { ref: node, disabled });
          if (!triggerOrder.current.includes(sanitizedValue)) {
            triggerOrder.current.push(sanitizedValue);
          }
        } else {
          triggerEntries.current.delete(sanitizedValue);
          triggerOrder.current = triggerOrder.current.filter((item) => item !== sanitizedValue);
        }
      },
      [],
    );

    const unregisterTrigger = useCallback((triggerValue: string) => {
      triggerEntries.current.delete(triggerValue);
      triggerOrder.current = triggerOrder.current.filter((item) => item !== triggerValue);
    }, []);

    const updateTriggerDisabled = useCallback((triggerValue: string, disabled: boolean) => {
      const entry = triggerEntries.current.get(triggerValue);

      if (entry) {
        entry.disabled = disabled;
      }
    }, []);

    const focusValue = useCallback((nextValue: string) => {
      const entry = triggerEntries.current.get(nextValue);
      entry?.ref?.focus();
    }, []);

    const getEnabledTriggerValues = useCallback(() => {
      return triggerOrder.current.filter((item) => {
        const entry = triggerEntries.current.get(item);
        return Boolean(entry) && !entry?.disabled;
      });
    }, []);

    const baseId = useId();

    const getTriggerId = useCallback(
      (triggerValue: string) =>
        `${baseId}-trigger-${sanitizeIdPart(triggerValue)}`,
      [baseId],
    );

    const getContentId = useCallback(
      (triggerValue: string) =>
        `${baseId}-content-${sanitizeIdPart(triggerValue)}`,
      [baseId],
    );

    const deactivate = useCallback(
      (next: string) => {
        if (activationMode === "auto") {
          setValue(next);
        }
      },
      [activationMode, setValue],
    );

    const contextValue = useMemo<TabsContextValue>(
      () => ({
        value,
        setValue,
        deactivate,
        activationMode,
        orientation,
        isControlled,
        registerTrigger,
        unregisterTrigger,
        updateTriggerDisabled,
        focusValue,
        getEnabledTriggerValues,
        getTriggerId,
        getContentId,
      }),
      [value, setValue, deactivate, activationMode, orientation, isControlled, registerTrigger, unregisterTrigger, updateTriggerDisabled, focusValue, getEnabledTriggerValues, getTriggerId, getContentId],
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <Glass
          ref={ref}
          className={cn(
            styles.tabs,
            orientation === "vertical" ? styles.tabsVertical : "",
            className,
          )}
          {...rest}
        >
          {children}
        </Glass>
      </TabsContext.Provider>
    );
  },
);

TabsBase.displayName = "Tabs";

export type TabsListProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
};

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...rest }, ref) => {
    const { orientation, value } = useTabsContext("Tabs.List");

    const listRef = useRef<HTMLDivElement | null>(null);
    const indicatorRef = useRef<HTMLSpanElement | null>(null);
    const hasPlacedRef = useRef(false);

    const composedRef = useCallback(
      (node: HTMLDivElement | null) => {
        listRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    useLayoutEffect(() => {
      const list = listRef.current;
      const indicator = indicatorRef.current;

      if (!list || !indicator) return;

      const place = () => {
        const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');

        if (!active) {
          indicator.style.opacity = "0";
          return;
        }

        const listRect = list.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();

        /* Deux cas rendent la mesure inexploitable et un seul est une erreur :
           la première mise en page d'un conteneur Glass, où tout vaut encore 0,
           et jsdom, qui n'a pas de mise en page du tout. Dans les deux, on ne
           place RIEN plutôt que de placer un indicateur de 0 px en haut à
           gauche — c'est ce placement fantôme qui produirait le glissement
           depuis le coin au premier vrai calcul. */
        if (activeRect.width === 0 || activeRect.height === 0) return;

        /* Coordonnées du CONTENU, pas du visible : l'indicateur est absolu dans
           la liste, donc il défile avec elle. Sans les `scroll*`, une liste
           d'onglets débordante le laisserait derrière. */
        const x = activeRect.left - listRect.left + list.scrollLeft;
        const y = activeRect.top - listRect.top + list.scrollTop;

        indicator.style.opacity = "1";
        indicator.style.width = `${activeRect.width}px`;
        indicator.style.height = `${activeRect.height}px`;
        indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        if (!hasPlacedRef.current) {
          hasPlacedRef.current = true;
          /* Lecture forcée de la mise en page : elle vide le calcul de style en
             attente, donc la position ci-dessus devient l'état de DÉPART de la
             transition qu'on arme juste après, au lieu d'en être la cible. */
          void indicator.offsetWidth;
          indicator.dataset.animated = "true";
        }
      };

      place();

      /* Un onglet peut changer de largeur sans que la liste bouge (chargement
         d'une police, libellé traduit), et la liste peut changer de largeur
         sans qu'aucun onglet bouge. Les deux sont observés. */
      const observer =
        typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(place);

      if (observer) {
        observer.observe(list);
        list.querySelectorAll('[role="tab"]').forEach((trigger) => observer.observe(trigger));
      }

      window.addEventListener("resize", place);

      return () => {
        observer?.disconnect();
        window.removeEventListener("resize", place);
      };
    }, [orientation, value]);

    return (
      <div
        ref={composedRef}
        role="tablist"
        aria-orientation={orientation}
        className={cn(
          styles.tabsList,
          orientation === "vertical" ? styles.tabsListVertical : styles.tabsListHorizontal,
          className,
        )}
        {...rest}
      >
        <span ref={indicatorRef} aria-hidden="true" className={styles.tabsIndicator} />
        {children}
      </div>
    );
  },
);

TabsList.displayName = "Tabs.List";

export type TabsTriggerProps = ComponentPropsWithoutRef<"button"> & {
  value: string;
};

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, disabled, className, onClick, onFocus, onKeyDown, children, ...rest }, ref) => {
    const {
      value: selectedValue,
      setValue,
      orientation,
      isControlled,
      registerTrigger,
      unregisterTrigger,
      updateTriggerDisabled,
      getTriggerId,
      getContentId,
      getEnabledTriggerValues,
      focusValue,
    } = useTabsContext("Tabs.Trigger");

    const triggerId = getTriggerId(value);
    const contentId = getContentId(value);
    const isSelected = selectedValue === value;

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      setValue(value);
      onClick?.(event);
    }, [disabled, onClick, setValue, value]);

    const handleFocus = useCallback((event: React.FocusEvent<HTMLButtonElement>) => {
      // Focus the trigger when tabbing in from outside the tab list
      if (event.target === event.currentTarget) {
        const enabledValues = getEnabledTriggerValues();
        const currentIndex = enabledValues.indexOf(value);
        if (currentIndex === -1) return;
        
        const triggerElement = document.getElementById(triggerId);
        if (triggerElement) {
          triggerElement.focus();
        }
      }
      onFocus?.(event);
    }, [getEnabledTriggerValues, onFocus, triggerId, value]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);
      
      if (event.defaultPrevented) return;
      
      const enabledValues = getEnabledTriggerValues();
      if (enabledValues.length === 0) return;
      
      const currentIndex = enabledValues.indexOf(value);
      if (currentIndex === -1) return;
      
      const moveFocus = (direction: 1 | -1) => {
        let nextIndex = currentIndex + direction;
        
        // Wrap around if needed
        if (nextIndex < 0) {
          nextIndex = enabledValues.length - 1;
        } else if (nextIndex >= enabledValues.length) {
          nextIndex = 0;
        }
        
        focusValue(enabledValues[nextIndex]);
      };
      
      switch (event.key) {
        case 'ArrowLeft':
          if (orientation === 'horizontal') {
            event.preventDefault();
            moveFocus(-1);
          }
          break;
          
        case 'ArrowRight':
          if (orientation === 'horizontal') {
            event.preventDefault();
            moveFocus(1);
          }
          break;
          
        case 'ArrowUp':
          if (orientation === 'vertical') {
            event.preventDefault();
            moveFocus(-1);
          }
          break;
          
        case 'ArrowDown':
          if (orientation === 'vertical') {
            event.preventDefault();
            moveFocus(1);
          }
          break;
          
        case 'Home':
          event.preventDefault();
          focusValue(enabledValues[0]);
          break;
          
        case 'End':
          event.preventDefault();
          focusValue(enabledValues[enabledValues.length - 1]);
          break;
      }
    }, [focusValue, getEnabledTriggerValues, onKeyDown, orientation, value]);

    // handleFocus is already defined above with useCallback

    const composedRef = useCallback(
      (node: HTMLButtonElement | null) => {
        registerTrigger(value, node, Boolean(disabled));

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }

        if (!node) {
          unregisterTrigger(value);
        }
      },
      [disabled, ref, registerTrigger, unregisterTrigger, value],
    );

    useEffect(() => {
      updateTriggerDisabled(value, Boolean(disabled));
    }, [disabled, updateTriggerDisabled, value]);

    useEffect(() => {
      if (!isControlled && selectedValue === undefined && !disabled) {
        setValue(value);
      }
    }, [disabled, isControlled, selectedValue, setValue, value]);

    return (
      <Button
        ref={composedRef}
        role="tab"
        id={triggerId}
        size="small"
        enableClickAnimation={true}
        className={cn(
          styles.tabsTrigger,
          isSelected ? styles.triggerSelected : "",
          className,
        )}
        aria-selected={isSelected}
        aria-controls={contentId}
        tabIndex={isSelected ? 0 : -1}
        disabled={disabled}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {children}
      </Button>
    );
  },
);

TabsTrigger.displayName = "Tabs.Trigger";

export type TabsContentProps = ComponentPropsWithoutRef<"div"> & {
  value: string;
  lazyMount?: boolean;
};

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, lazyMount, className, children, ...rest }, ref) => {
    const { value: selectedValue, getTriggerId, getContentId } = useTabsContext("Tabs.Content");

    const isActive = selectedValue === value;

    if (lazyMount && !isActive) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={getContentId(value)}
        aria-labelledby={getTriggerId(value)}
        hidden={!isActive}
        className={cn(
          styles.tabsContent,
          !isActive ? styles.contentHidden : "",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

TabsContent.displayName = "Tabs.Content";

type TabsCompoundComponent = React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>> & {
  List: typeof TabsList;
  Trigger: typeof TabsTrigger;
  Content: typeof TabsContent;
  useTabs: () => TabsContextValue;
};

const Tabs = TabsBase as TabsCompoundComponent;

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;
Tabs.useTabs = () => useTabsContext("Tabs.useTabs");

export default Tabs;


