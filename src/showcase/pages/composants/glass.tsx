import { Glass } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MagicCell, MagicGroundNote, MagicPreamble, MagicStage } from './stage';

const USAGE = `import { Glass } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

<Glass>Un panneau de verre</Glass>

// Polymorphe : \`as\` change l'élément du CONTENU, jamais l'enveloppe.
<Glass as="button" type="button" enableLiquidAnimation onClick={send}>
  Envoyer
</Glass>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'as',
    type: 'ElementType',
    defaultValue: "'div'",
    description: (
      <>
        L’élément du <strong>contenu</strong>. Les quatre couches de verre et l’enveloppe restent
        des <code>&lt;div&gt;</code> quoi qu’il arrive : <code>as=&quot;span&quot;</code> ne rend
        donc pas un composant en ligne, et un <code>Glass</code> ne peut pas vivre dans un{' '}
        <code>&lt;p&gt;</code>.
      </>
    ),
  },
  {
    name: 'rootClassName',
    type: 'string',
    description: (
      <>
        Fusionné sur l’<strong>enveloppe</strong>, après sa classe interne. Attention :{' '}
        <strong>toute propriété que l’enveloppe se donne déjà gagne</strong> — même spécificité
        (0,1,0), et sa règle passe plus tard dans la feuille. C’est ce qui rend{' '}
        <code>rounded-full</code> inerte, mesuré plus bas.
      </>
    ),
  },
  {
    name: 'rootStyle',
    type: 'CSSProperties',
    description: (
      <>
        Style en ligne sur l’enveloppe, donc <strong>au-dessus de toute la cascade</strong>. C’est
        la seule voie fiable pour changer le rayon de l’enveloppe, et c’est exactement ce que fait
        leur <code>Switch</code> — <code>rootStyle={'{{ borderRadius: ’999px’ }}'}</code>.
      </>
    ),
  },
  {
    name: 'enableLiquidAnimation',
    type: 'boolean',
    defaultValue: 'false',
    description: (
      <>
        Arme l’ondulation au clic : la position du pointeur devient l’origine d’une onde qui vit 800
        ms. Sans elle, <code>onClick</code> est simplement transmis.
      </>
    ),
  },
  {
    name: 'triggerAnimation',
    type: 'boolean',
    defaultValue: 'false',
    description: (
      <>
        Déclenche la même onde <em>par programme</em>, centrée, sans clic —{' '}
        <strong>indépendamment</strong> de <code>enableLiquidAnimation</code>. C’est par là que{' '}
        <code>Modal</code> et <code>Toast</code> animent leur apparition.
      </>
    ),
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>
        Fusionné sur le <strong>contenu</strong>, avec la classe interne du contenu de verre.
      </>
    ),
  },
  {
    name: '…ComponentPropsWithoutRef<T>',
    type: 'union',
    description: (
      <>
        Tout le reste part sur l’élément de contenu. <code>ref</code> y atterrit aussi — elle est
        typée <code>any</code> dans leur source, écart assumé.
      </>
    ),
  },
];

export const glassPage: DocPage = {
  slug: 'composants/glass',
  label: 'Glass',
  group: 'composants',
  title: 'Glass',
  lede: (
    <>
      La primitive dont les composants de la librairie descendent. Elle rend cinq nœuds : un{' '}
      <code>&lt;svg&gt;</code> caché portant le filtre <code>#lg-dist</code>, puis une enveloppe qui
      empile un calque de distorsion, un voile, un liseré spéculaire et enfin votre contenu. C’est
      ce filtre SVG, combiné à un <code>backdrop-filter</code>, qui fait le verre liquide : sans lui
      il ne reste qu’un blanc translucide.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Glass" code={USAGE} />

      <Specimen title="Le verre nu, et le verre qui ondule" note={<MagicGroundNote />}>
        <MagicStage>
          <MagicCell label="au repos — quatre calques, aucun état">
            <Glass>
              <span>Panneau de verre</span>
            </Glass>
          </MagicCell>
          <MagicCell
            label={
              <>
                <code>enableLiquidAnimation</code> — cliquez : l’onde part du pointeur
              </>
            }
          >
            <Glass as="button" type="button" enableLiquidAnimation>
              Cliquez pour l’onde
            </Glass>
          </MagicCell>
        </MagicStage>
      </Specimen>

      <Specimen
        title="L’enveloppe et le contenu — et pourquoi rootStyle existe"
        note={
          <>
            <code>className</code> habille le CONTENU, <code>rootClassName</code> et{' '}
            <code>rootStyle</code> l’ENVELOPPE. Les trois figures ci-dessous ont le même rayon sauf
            la dernière, et <strong>c’est le fait à retenir de cette page</strong> : une classe
            posée sur l’enveloppe perd contre le rayon que <code>Glass</code> se donne lui-même. Un
            style en ligne, lui, gagne. Voir la mesure sous le tableau.
          </>
        }
      >
        <MagicStage>
          <MagicCell label="enveloppe par défaut — 22 px">
            <Glass>
              <span>rootClassName absent</span>
            </Glass>
          </MagicCell>
          <MagicCell
            label={
              <>
                <code>rootClassName=&quot;rounded-full&quot;</code> — <strong>inerte</strong>,
                toujours 22 px
              </>
            }
          >
            <Glass rootClassName="rounded-full">
              <span>la classe ne prend pas</span>
            </Glass>
          </MagicCell>
          <MagicCell
            label={
              <>
                <code>rootStyle</code> — 999 px, et c’est ce que fait <code>Switch</code>
              </>
            }
          >
            <Glass rootStyle={{ borderRadius: '999px' }}>
              <span>le style en ligne prend</span>
            </Glass>
          </MagicCell>
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-glass"
        note={
          <>
            <strong>
              Polymorphe sur <code>as</code>
            </strong>
            , mais seulement pour le nœud de contenu :{' '}
            <code>
              GlassProps&lt;T&gt; = {'{'} … {'}'} &amp; ComponentPropsWithoutRef&lt;T&gt;
            </code>
            . <strong>NEUF</strong> des treize autres étendent ce type, et pas les treize — recompté
            sur les sources, pas déduit du nombre de composants : <code>Badge</code>,{' '}
            <code>Button</code>, <code>Card</code>, <code>Checkbox</code>, <code>Modal</code>,{' '}
            <code>Sidebar</code>, <code>Switch</code>, <code>Tabs</code> et <code>Topbar</code>.
            C’est ce qui explique que <code>rootClassName</code> et <code>triggerAnimation</code>{' '}
            réapparaissent dans leurs signatures — et que <code>Input</code>, <code>Select</code>,{' '}
            <code>Slider</code> et le système de <code>Toast</code> ne les acceptent{' '}
            <strong>pas</strong>.{' '}
            {/* « UNE ASYMÉTRIE QUE LEURS PAGES RESPECTIVES SIGNALENT » A ÉTÉ
                RETIRÉ : sept de ces pages n'existent plus. Le compte de neuf,
                lui, porte sur les SOURCES vendorées et reste exact — ces
                composants n'ont pas disparu, ils ont cessé d'être publics.
                C'est donc ici, et nulle part ailleurs, que l'asymétrie est
                encore écrite. */}
            Cette asymétrie n’est plus documentée ailleurs : sept de ces composants n’ont plus de
            page à eux depuis qu’ils sont devenus la matière derrière la prop{' '}
            <code>liquidGlass</code> de leur jumeau Opale. Le compte ci-dessus porte sur les sources
            vendorées, qui sont toutes encore là.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>
          <code>rootClassName=&quot;rounded-full&quot;</code> ne fait rien, et c’est mesuré au
          navigateur.
        </strong>{' '}
        <code>Glass.module.scss</code> donne à son enveloppe un{' '}
        <code>border-radius: var(--lg-radius, 22px)</code>, ce qui sort en{' '}
        <code>.opale-magic-glassContainer-xxxxx {'{ border-radius: var(--lg-radius, 22px) }'}</code>
        . L’utilitaire Tailwind <code>.rounded-full {'{ border-radius: 9999px }'}</code> a la{' '}
        <strong>même spécificité</strong> (0,1,0) et sa règle passe <strong>plus tôt</strong> dans
        la feuille produite — offset <strong>11 474</strong> contre <strong>37 534</strong> dans le
        CSS de cette vitrine, et lignes 51 contre 403 (offsets 1 578 contre 17 011) dans le{' '}
        <code>magic.css</code> publié. C’est donc l’enveloppe qui gagne, dans les deux. Valeur
        calculée relevée au navigateur sur la figure ci-dessus : <code>border-radius: 22px</code>.
        L’amont figeait ce rayon à <code>8px</code> ; Opale l’a passé à 22 px et rendu réglable par{' '}
        <code>--lg-radius</code>, parce qu’un conteneur en <code>overflow: hidden</code> ne décide
        pas de son seul bord : <strong>il rogne tout ce qu’il contient</strong>, et aucun composant
        ne pouvait donc s’arrondir davantage que son enveloppe.
      </p>

      {/* LE « VOIR SA PAGE » A ÉTÉ SUPPRIMÉ, PAS REDIRIGÉ. Il menait à la page
          du `Badge` vendoré, qui a fusionné avec celle d'`Opale.Badge`. La page
          d'Opale documente le composant d'Opale et son commutateur de verre :
          elle ne dit rien de ce défaut d'arrondi, donc « voir sa page » y
          serait devenu une promesse creuse — le lecteur y serait allé chercher
          une démonstration qui n'y est pas. Le défaut, lui, est décrit ici en
          entier, avec les offsets mesurés : il n'avait pas besoin d'un renvoi.
          On dit plutôt OÙ le composant se rencontre encore, ce que l'ancien
          lien ne disait pas non plus. */}
      <p className="tc-doc-prose">
        <strong>Conséquence directe, et elle touche un autre composant :</strong> leur{' '}
        <code>Badge</code> passe précisément <code>rootClassName=&quot;rounded-full&quot;</code>{' '}
        pour se faire une pilule, et il ne l’obtient pas. Leur <code>Switch</code>, lui, emploie{' '}
        <code>rootStyle</code> et obtient bien ses 999 px : les deux écritures sont dans leur
        source, et une seule des deux marche. Ces deux composants ne sont plus des portes publiques
        — on les atteint par{' '}
        <a className="tc-doc-link" href={hrefFor('composants/opale-badge')}>
          <code>Opale.Badge</code>
        </a>{' '}
        et{' '}
        <a className="tc-doc-link" href={hrefFor('composants/opale-toggle')}>
          <code>Opale.Toggle</code>
        </a>{' '}
        sous <code>liquidGlass</code>, où Opale repose l’arrondi de son côté plutôt que de compter
        sur <code>rootClassName</code>.
      </p>

      {/* CETTE PAGE AFFIRMAIT « les treize autres » DEUX FOIS, ET C'ÉTAIT FAUX
          LES DEUX FOIS. Recompté sur les sources et vérifié au navigateur :
          treize composants sur quatorze RENDENT un `Glass` (`Slider` non —
          zéro nœud `[class*="glass"]` relevé dans son spécimen construit), et
          seuls neuf des treize autres ÉTENDENT `GlassProps`. La page de
          `Input` disait déjà qu'elle ne l'étend pas : les deux pages se
          contredisaient. Les deux nombres sont désormais ceux qu'on mesure. */}
      <p className="tc-doc-prose">
        <strong>Deux défauts connus, gardés tels quels.</strong> Le <code>&lt;filter&gt;</code>{' '}
        porte un <code>id</code> littéral — <code>lg-dist</code> — donc chaque instance de{' '}
        <code>Glass</code> réémet le même identifiant dans le document ; mesuré à 18 occurrences sur
        la page d’essai du dossier vendoré. Et sa <code>ref</code> comme son événement de clic sont
        typés <code>any</code> dans leur source. Les deux sont signalés dans{' '}
        <code>src/magic/README.md</code> et à corriger en amont, pas ici.
      </p>

      {/* Le lien vers `GlassLens` est tombé avec le composant : la 2.0 ne
          publie plus ni la lentille SVG ni `lens.css`. Le lien vers `verre`
          SURVIT parce que la page a survécu — réduite aux jetons de matériau,
          qui sont dans `src/tokens/materials.css` et restent publiés. */}
      <p className="tc-doc-prose">
        Le verre d’Opale, lui, n’est plus un composant du tout : ce qu’il en reste est un jeu de{' '}
        <strong>jetons de matériau</strong> — remplissage, flou, liseré, spéculaire — que la
        librairie publie sans les appliquer elle-même. Voir{' '}
        <a className="tc-doc-link" href={hrefFor('verre')}>
          Verre
        </a>
        . Les deux matériaux ne se mélangent pas : celui de cette page ne consomme aucun{' '}
        <code>--tc-*</code>, et aucun jeton <code>--glass-*</code> non plus.
      </p>
    </PageBody>
  ),
};
