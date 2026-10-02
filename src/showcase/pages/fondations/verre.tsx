import type { CSSProperties, ReactNode } from 'react';

import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody } from '../api';

/* Les jetons du matériau (`--glass-*`), déclarés dans `src/tokens/materials.css`,
   publiés par `tokens.css` et mesurés par `glass.contract.test.ts`. Aucune
   feuille publiée ne les applique : la page documente un matériau disponible,
   et son seul spécimen visuel, recomposé en `var(--glass-*)`, est étiqueté
   comme tel. */

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

/* La scène de démonstration, en style en ligne et en `var()` seulement, comme
   l'écrirait un consommateur. Le fond rayé donne au flou une arête à flouter. */
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

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `verre.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function VerreContent() {
  return (
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
            <code>src/opale/**</code>, ni dans <code>doc.css</code>. La bascule « Verre liquide » de
            la barre du haut a donc été retirée de cette vitrine — un bouton qui annonce un état
            sans rien changer est un défaut d’accessibilité, pas une commodité.
          </li>
          <li>
            <strong>Les sept composants repeints par le thème ne sont plus publiés.</strong>{' '}
            <code>Button</code>, <code>Field</code>, <code>IconTile</code>, <code>Input</code>,{' '}
            <code>Message</code>, <code>Pill</code> et <code>Tag</code> sont supprimés avec le reste
            de la 0.4.
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
        Le verre des composants publiés n’a <strong>rien à voir</strong> avec celui-ci : il est
        écrit dans <code>src/opale/**</code>, n’emploie aucun de ces jetons, et n’est couvert par
        aucun contrat — voir{' '}
        <a className="tc-doc-link" href={hrefFor('verre-liquide')}>
          Le verre liquide
        </a>
        . Deux matériaux du même nom, mesuré pour l’un, pas pour l’autre.
      </p>
    </PageBody>
  );
}
