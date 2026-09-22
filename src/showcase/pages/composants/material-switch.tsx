import { useState, type ReactNode } from 'react';

import { Opale } from '../../../magic';

import { MagicStage } from './stage';

/* =============================================================================
   LE COMMUTATEUR DE MATIÈRE, POUR LES PAGES ÉCRITES À LA MAIN.

   POURQUOI IL EXISTE. Les pages du catalogue reçoivent ce commutateur de leur
   gabarit commun ; les six composants à dossier — `SearchBar`, `Topbar`,
   `Sidebar`, `Tabs`, `Modal`, `ToastProvider` — ont chacun leur page, écrite à
   la main, qui n'en avait pas. Ils ne savaient d'ailleurs rendre QUE du verre :
   il n'y avait rien à commuter. Maintenant qu'ils ont les deux matières, leur
   page doit les montrer toutes les deux.

   LA SCÈNE SUIT LA MATIÈRE, et ce n'est pas de la mise en scène : un verre
   RÉFRACTE ce qu'il y a derrière lui. Posé sur une surface claire, il n'a rien
   à réfracter — on voit un rectangle pâle et l'on croit le composant cassé.
   Le paysage n'apparaît donc qu'avec le matériau ; l'état original, lui, se
   montre sur la surface unie du site, qui est son vrai terrain.

   `children` EST UNE FONCTION et non un nœud : c'est ce qui permet à la page
   de passer `liquidGlass` au composant qu'elle démontre, au lieu de se
   contenter d'un décor autour.
   ========================================================================== */
export interface MaterialSwitchProps {
  /** Le nom affiché du composant, pour le libellé du commutateur. */
  readonly name: string;
  /** La scène est-elle haute ? Reprise de `MagicStage`. */
  readonly tall?: boolean;
  readonly children: (liquidGlass: boolean) => ReactNode;
}

export function MaterialSwitch({ name, tall = false, children }: MaterialSwitchProps) {
  const [liquidGlass, setLiquidGlass] = useState(false);

  return (
    <>
      <div className="tc-doc-opale-material-toggle">
        <div className="tc-doc-opale-material-toggle__text">
          <strong>Rendu Liquid Glass</strong>
          <span>Appliquer le matériau uniquement à ce composant.</span>
        </div>
        <Opale.Toggle
          label={`Liquid Glass pour ${name}`}
          checked={liquidGlass}
          onChange={(event) => setLiquidGlass(event.currentTarget.checked)}
        />
      </div>

      {liquidGlass ? (
        <MagicStage tall={tall}>{children(true)}</MagicStage>
      ) : (
        <PlainStage tall={tall}>{children(false)}</PlainStage>
      )}
    </>
  );
}

/* =============================================================================
   LA SCÈNE UNIE, EXPOSÉE À PART.

   `MaterialSwitch` la pose pour la démonstration qu'il commute ; les figures
   VOISINES d'une page — les trois tailles d'une barre, les variantes d'un
   panneau — n'ont pas de commutateur et montrent donc l'état original. Les
   laisser sur le paysage revenait à poser une surface pleine sur une
   photographie, c'est-à-dire à cacher le cliché sans rien montrer du
   composant.

   MÊME API QUE `MagicStage` pour que la bascule d'une figure de l'une à
   l'autre reste une substitution de nom.
   ========================================================================== */
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
