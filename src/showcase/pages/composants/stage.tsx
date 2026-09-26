import type { CSSProperties, ReactNode } from 'react';

/* =============================================================================
   L'IMPORT DE `magic.scss` A ÉTÉ RETIRÉ D'ICI, ET IL FAUT DIRE POURQUOI.

   Ce fichier portait `import '../../../magic/magic.scss';`, posé comme
   correctif : mesuré sur la vitrine construite, la feuille était ABSENTE du
   bundle — pas de Nunito, pas le reste du Preflight, aucune des neuf couleurs
   de thème, et pas même la couche `@tailwind utilities` d'où sortent
   `rounded-full` et `pointer-events-none`. Panne entièrement muette : les
   composants se peignaient quand même, puisque chaque `*.module.scss` arrive
   par l'import de son propre composant.

   La cause a depuis été mesurée et elle n'est pas celle qu'on croyait — ce
   n'est pas la feuille qui est élaguée, c'est le baril `src/magic/index.ts`,
   dont Rollup a le droit de jeter les instructions de premier niveau dès que
   `sideEffects` est un tableau. Le raisonnement complet, avec les sept
   variantes de `sideEffects` essayées, est en tête de `src/main.tsx`, qui porte
   désormais l'import : les instructions du module d'ENTRÉE sont toujours
   conservées.

   `stage.tsx` ÉTAIT UN BON ENDROIT POUR UN CORRECTIF ET UN MAUVAIS ENDROIT
   POUR LA RÈGLE. Il était le seul module que toutes les pages de composants importent
   toutes, donc le seul où l'import ne pouvait pas être oublié en ajoutant une
   page — mais une feuille dont dépend l'application entière n'a rien à faire
   dans une brique de mise en page de la documentation. Vérifié après retrait,
   sur `dist-showcase/` reconstruit : la feuille est bien dans le bundle (voir
   la mesure au pied de ce commentaire dans le rapport de migration).
   ========================================================================== */

/* =============================================================================
   LES BRIQUES PARTAGÉES PAR LES PAGES DE COMPOSANTS COMPOSÉS.

   `pages/api.tsx` sert les trois briques de toute page de composant — `PageBody`,
   `UsageBlock`, `PropsTable`. Ce fichier sert celles qui ne valent que pour les
   huit composants composés de `src/magic/components` : la scène, et ses
   cellules légendées.

   LA SCÈNE EST SOMBRE POUR UNE RAISON QUI A CHANGÉ. Elle l'était parce que ces
   composants imposaient une encre blanche en dur, illisible sur le sol clair de
   la vitrine. Réécrits par Opale, ils n'imposent plus de couleur. Le fond
   sombre reste parce qu'un VERRE POSÉ SUR UN APLAT NE RÉFRACTE RIEN : le
   matériau a besoin de quelque chose derrière lui pour se voir — c'est la même
   raison qui fait poser un paysage derrière les démonstrations de verre du
   catalogue.

   LE PRÉFIXE `Magic` EST GARDÉ, ET IL NE NOMME PLUS RIEN D'EXTÉRIEUR. Il
   nommait la provenance de ces composants, qui venaient d'ailleurs ; ils sont
   désormais écrits par Opale. Ce qui le retient est mécanique : les six classes
   `.tc-doc-magicstage*` de `doc.css`, et surtout le préfixe `opale-magic-` des
   modules CSS, dont dépend le sélecteur du filet anti-mouvement de
   `magic.scss`. Renommer sans y toucher rendrait cette règle inerte en
   silence.

   Aucune classe nouvelle inventée ici : `doc.css` porte `.tc-doc-magicstage*`,
   et tout le reste réemploie le vocabulaire existant de la vitrine.
   ========================================================================== */

/**
 * LE SOL DES SCÈNES, ET LA SEULE COULEUR LITTÉRALE DE CE DOSSIER.
 *
 * Trois arrêts, et ils ne sont pas un goût. Les composants de `src/magic/**`
 * écrivent leur libellé en `#ffffff` EN DUR : le fond doit donc être sombre,
 * sans quoi le composant est illisible — mesuré, blanc sur la plaque de
 * spécimen d'Opale (`--surface`, rgb(235,244,246)) vaut 1,12:1, et blanc sur le
 * sol blanc de la vitrine vaut 1,00:1.
 *
 * LA SCÈNE EST UNE PHOTOGRAPHIE, ET C'EST LE MATÉRIAU QUI L'EXIGE.
 *
 * Elle était un dégradé sombre, choisi pour porter une encre blanche que ces
 * composants imposaient alors en dur. Ils ne l'imposent plus — ils sont écrits
 * par Opale et héritent de leur hôte —, donc cette raison est tombée.
 *
 * LA RAISON QUI RESTE EST PLUS FORTE : un verre posé sur un APLAT ne réfracte
 * rien. Les trois couches du matériau travaillent sur ce qu'il y a derrière —
 * un flou d'arrière-plan, un déplacement par bruit, un filet spéculaire. Sur un
 * dégradé lisse, flouter donne le même dégradé et déformer ne déplace aucun
 * détail : on voyait un rectangle à peine teinté, et l'on pouvait croire le
 * composant cassé alors qu'il fonctionnait.
 *
 * C'EST LA MÊME PHOTOGRAPHIE QUE PARTOUT AILLEURS — celle de la page « Le verre
 * liquide » et celle des démonstrations du catalogue. Une seule image pour tout
 * le site : le lecteur qui compare deux pages compare bien deux composants, et
 * non deux décors.
 *
 * LE VOILE EST UNIFORME ET IL EST MESURÉ — deux corrections d'un coup.
 *
 * Il était un DÉGRADÉ, de 8 % en haut à 22 % en bas. C'était l'exact inverse de
 * ce qu'il fallait : sur ce cliché le ciel est EN HAUT, donc la zone la plus
 * claire recevait le voile le plus faible. Le dégradé assombrissait l'eau, qui
 * n'en avait pas besoin, et épargnait le ciel, qui en avait besoin.
 *
 * L'OPACITÉ VIENT D'UNE MESURE, pas d'un réglage à l'œil. Le cliché a été
 * échantillonné pixel par pixel, voile compris, et le pire ratio du blanc
 * relevé à chaque palier :
 *
 *   voile     scène nue    à travers le verre
 *   22 %      1,65:1       1,60:1     ← l'ancien réglage : blanc illisible
 *   50 %      3,45:1       3,15:1
 *   60 %      4,71:1       4,19:1     ← la scène passe, le verre non
 *   65 %      5,56:1       4,87:1     ← les deux passent AA (4,5:1)
 *
 * 65 % est donc le premier palier où le texte blanc tient PARTOUT, y compris
 * sur le coin de ciel le plus clair, et y compris vu à travers le lavis du
 * verre qui éclaircit encore un peu.
 *
 * ASSOMBRIR NE DÉTRUIT PAS LE MATÉRIAU, et c'est ce qui rend ce réglage
 * possible : la réfraction travaille sur le DÉTAIL — des arêtes, un relief —,
 * pas sur la luminosité. Un paysage de crépuscule réfracte aussi bien qu'un
 * paysage de midi.
 */
export const MAGIC_STAGE_GROUND =
  "linear-gradient(0deg, rgba(7, 28, 43, 0.65), rgba(7, 28, 43, 0.65)), url('/glass-landscape.jpg') center / cover no-repeat";

export interface MagicStageProps {
  /** Empile les enfants au lieu de les aligner — pour un composant pleine largeur. */
  readonly stack?: boolean;
  /** Impose 256 px de hauteur — pour `Sidebar` et `Modal`, qui n'en ont pas. */
  readonly tall?: boolean;
  /** Fond ponctuel d'une démonstration, quand le dégradé ne suffit pas. */
  readonly background?: CSSProperties['background'];
  readonly children: ReactNode;
}

/** La scène sombre sur laquelle un composant vendoré se voit. */
export function MagicStage({ stack = false, tall = false, background, children }: MagicStageProps) {
  const classNames = [
    'tc-doc-magicstage',
    stack ? 'tc-doc-magicstage--stack' : '',
    tall ? 'tc-doc-magicstage--tall' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} style={{ background: background ?? MAGIC_STAGE_GROUND }}>
      {children}
    </div>
  );
}

export interface MagicCellProps {
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
export function MagicCell({ label, children }: MagicCellProps) {
  return (
    <figure className="tc-doc-magicstage__cell">
      {children}
      <figcaption className="tc-doc-magicstage__label">{label}</figcaption>
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
export function MagicGroundNote() {
  return (
    <>
      Fond sombre <strong>obligatoire</strong> : le libellé de ce composant est <code>#ffffff</code>{' '}
      en dur, et sur la plaque claire d’un spécimen d’Opale il tombe à 1,12:1 — il disparaît. La
      scène porte donc son propre dégradé, plancher mesuré 13,22:1.
    </>
  );
}
