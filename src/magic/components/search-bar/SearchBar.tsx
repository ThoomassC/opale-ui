import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import clsx from 'clsx';
import Glass from '../glass/Glass';
import styles from './style/SearchBar.module.scss';

export type SearchBarProps = Omit<ComponentPropsWithoutRef<'input'>, 'size'> & {
  size?: 'small' | 'medium' | 'large';
  icon?: ReactNode;
  enableClickAnimation?: boolean;
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
      enableClickAnimation = true,
      liquidGlass = false,
      className,
      ['aria-label']: ariaLabel,
      ...props
    },
    ref,
  ) => {
    /* LE CONTENU EST ÉCRIT UNE FOIS. Les deux matières n'ont pas la même
       enveloppe — le verre en a une, la version pleine n'en a pas besoin —,
       mais l'icône, le champ, son nom et ses classes ne dépendent d'aucune
       des deux. Les séparer est ce qui empêche les deux rendus de diverger. */
    const contenu = (
      <>
        {icon ?? (
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
            ariaLabel ?? (props['aria-labelledby'] || props.id ? undefined : 'Rechercher')
          }
          className={clsx(styles.input, styles[size], disabled && styles.disabled, className)}
        />
      </>
    );

    if (!liquidGlass) {
      return (
        <div role="search" className={clsx(styles.root, styles.searchBar, styles.plain)}>
          {contenu}
        </div>
      );
    }

    return (
      <Glass
        role="search"
        rootClassName={styles.root}
        rootStyle={{ width: '100%' }}
        enableLiquidAnimation={!disabled && enableClickAnimation}
        className={styles.searchBar}
      >
        {contenu}
      </Glass>
    );
  },
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
