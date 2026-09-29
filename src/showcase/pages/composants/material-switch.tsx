import { useState, type ReactNode } from 'react';

import { Opale } from '../../../opale';

import { Stage } from './stage';

/* Le commutateur de matériau des pages de composant : original ou verre
   liquide. Avec le verre, la démonstration passe sur la scène photographiée
   — un verre ne se voit qu'en réfractant quelque chose ; sans lui, elle reste
   sur la surface unie du site. `children` est une fonction, pour que la page
   transmette `liquidGlass` au composant démontré. */
export interface MaterialToggleProps {
  /** Le nom affiché du composant, pour le libellé du commutateur. */
  readonly name: string;
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
}

/** L'interrupteur seul, partagé avec le gabarit du catalogue. */
export function MaterialToggle({ name, checked, onCheckedChange }: MaterialToggleProps) {
  return (
    <div className="tc-doc-opale-material-toggle">
      <div className="tc-doc-opale-material-toggle__text">
        <strong>Rendu verre liquide</strong>
        <span>Appliquer le matériau uniquement à ce composant.</span>
      </div>
      <Opale.Toggle
        label={`Verre liquide pour ${name}`}
        checked={checked}
        onChange={(event) => onCheckedChange(event.currentTarget.checked)}
      />
    </div>
  );
}

export interface MaterialSwitchProps {
  /** Le nom affiché du composant, pour le libellé du commutateur. */
  readonly name: string;
  /** La scène est-elle haute ? Reprise de `Stage`. */
  readonly tall?: boolean;
  /** La scène empile-t-elle ses figures en colonne ? Reprise de `Stage`. */
  readonly stack?: boolean;
  readonly children: (liquidGlass: boolean) => ReactNode;
}

export function MaterialSwitch({
  name,
  tall = false,
  stack = false,
  children,
}: MaterialSwitchProps) {
  const [liquidGlass, setLiquidGlass] = useState(false);

  return (
    <>
      <MaterialToggle name={name} checked={liquidGlass} onCheckedChange={setLiquidGlass} />

      {liquidGlass ? (
        <Stage tall={tall} stack={stack}>
          {children(true)}
        </Stage>
      ) : (
        <PlainStage tall={tall} stack={stack}>
          {children(false)}
        </PlainStage>
      )}
    </>
  );
}

/* La scène unie : l'état original, sur la surface du site. Même API que
   `Stage`, pour que passer de l'une à l'autre reste une substitution de nom. */
export function PlainStage({
  stack = false,
  tall = false,
  children,
}: {
  readonly stack?: boolean;
  readonly tall?: boolean;
  readonly children: ReactNode;
}) {
  const classes = [
    'tc-doc-opale-plainstage',
    stack ? 'tc-doc-opale-plainstage--stack' : '',
    tall ? 'tc-doc-opale-plainstage--tall' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}
