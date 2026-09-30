/* Les composants de mise en page du catalogue. */

import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';

/** Un pas de l'échelle d'espacement (`--opale-space-*`), ou aucun espace. */
export type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** L'alignement des enfants sur l'axe secondaire de la pile. */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

/** La répartition des enfants sur l'axe principal de la pile. */
export type StackJustify = 'start' | 'center' | 'end' | 'between';

/** Les balises qu'une pile peut rendre. */
export type StackElement = 'div' | 'section' | 'ul' | 'ol' | 'nav';

export interface StackProps extends ComponentPropsWithRef<'div'> {
  /** L'axe de la pile. Défaut : `column`. */
  direction?: 'row' | 'column';
  /** Autorise le retour à la ligne des enfants. Défaut : `false`. */
  wrap?: boolean;
  /**
   * L'espace entre les enfants, sur l'échelle `--opale-space-*`. Absent, la
   * pile garde son espacement de toujours (`md`), sans classe de plus.
   */
  gap?: StackGap;
  /** L'alignement sur l'axe secondaire. Absent : celui de flexbox (`stretch`). */
  align?: StackAlign;
  /** La répartition sur l'axe principal. Absente : `start`. */
  justify?: StackJustify;
  /**
   * La balise rendue. Défaut : `div`. `ul` et `ol` perdent puces et retrait :
   * les enfants doivent être des `<li>`. `ref` reste typée `HTMLDivElement`
   * pour ne casser aucun appel existant ; avec `as`, elle reçoit l'élément
   * effectivement rendu.
   */
  as?: StackElement;
}

export function Stack({
  direction = 'column',
  wrap = false,
  gap,
  align,
  justify,
  as = 'div',
  className,
  children,
  ...props
}: StackProps) {
  /* UNE SEULE SIGNATURE DE TYPE POUR CINQ BALISES : les attributs d'un `<div>`
     valent pour les cinq, et la `ref` les suit à l'exécution. */
  const Tag = as as 'div';
  return (
    <Tag
      className={clsx(
        'opale-stack',
        direction === 'column' && 'opale-stack--column',
        wrap && 'opale-stack--wrap',
        gap && `opale-stack--gap-${gap}`,
        align && `opale-stack--align-${align}`,
        justify && `opale-stack--justify-${justify}`,
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export interface GridProps extends ComponentPropsWithRef<'div'> {
  /**
   * Les colonnes. Un NOMBRE fixe autant de colonnes égales, qui rétrécissent
   * sans déborder. Une LONGUEUR CSS (`'12rem'`, `'240px'`) est la largeur
   * minimale d'une piste : la grille en place autant que la largeur le permet,
   * et passe à une colonne sous cette largeur. Absent : pistes de 15 rem,
   * comme `CardGrid`.
   */
  columns?: number | string;
  /** L'espace entre les cellules, sur l'échelle `--opale-space-*`. Défaut : `md`. */
  gap?: StackGap;
}

/** La piste CSS de `columns`, ou `undefined` pour garder celle de la feuille. */
function gridTrack(columns: number | string | undefined): string | undefined {
  if (typeof columns === 'number') {
    return Number.isInteger(columns) && columns > 0
      ? `repeat(${columns}, minmax(0, 1fr))`
      : undefined;
  }
  const width = columns?.trim();
  return width ? `repeat(auto-fit, minmax(min(${width}, 100%), 1fr))` : undefined;
}

/** La grille générique : des colonnes égales, ou autant de pistes que la largeur en permet. */
export function Grid({ columns, gap, className, style, children, ...props }: GridProps) {
  const track = gridTrack(columns);
  return (
    <div
      {...props}
      className={clsx('opale-grid', gap && `opale-grid--gap-${gap}`, className)}
      /* Le `style` de l'appelant d'abord, la piste ensuite : c'est elle que
         `columns` décrit. */
      style={track ? ({ ...style, '--opale-grid-columns': track } as CSSProperties) : style}
    >
      {children}
    </div>
  );
}

export interface LayoutProps extends ComponentPropsWithRef<'div'> {
  /** La navigation rendue avant la zone de contenu, une `Sidebar` le plus souvent. */
  navigation?: ReactNode;
  /** Le contenu de la page, rendu dans la zone `mainAs`. */
  children?: ReactNode;
  /** Une classe ajoutée à côté de `.opale-layout`. */
  className?: string;
  /**
   * La balise de la zone de contenu. Défaut : `main`. Passez `div` quand la
   * page a déjà son `<main>` — une application hôte, un `PageScaffold` —,
   * comme la prop du même nom de `PageScaffold`.
   */
  mainAs?: 'main' | 'div';
}

export function Layout({
  navigation,
  children,
  className,
  mainAs: Main = 'main',
  ...rest
}: LayoutProps) {
  /* UN SEUL <main> PAR PAGE (ACC-17). Layout imposait le sien : posé dans une
     application qui en avait déjà un, il en créait un second, imbriqué — deux
     repères « principal » que rien ne distingue. La classe reste la même dans
     les deux cas. */
  return (
    <div {...rest} className={clsx('opale-layout', className)}>
      {navigation}
      <Main className="opale-layout__content">{children}</Main>
    </div>
  );
}

export interface DividerProps extends Omit<ComponentPropsWithRef<'hr'>, 'children'> {
  /** Une classe ajoutée à côté de `.opale-divider`. */
  className?: string;
}

export function Divider({ className, ...rest }: DividerProps) {
  return <hr {...rest} className={clsx('opale-divider', className)} />;
}

export interface BackgroundSurfaceProps extends ComponentPropsWithRef<'div'> {
  /** Ajoute la forme organique décorative au fond. Défaut : `false`. */
  shape?: boolean;
}

/**
 * Le fond décoratif du catalogue.
 *
 * `shape` REMPLACE L'ANCIEN `ShapeBackground`, qui était ce composant plus un
 * `::after`. Les deux classes déclaraient la même boîte — mêmes `position`,
 * `overflow` et `background` — et PARTAGEAIENT déjà le même `::before` dans un
 * sélecteur groupé : seule la forme organique les distinguait. Deux composants
 * pour un pseudo-élément, c'était un de trop.
 */
export function BackgroundSurface({
  shape = false,
  children,
  className,
  ...props
}: BackgroundSurfaceProps) {
  return (
    <div
      className={clsx(
        'opale-opaley-background',
        shape && 'opale-opaley-background--shape',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
