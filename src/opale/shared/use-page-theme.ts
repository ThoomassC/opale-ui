import { useLayoutEffect } from 'react';

import { PAGE_THEME_ATTRIBUTE, PAGE_THEME_COPY_ATTRIBUTE } from './page-theme-context';

/* =============================================================================
   LE THÈME DU GABARIT DU DOCUMENT, POUR LA FILE DE NOTIFICATIONS (THM-05).
   Interne : non réexporté.

   `Modal` et `Toast` lisent le thème de leur gabarit par contexte
   (`page-theme-context.ts`). `ToastProvider` ne le peut pas : il est le plus
   souvent posé AU-DESSUS du gabarit, à la racine de l'application. Sa file
   prend donc le thème du gabarit du document quand il n'y en a qu'un — c'est
   alors la page, et son thème est celui de la page. Plusieurs, et aucun ne
   peut parler pour tous : on ne pose rien.

   LE GABARIT PEUT CHANGER SOUS UN TOAST PERSISTANT — une navigation client
   remplace une page sombre par une claire. L'observateur suit donc `<body>`,
   enfants et attribut de thème compris, et seulement tant que `enabled` est
   vrai, c'est-à-dire tant qu'un toast est affiché. Il ne réécrit l'attribut
   que s'il change : sa propre écriture ne le relance pas indéfiniment.

   Posé à l'effet de mise en page, avant la première peinture.
   ========================================================================== */

const SCAFFOLD_SELECTOR = `[${PAGE_THEME_ATTRIBUTE}]:not([${PAGE_THEME_COPY_ATTRIBUTE}])`;

function documentScaffoldTheme(): string | null {
  const scaffolds = document.querySelectorAll(SCAFFOLD_SELECTOR);
  return scaffolds.length === 1 ? scaffolds[0].getAttribute(PAGE_THEME_ATTRIBUTE) : null;
}

function writeTheme(element: HTMLElement, theme: string | null) {
  if (element.getAttribute(PAGE_THEME_ATTRIBUTE) === theme) return;
  if (theme === null) {
    element.removeAttribute(PAGE_THEME_ATTRIBUTE);
    element.removeAttribute(PAGE_THEME_COPY_ATTRIBUTE);
  } else {
    element.setAttribute(PAGE_THEME_ATTRIBUTE, theme);
    element.setAttribute(PAGE_THEME_COPY_ATTRIBUTE, '');
  }
}

/**
 * Copie sur `element` le thème du gabarit unique du document tant que
 * `enabled` est vrai, et le retire ensuite. `element` est un nœud, pas une
 * ref : un nœud remplacé relance l'effet au lieu d'écrire sur un détaché.
 */
export function useDocumentPageTheme(element: HTMLElement | null, enabled: boolean): void {
  useLayoutEffect(() => {
    if (!enabled || !element) return undefined;

    const apply = () => writeTheme(element, documentScaffoldTheme());
    apply();

    const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(apply);
    observer?.observe(document.body, {
      subtree: true,
      childList: true,
      attributeFilter: [PAGE_THEME_ATTRIBUTE],
    });

    return () => {
      observer?.disconnect();
      writeTheme(element, null);
    };
  }, [element, enabled]);
}
