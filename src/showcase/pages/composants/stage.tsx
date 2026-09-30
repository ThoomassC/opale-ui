import type { CSSProperties, ReactNode } from 'react';

/* Les briques propres aux pages des composants composés : la scène et ses
   cellules légendées (`pages/api.tsx` sert les briques communes).
   `motion.scss` s'importe dans `src/main.tsx`, module d'entrée, et non ici.
   Le préfixe `opale-mod-` des modules CSS est un contrat : le filet
   anti-mouvement de `motion.scss` le vise. `doc.css` porte `.tc-doc-stage*`. */

/**
 * Le sol des scènes, seule couleur littérale de ce dossier : la photographie
 * commune au site, parce qu'un verre posé sur un aplat ne réfracte rien.
 * Le voile uniforme de 65 % est le premier palier mesuré où le texte blanc
 * tient 4,5:1 partout, y compris à travers le verre.
 */
export const STAGE_GROUND =
  "linear-gradient(0deg, rgba(7, 28, 43, 0.65), rgba(7, 28, 43, 0.65)), url('/glass-landscape.jpg') center / cover no-repeat";

export interface StageProps {
  /** Empile les enfants au lieu de les aligner — pour un composant pleine largeur. */
  readonly stack?: boolean;
  /** Impose 256 px de hauteur — pour `Sidebar` et `Modal`, qui n'en ont pas. */
  readonly tall?: boolean;
  /** Fond ponctuel d'une démonstration, quand le dégradé ne suffit pas. */
  readonly background?: CSSProperties['background'];
  readonly children: ReactNode;
}

/** La scène sombre sur laquelle un ancien composant en verre se voit. */
export function Stage({ stack = false, tall = false, background, children }: StageProps) {
  const classNames = [
    'tc-doc-stage',
    stack ? 'tc-doc-stage--stack' : '',
    tall ? 'tc-doc-stage--tall' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} style={{ background: background ?? STAGE_GROUND }}>
      {children}
    </div>
  );
}

export interface StageCellProps {
  /** La légende — ce que la figure MONTRE, pas le libellé du composant. */
  readonly label: ReactNode;
  readonly children: ReactNode;
}

/**
 * Une figure légendée dans une scène.
 *
 * `<figure>` / `<figcaption>` et non un `<span>` frère, pour la raison écrite
 * sur la page de `Button` d'Opale : cinq contrôles au libellé identique sont
 * indiscernables dans une liste, et un texte posé à côté n'est relié à rien.
 */
export function StageCell({ label, children }: StageCellProps) {
  return (
    <figure className="tc-doc-stage__cell">
      {children}
      <figcaption className="tc-doc-stage__label">{label}</figcaption>
    </figure>
  );
}

/**
 * La note du spécimen : POURQUOI la scène est sombre.
 *
 * Rendue par `Specimen note=…`, donc dans un `<p>` juste au-dessus de la scène
 * — la contrainte est écrite à côté de ce qu'elle contraint, et non reléguée en
 * bas de page. Elle tient dans une phrase parce qu'elle est répétée quatorze
 * fois ; la page « Installation » porte seule la commande d'installation.
 */
export function StageGroundNote() {
  return (
    <>
      Fond sombre <strong>obligatoire</strong> : le libellé de ce composant est <code>#ffffff</code>{' '}
      en dur, et sur la plaque claire d’un spécimen d’Opale il tombe à 1,12:1 — il disparaît. La
      scène porte donc son propre dégradé, plancher mesuré 13,22:1.
    </>
  );
}
