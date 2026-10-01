import type { ComponentPropsWithRef } from 'react';
import clsx from 'clsx';

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

   AUCUNE INSCRIPTION. La scène retrouve ses sections dans son propre DOM, à
   chaque mesure, et y lit `data-ground` : ni contexte, ni ref interne. La
   `ref` de l'appelant va droit à l'élément — une ref en ligne ne réinscrit
   rien —, et un fond neuf est suivi sans remontage. Hors d'une scène, une
   section reste une bande statique.
   ========================================================================== */

/** Les fonds qu'une `ScrollSection` peut peindre, chacun avec son encre. */
export type ScrollGround = 'paper' | 'amber' | 'night' | 'blue';

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

/** Une bande qui peint son fond et son encre ; sa scène la retrouve seule. */
export function ScrollSection({ ground, as = 'section', className, ...rest }: ScrollSectionProps) {
  const Tag = as as 'section';
  return (
    <Tag
      {...rest}
      data-ground={ground}
      data-opale-page-theme={THEME[ground]}
      className={clsx('opale-scroll-section', styles.section, className)}
    />
  );
}
