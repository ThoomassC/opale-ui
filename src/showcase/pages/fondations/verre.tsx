import type { CSSProperties, ReactNode } from 'react';

import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody } from '../api';

/* =============================================================================
   CETTE PAGE A ÉTÉ RÉDUITE, PAS SUPPRIMÉE, ET LA DISTINCTION EST LE SUJET.

   Elle documentait DEUX choses que la 2.0 sépare :

   1. LE THÈME « verre liquide » d'Opale — un porteur `data-material="glass"`
      sur `<html>`, la feuille `src/styles/glass.css` qui le lit, et sept
      composants repeints par elle (`Button`, `Field`, `IconTile`, `Input`,
      `Message`, `Pill`, `Tag`). Tout cela est supprimé : la feuille n'existe
      plus, les composants non plus, et le porteur n'a plus AUCUN consommateur —
      vérifié, `data-material` n'apparaît nulle part dans `src/tokens/**`, dans
      `src/magic/**` ni dans `doc.css`. La bascule « Verre liquide » de la barre
      du haut a donc été retirée avec le reste : un bouton `aria-pressed` qui
      n'allume rien est un défaut, pas une commodité.

   2. LES JETONS DU MATÉRIAU — `--glass-fill`, `--glass-blur`, `--glass-border`,
      `--glass-specular`… Ceux-là SURVIVENT : ils sont déclarés dans
      `src/tokens/materials.css`, que `tokens.css` importe, donc ils sont
      toujours publiés par `@thomascaron/opale-ui/tokens.css`. Et ils sont toujours
      MESURÉS : `src/contract/glass.contract.test.ts` lit `materials.css` et
      recalcule ses onze sections à chaque exécution de la suite.

   D'OÙ LE RENVERSEMENT DE CETTE PAGE. Elle montrait un matériau appliqué ; elle
   documente désormais un matériau DISPONIBLE MAIS PLUS APPLIQUÉ. C'est une
   nuance qu'un lecteur ne peut pas deviner d'une liste de jetons, et c'est
   pourquoi le premier spécimen la dit avant tout le reste.

   LE SEUL SPÉCIMEN VISUEL EST RECONSTRUIT À LA MAIN, et il est étiqueté comme
   tel. Aucune feuille publiée ne compose plus ces jetons : les peindre ici
   demande de réécrire en style en ligne ce que `glass.css` faisait, ce qui est
   légitime pour une démonstration mais ne doit pas se lire comme une API. Les
   valeurs employées sont toutes des `var(--glass-*)` — aucune couleur
   littérale, la règle de `doc.css` vaut aussi pour ce qui est écrit en ligne.
   ========================================================================== */

interface MaterialToken {
  readonly token: string;
  /** La valeur telle qu'elle est déclarée dans `materials.css`. */
  readonly value: string;
  /** Ce que le jeton porte, et ce qui a été mesuré dessus. */
  readonly role: ReactNode;
}

/* Les valeurs sont RECOPIÉES de `src/tokens/materials.css` et non devinées ;
   les chiffres de mesure viennent des commentaires de cette même feuille et des
   sections de `glass.contract.test.ts` qui les rejouent. */
const TOKENS: readonly MaterialToken[] = [
  {
    token: '--glass-fill',
    value: 'var(--tc-white-a40)',
    role: (
      <>
        Le remplissage : un blanc translucide à alpha 0,40. Mesuré, il lève la carte de{' '}
        <strong>1,078:1</strong> contre le sol, quand le blanc pur ne monte qu’à 1,200:1 — il n’y a
        donc plus rien à acheter en blanchissant. La § 2 du contrat rejoue ce plafond.
      </>
    ),
  },
  {
    token: '--glass-fill-solid',
    value: 'var(--surface)',
    role: (
      <>
        Le repli <strong>opaque</strong>, servi quand <code>backdrop-filter</code> manque ou quand
        la transparence réduite est demandée. C’est exactement <code>--surface</code> : un second
        littéral promettrait une différence qui n’existe pas.
      </>
    ),
  },
  {
    token: '--glass-blur',
    value: '32px',
    role: <>Le flou des grandes surfaces. Non thémé — un flou n’a pas de thème.</>,
  },
  {
    token: '--glass-blur-control',
    value: '12px',
    role: (
      <>
        Le flou des <strong>contrôles</strong>, plus petit parce qu’ils le sont. À 32 px sur un
        contrôle de 44 px il ne reste que <strong>0,8 %</strong> de la modulation du fond — mesuré
        au navigateur sur six rayons : le verre ne montre plus rien de ce qui passe derrière lui. À
        12 px il en garde vingt fois plus.
      </>
    ),
  },
  {
    token: '--glass-saturate',
    value: '1.6',
    role: <>La saturation du filtre d’arrière-plan, appliquée avec le flou.</>,
  },
  {
    token: '--glass-border',
    value: 'var(--tc-shade-a25)',
    role: (
      <>
        Le liseré, et c’est une encre — <strong>jamais un blanc</strong>. Un filet blanc ne peut pas
        dessiner de bord sur un remplissage quasi blanc : il plafonne à ΔE OKLab 4,0, même à alpha
        1,0. Celui-ci mesure <strong>ΔE 16,7</strong> contre le sol nu, et la § 8 du contrat exige
        qu’il reste perceptible.
      </>
    ),
  },
  {
    token: '--glass-edge-width',
    value: '3px',
    role: (
      <>
        Le <strong>ménisque</strong> : la bande de bord filtre son arrière-plan autrement que le
        centre. C’est ce qui distingue ce verre d’un simple fond flouté. Trois jetons l’accompagnent
        — <code>--glass-edge-blur</code> (2px), <code>--glass-edge-saturate</code> (2.4),{' '}
        <code>--glass-edge-brightness</code> (1.08).
      </>
    ),
  },
  {
    token: '--glass-rim-width',
    value: '1.5px',
    role: <>L’épaisseur de l’anneau spéculaire, distincte de celle du ménisque.</>,
  },
  {
    token: '--glass-specular',
    value: 'linear-gradient(142deg, …)',
    role: (
      <>
        Le liseré <strong>directionnel</strong> : allumé en haut-gauche, éteint en bas-droite,
        rappel au coin opposé. Sept arrêts de blanc, et <strong>aucun arrêt sombre</strong> — sur un
        anneau de 1,5 px il se lirait comme un trait en travers de la carte.
      </>
    ),
  },
  {
    token: '--glass-highlight',
    value: 'radial-gradient(…), radial-gradient(…)',
    role: (
      <>Les deux halos de la surface. La § 3 du contrat vérifie qu’ils DÉGRADENT le contraste.</>
    ),
  },
  {
    token: '--glass-shadow',
    value: 'var(--shadow-ink)',
    role: (
      <>
        L’ombre portée, et c’est un <strong>alias</strong> : une carte de verre et une carte opaque
        projettent la même ombre. La polarité s’inverse entre les thèmes — ΔE 20,6 contre le sol
        clair, 2,2 seulement contre le sol sombre, où c’est le liseré qui détache (ΔE 18,5).
      </>
    ),
  },
];

const TOKENS_TITLE_ID = 'verre-jetons-title';

/* LA SCÈNE DE DÉMONSTRATION, ÉCRITE EN STYLE EN LIGNE ET ASSUMÉE COMME TELLE.
   `doc.css` s'interdit toute couleur littérale et ne porte plus de règle de
   verre ; ces trois objets composent les jetons comme le ferait un
   consommateur, en `var()` uniquement. Le motif du fond est fait de deux rôles
   de la charte pour que le flou ait quelque chose à flouter — sans arête
   derrière lui, un `backdrop-filter` ne se voit pas. */
const GROUND: CSSProperties = {
  background: 'repeating-linear-gradient(115deg, var(--accent) 0 18px, var(--surface) 18px 36px)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  display: 'flex',
  justifyContent: 'center',
};

const PANE: CSSProperties = {
  background: 'var(--glass-fill)',
  backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
  border: 'var(--glass-rim-width) solid var(--glass-border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--glass-shadow)',
  padding: 'var(--space-5) var(--space-6)',
  color: 'var(--text-strong)',
  maxInlineSize: '28ch',
};

export const verrePage: DocPage = {
  slug: 'verre',
  label: 'Verre',
  group: 'fondations',
  title: 'Verre',
  lede: (
    <>
      Onze jetons de matériau — remplissage, flou, ménisque, liseré, spéculaire, ombre — toujours
      publiés et toujours mesurés par le contrat. <strong>Plus rien ne les applique</strong> : la
      feuille et les composants qui les consommaient ne sont pas dans la 2.0.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen
        title="Ce qui reste, et ce qui est parti"
        note={
          <>
            Cette page documentait un thème appliqué ; elle documente désormais un matériau{' '}
            <strong>disponible</strong>.
          </>
        }
      >
        <ul className="tc-doc-checklist">
          <li>
            <strong>Les onze jetons restent publiés.</strong> Ils sont déclarés dans{' '}
            <code>src/tokens/materials.css</code>, que <code>tokens.css</code> importe : un
            consommateur de <code>@thomascaron/opale-ui/tokens.css</code> les a tous.
          </li>
          <li>
            <strong>Ils restent mesurés.</strong> <code>glass.contract.test.ts</code> lit cette
            feuille et recalcule onze sections à chaque exécution de la suite — le plafond du
            remplissage, la perceptibilité du liseré, le fait que les halos dégradent le contraste
            au lieu de le fournir. Un chiffre faux fait échouer le build.
          </li>
          <li>
            <strong>La feuille qui les composait est supprimée.</strong> <code>glass.css</code>{' '}
            n’est plus publiée, et le point d’entrée <code>@thomascaron/opale-ui/glass.css</code>{' '}
            n’existe plus dans <code>exports</code>. Composer ces jetons est désormais le travail de
            l’appelant.
          </li>
          <li>
            <strong>
              Le porteur <code>data-material=&quot;glass&quot;</code> n’a plus aucun lecteur.
            </strong>{' '}
            Vérifié : l’attribut n’apparaît ni dans <code>src/tokens/**</code>, ni dans{' '}
            <code>src/magic/**</code>, ni dans <code>doc.css</code>. La bascule « Verre liquide » de
            la barre du haut a donc été retirée de cette vitrine — un bouton qui annonce un état
            sans rien changer est un défaut d’accessibilité, pas une commodité.
          </li>
          <li>
            <strong>Les sept composants repeints par le thème ne sont plus publiés.</strong>{' '}
            <code>Button</code>, <code>Field</code>, <code>IconTile</code>, <code>Input</code>,{' '}
            <code>Message</code>, <code>Pill</code> et <code>Tag</code> sont supprimés avec le reste
            de la 1.0.
          </li>
        </ul>
      </Specimen>

      <Specimen
        title="Ce que les jetons composent"
        note={
          <>
            <strong>Reconstruit à la main pour cette page</strong>, en style en ligne : aucune
            feuille publiée ne fait plus cela. Le fond rayé n’est pas décoratif — sans arête
            derrière lui, un <code>backdrop-filter</code> ne se voit pas.
          </>
        }
      >
        <div style={GROUND}>
          <div style={PANE}>
            <p className="tc-doc-cardtext">
              Remplissage, flou, saturation, liseré d’encre et ombre portée — cinq jetons, aucune
              couleur littérale.
            </p>
          </div>
        </div>
      </Specimen>

      <div>
        <h2 className="tc-doc-specimen__title" id={TOKENS_TITLE_ID}>
          Les onze jetons
        </h2>
        <p className="tc-doc-specimen__note">
          Valeurs recopiées de <code>src/tokens/materials.css</code>. Les filtres et la géométrie ne
          sont <strong>pas thémés</strong> ; le remplissage, le liseré et l’ombre le sont.
        </p>
        {/* Même recette que les autres tableaux de la vitrine : un conteneur à
            défilement horizontal doit être atteignable au clavier (WCAG 2.1.1),
            et la liste blanche par défaut de la règle `jsx-a11y` ne modélise
            pas ce cas. */}
        <div
          className="tc-doc-tablewrap"
          tabIndex={0}
          role="group"
          aria-label="Tableau, défilement horizontal"
        >
          <table className="tc-doc-table" aria-labelledby={TOKENS_TITLE_ID}>
            <thead>
              <tr>
                <th scope="col">Jeton</th>
                <th scope="col">Valeur</th>
                <th scope="col">Rôle, et ce qui est mesuré</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map((entry) => (
                <tr key={entry.token}>
                  <th scope="row">
                    <code>{entry.token}</code>
                  </th>
                  <td>
                    <code>{entry.value}</code>
                  </td>
                  <td>{entry.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="tc-doc-prose tc-doc-aside">
        Le verre des quatorze composants publiés n’a <strong>rien à voir</strong> avec celui-ci : il
        est écrit dans <code>src/magic/**</code>, n’emploie aucun de ces jetons, et n’est couvert
        par aucun contrat — voir{' '}
        <a className="tc-doc-link" href={hrefFor('composants/glass')}>
          Glass
        </a>
        . Deux matériaux du même nom, mesuré pour l’un, pas pour l’autre.
      </p>
    </PageBody>
  ),
};
