/* Les composants de mise en page du catalogue. */

import type { ComponentPropsWithRef, ReactNode } from 'react';
import clsx from 'clsx';

export interface StackProps extends ComponentPropsWithRef<'div'> {
  direction?: 'row' | 'column';
  wrap?: boolean;
}

export function Stack({
  direction = 'column',
  wrap = false,
  className,
  children,
  ...props
}: StackProps) {
  return (
    <div
      className={clsx(
        'opale-stack',
        direction === 'column' && 'opale-stack--column',
        wrap && 'opale-stack--wrap',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface LayoutProps extends ComponentPropsWithRef<'div'> {
  navigation?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Layout({ navigation, children, className, ...rest }: LayoutProps) {
  return (
    <div {...rest} className={clsx('opale-layout', className)}>
      {navigation}
      <main className="opale-layout__content">{children}</main>
    </div>
  );
}

export interface DividerProps extends Omit<ComponentPropsWithRef<'hr'>, 'children'> {
  className?: string;
}

export function Divider({ className, ...rest }: DividerProps) {
  return <hr {...rest} className={clsx('opale-divider', className)} />;
}

export interface BackgroundSurfaceProps extends ComponentPropsWithRef<'div'> {
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
