import type { Ref } from 'react';
import clsx from 'clsx';

import Glass, { type GlassProps } from '../glass/Glass';

/* =============================================================================
   LE PANNEAU D'UNE SURFACE ANCRÉE, DANS LES DEUX MATIÈRES. Interne : non
   réexporté.

   Même partage que le `Panel` de `Modal` : `Glass` distingue l'ENVELOPPE
   (`rootClassName`, la silhouette et l'ombre) du CONTENU (`className`, le
   remplissage, l'encre et le rôle ARIA). Une boîte pleine pose les deux sur
   le même `<div>`. Le contrat d'accessibilité — rôle, identifiant, noms,
   gestionnaires — est écrit une fois par l'appelant et arrive sur l'élément
   qui porte le contenu, dans les deux matières.
   ========================================================================== */

export type FloatingSurfaceProps = Omit<
  GlassProps<'div'>,
  'as' | 'triggerAnimation' | 'enableLiquidAnimation' | 'pressFeedback'
> & {
  readonly liquidGlass: boolean;
  readonly ref?: Ref<HTMLDivElement>;
};

export function FloatingSurface({
  liquidGlass,
  ref,
  rootClassName,
  rootStyle,
  className,
  style,
  children,
  ...rest
}: FloatingSurfaceProps) {
  if (liquidGlass) {
    return (
      <Glass
        {...rest}
        ref={ref}
        rootClassName={rootClassName}
        rootStyle={rootStyle}
        className={className}
        style={style}
      >
        {children}
      </Glass>
    );
  }

  return (
    <div
      {...rest}
      ref={ref}
      className={clsx(rootClassName, className)}
      style={rootStyle ? { ...rootStyle, ...style } : style}
    >
      {children}
    </div>
  );
}
