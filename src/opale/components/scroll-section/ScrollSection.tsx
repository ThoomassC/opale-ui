import { useCallback, useContext, type ComponentPropsWithRef } from 'react';
import clsx from 'clsx';

import { mergeRefs } from '../../shared/merge-refs';
import { ScrollContext, type ScrollGround } from './scroll-context';
import styles from './style/ScrollSection.module.css';

/* =============================================================================
   UNE BANDE PLEINE LARGEUR QUI PEINT TOUJOURS SON PROPRE FOND ET SON ENCRE.

   LE BON COUPLE À TOUTE IMAGE. Le fond et l'encre de la section viennent de
   la feuille, par `data-ground` : ni script, ni transition. Le serveur, une
   page sans script et l'impression montrent la même bande. C'est la scène
   (`ScrollStage`) qui change de fond derrière, jamais la section : un texte
   ambré ne passe donc jamais sur le fond de nuit d'une voisine.

   LES COMPOSANTS IMBRIQUÉS SUIVENT LE FOND. `night` et `blue` posent le thème
   local sombre (`data-opale-page-theme="dark"`), `amber` le clair ; `paper`
   ne pose rien et suit la page.

   HORS D'UNE SCÈNE, une section reste une bande statique, sans observateur.
   ========================================================================== */

/** Les balises qu'une section peut rendre. */
export type ScrollSectionElement = 'section' | 'div' | 'header' | 'footer' | 'article';

export interface ScrollSectionProps extends ComponentPropsWithRef<'section'> {
  /**
   * Le fond peint, avec son encre : `paper` (la surface et l'encre du thème),
   * `amber`, `night` ou `blue`. Les couples sont les jetons
   * `--opale-ground-<nom>` et `--opale-ground-<nom>-ink`, tous à 4,5:1 au
   * moins.
   */
  ground: ScrollGround;
  /**
   * La balise rendue. Défaut : `section` — qu'un `aria-labelledby` nomme
   * pour en faire une région. `ref` reçoit l'élément effectivement rendu.
   */
  as?: ScrollSectionElement;
}

/* Le thème local des composants imbriqués, par fond. */
const THEME: Partial<Record<ScrollGround, 'light' | 'dark'>> = {
  amber: 'light',
  night: 'dark',
  blue: 'dark',
};

/** Une bande qui peint son fond et son encre, et s'inscrit auprès de sa scène. */
export function ScrollSection({
  ground,
  as = 'section',
  className,
  ref,
  ...rest
}: ScrollSectionProps) {
  const Tag = as as 'section';
  const register = useContext(ScrollContext);
  /* Une ref à nettoyage (React 19) : la section s'inscrit à l'attache et se
     retire au détachement. Un fond neuf la réinscrit. */
  const setRef = useCallback(
    (node: HTMLElement | null) =>
      mergeRefs(ref, (element: HTMLElement | null) =>
        element && register ? register(element, ground) : undefined,
      )(node),
    [ref, register, ground],
  );
  return (
    <Tag
      {...rest}
      ref={setRef}
      data-ground={ground}
      data-opale-page-theme={THEME[ground]}
      className={clsx('opale-scroll-section', styles.section, className)}
    />
  );
}
