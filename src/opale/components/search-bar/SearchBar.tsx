import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import clsx from 'clsx';
import { warnDeprecatedProps } from '../../deprecations';
import Glass from '../glass/Glass';
import { resolveLabels } from '../../shared/labels';
import styles from './style/SearchBar.module.scss';

/** Les textes de `SearchBar`. */
export interface SearchBarLabels {
  /**
   * Le nom du repère `search`, quand ni `landmarkLabel` ni `aria-label` ne le
   * donnent. Défaut : « Recherche ».
   */
  landmark: string;
  /** Le nom du champ quand rien d'autre ne le nomme. Défaut : « Rechercher ». */
  field: string;
}

const DEFAULT_SEARCH_BAR_LABELS: SearchBarLabels = {
  landmark: 'Recherche',
  field: 'Rechercher',
};

export type SearchBarProps = Omit<ComponentPropsWithoutRef<'input'>, 'size'> & {
  /** La hauteur du champ. Défaut : `medium`. */
  size?: 'small' | 'medium' | 'large';
  /** L'icône de tête, décorative. Défaut : la loupe Opale. */
  icon?: ReactNode;
  /** L'onde qui naît au clic dans le champ en verre. Défaut : `true`. */
  enableLiquidAnimation?: boolean;
  /** @deprecated Depuis 3.7 — utilisez `enableLiquidAnimation`. */
  enableClickAnimation?: boolean;
  /** Pose le repère `search` autour du champ. Défaut : `true`. */
  landmark?: boolean;
  /**
   * Le nom du repère `search`, utile quand la page en compte plusieurs.
   * Défaut : l'`aria-label` du champ, sinon `labels.landmark`.
   */
  landmarkLabel?: string;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<SearchBarLabels>;
  /**
   * Rend la barre dans le matériau « verre liquide ».
   *
   * PAR DÉFAUT ELLE EST ORIGINALE, et c'est une correction. Ce composant ne
   * savait rendre QUE du verre : posé sur une page claire, il y affichait une
   * encre blanche sur un liseré blanc, et rien ne permettait d'en obtenir la
   * version pleine. Le matériau est une OPTION de chaque composant d'Opale,
   * jamais son seul état.
   */
  liquidGlass?: boolean;
};

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      size = 'medium',
      icon,
      disabled,
      enableLiquidAnimation,
      enableClickAnimation,
      landmark = true,
      landmarkLabel,
      labels: labelsProp,
      liquidGlass = false,
      className,
      ['aria-label']: ariaLabel,
      ...props
    },
    ref,
  ) => {
    warnDeprecatedProps('SearchBar', { enableClickAnimation });
    const labels = resolveLabels(DEFAULT_SEARCH_BAR_LABELS, labelsProp);
    /* LE REPÈRE A UN NOM PAR DÉFAUT (ACC-22). Deux repères `search` sans nom
       sur une page ne se distinguent pas dans la liste des régions. Le nom suit
       d'abord celui du champ quand l'appelant l'a écrit — deux barres nommées
       différemment donnent deux repères distincts —, puis « Recherche ». */
    const landmarkName = landmark ? (landmarkLabel ?? ariaLabel ?? labels.landmark) : undefined;
    /* LE CONTENU EST ÉCRIT UNE FOIS. Les deux matières n'ont pas la même
       enveloppe — le verre en a une, la version pleine n'en a pas besoin —,
       mais l'icône, le champ, son nom et ses classes ne dépendent d'aucune
       des deux. Les séparer est ce qui empêche les deux rendus de diverger. */
    const content = (
      <>
        {icon ?? (
          <svg
            className={clsx('opale-search-bar__icon', styles.icon)}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              cx="10.8"
              cy="10.8"
              r="5.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="m15.2 15.2 4.3 4.3"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        )}
        <input
          ref={ref}
          type="search"
          disabled={disabled}
          {...props}
          /* LE REPLI NE JOUE QUE S'IL N'Y A AUCUN AUTRE NOM. Posé toujours, il
           écrasait une étiquette visible : un appelant qui associait un
           `<label for>` « Filtrer les destinations » obtenait un champ nommé
           « Rechercher », sans un mot en commun avec ce qu'on lit à l'écran
           (WCAG 2.5.3). Un `id` compte aussi, puisqu'un `<label for>` peut
           s'y accrocher depuis l'extérieur du composant. */
          aria-label={
            ariaLabel ?? (props['aria-labelledby'] || props.id ? undefined : labels.field)
          }
          className={clsx(
            'opale-search-bar__input',
            styles.input,
            styles[size],
            disabled && styles.disabled,
            className,
          )}
        />
      </>
    );

    if (!liquidGlass) {
      return (
        <div
          role={landmark ? 'search' : undefined}
          aria-label={landmarkName}
          className={clsx(
            'opale-search-bar__shell',
            'opale-search-bar',
            styles.root,
            styles.searchBar,
            styles.plain,
          )}
        >
          {content}
        </div>
      );
    }

    return (
      <Glass
        role={landmark ? 'search' : undefined}
        aria-label={landmarkName}
        rootClassName={clsx('opale-search-bar__shell', styles.root)}
        rootStyle={{ width: '100%' }}
        enableLiquidAnimation={!disabled && (enableLiquidAnimation ?? enableClickAnimation ?? true)}
        className={clsx('opale-search-bar', styles.searchBar)}
      >
        {content}
      </Glass>
    );
  },
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
