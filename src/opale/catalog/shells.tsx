/* Les coquilles partagées du catalogue : champ, surface et message d'erreur. */

import type { ComponentPropsWithRef, ReactNode } from 'react';
import clsx from 'clsx';

import Glass from '../components/glass/Glass';

/**
 * La coquille d'un champ : du verre quand on le demande, un simple `<span>`
 * sinon.
 *
 * Les cinq champs à état — saisie, sélection, curseur, case, interrupteur —
 * ont exactement le même besoin : remplacer LA BOÎTE par du verre sans toucher
 * à ce qu'elle contient. L'écrire cinq fois aurait fait diverger cinq copies à
 * la première correction ; c'est d'ailleurs ce qui était en train d'arriver.
 *
 * LE CONTENU EST IDENTIQUE DANS LES DEUX BRANCHES, et c'est la propriété qui
 * compte : le contrôle natif, son `id`, son `name`, son `ref` et son
 * `ChangeEvent` ne dépendent pas de la matière choisie.
 */
export function FieldShell({
  liquidGlass,
  className,
  rootClassName,
  pressFeedback,
  children,
}: {
  liquidGlass: boolean;
  className?: string;
  rootClassName?: string;
  /**
   * Le rebond d'appui. `Glass` le déduit de la balise rendue, et cette
   * coquille est toujours un `<span>` : la déduction dit donc « surface » pour
   * la case à cocher comme pour le champ de saisie. C'est juste pour le champ
   * — on ne presse pas un champ, on y écrit — et faux pour la case, qu'on
   * presse bel et bien. D'où ce réglage, posé au cas par cas.
   */
  pressFeedback?: boolean;
  children: ReactNode;
}) {
  if (!liquidGlass) return <span className={className}>{children}</span>;

  return (
    <Glass
      as="span"
      className={className}
      rootClassName={rootClassName}
      pressFeedback={pressFeedback}
    >
      {children}
    </Glass>
  );
}

export interface SurfaceProps extends ComponentPropsWithRef<'div'> {
  liquidGlass?: boolean;
}

/* LA SURFACE PARTAGÉE REND LE VRAI VERRE, ELLE AUSSI.

   Elle posait `opale-liquid` : un lavis CSS — deux dégradés radiaux et un flou
   d'arrière-plan — qui IMITAIT le matériau. L'imitation se voyait dès qu'on
   comparait : la carte affichait du vrai verre sous le commutateur pendant que
   `StatCard`, bâtie sur cette même surface, gardait le lavis. Deux rendus du
   même « verre liquide » sur la même page.

   Le matériau étant désormais le nôtre, il n'y a plus de raison de l'imiter. */
export function Surface({ liquidGlass = false, className, children, ...props }: SurfaceProps) {
  const classes = clsx('opale-surface', liquidGlass && 'opale-surface--glass', className);

  if (liquidGlass) {
    return (
      <Glass className={classes} rootClassName="opale-surface--glass-root" {...props}>
        {children}
      </Glass>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

/** Le message d'erreur d'un contrôle en rangée, hors de son `<label>`. */
export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} role="alert" className="opale-field__helper opale-field__helper--error">
      {children}
    </span>
  );
}
