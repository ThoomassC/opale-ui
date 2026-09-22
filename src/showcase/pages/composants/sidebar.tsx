import { Sidebar } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { UI_VERSION } from '../../version';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { SidebarCollapsibleScene } from './scenes';
import { MaterialSwitch } from './material-switch';
import { MagicPreamble } from './stage';

const USAGE = `import { Sidebar } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// \`collapsible\` est OBLIGATOIRE pour que Sidebar.Toggle rende quoi que ce soit.
<Sidebar collapsible defaultActiveItemId="etapes">
  <Sidebar.Header>
    <strong>Voyage</strong>
    <Sidebar.Toggle />
  </Sidebar.Header>

  <Sidebar.Items>
    <Sidebar.Item itemId="etapes" icon={<Pin />}>Étapes</Sidebar.Item>
    <Sidebar.Item itemId="carte" badge={<Badge>3</Badge>}>Carte</Sidebar.Item>
  </Sidebar.Items>

  <Sidebar.Footer>v${UI_VERSION}</Sidebar.Footer>
</Sidebar>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'collapsible',
    type: 'boolean',
    defaultValue: 'false',
    description: (
      <>
        <strong>
          Sans elle, <code>Sidebar.Toggle</code> rend <code>null</code>
        </strong>{' '}
        et <code>toggleCollapsed</code> sort immédiatement. Une barre passée{' '}
        <code>defaultCollapsed</code> sans <code>collapsible</code> est donc repliée{' '}
        <em>définitivement</em>.
      </>
    ),
  },
  {
    name: 'collapsed / defaultCollapsed',
    type: 'boolean',
    defaultValue: '— / false',
    description: (
      <>
        Contrôlé / non contrôlé. <code>onToggle</code> est appelée dans les deux cas et reçoit
        l’état <em>suivant</em>.
      </>
    ),
  },
  {
    name: 'onToggle',
    type: '(collapsed: boolean) => void',
    description: (
      <>
        L’état <em>suivant</em>, et rien d’autre. Ce type était{' '}
        <strong>pollué par une collision</strong> jusqu’à la réécriture —{' '}
        <code>ComponentPropsWithoutRef&lt;&apos;aside&apos;&gt;</code> apportait le{' '}
        <code>onToggle</code> du DOM, celui de <code>&lt;details&gt;</code>. Voir plus bas ce que la
        correction coûte.
      </>
    ),
  },
  {
    name: 'activeItemId / defaultActiveItemId',
    type: 'string',
    description: (
      <>
        L’entrée retenue, contrôlée ou non. <code>onSelectItem(itemId, event)</code> est appelée
        dans les deux cas.
      </>
    ),
  },
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: (
      <>
        La <strong>largeur</strong> de la barre dépliée. Posée sur l’enveloppe du verre, ou
        remplacée par la classe « repliée » dès que <code>collapsed</code> est vrai.
      </>
    ),
  },
  {
    name: 'Sidebar.Item itemId',
    type: 'string',
    required: true,
    description: (
      <>
        L’identité de l’entrée : ce que reçoit <code>onSelectItem</code>, et ce que{' '}
        <code>activeItemId</code> compare. L’entrée retenue porte{' '}
        <code>aria-current=&quot;page&quot;</code>. Le{' '}
        <strong>nom accessible du bouton est son libellé</strong>, lu dans le contenu — plus aucun{' '}
        <code>aria-label</code> n’est calculé à votre place, et passer le vôtre l’emporte comme sur
        n’importe quel bouton.
      </>
    ),
  },
  {
    name: 'Sidebar.Item icon / badge / collapsedFallback',
    type: 'ReactNode',
    description: (
      <>
        L’icône et le badge sont <code>aria-hidden</code> : ni l’une ni l’autre n’entre dans le nom
        du bouton. Le badge est <em>masqué à l’œil</em> au repli, pas retiré du DOM — comme le
        libellé. Sans icône, une barre repliée affiche <code>collapsedFallback</code>, à défaut la
        première lettre du libellé, à défaut un point médian ; les trois sont des vignettes, jamais
        un nom.
      </>
    ),
  },
  {
    name: 'Sidebar.Items aria-label',
    type: 'string',
    defaultValue: "'Sidebar'",
    description: (
      <>
        Le <code>&lt;nav&gt;</code> est un <strong>point de repère nommé</strong>. Le défaut est
        générique, et il faut le remplacer dès qu’une page porte deux rails : deux repères de même
        nom ne se distinguent pas mieux que deux repères anonymes. Le sommaire de cette vitrine
        passe « Sommaire ».
      </>
    ),
  },
  {
    name: 'Sidebar.Toggle',
    type: "ComponentPropsWithoutRef<'button'>",
    description: (
      <>
        Porte <code>aria-expanded</code> et <code>aria-controls</code> vers l’
        <code>&lt;aside&gt;</code>, dont l’<code>id</code> est généré si vous n’en passez pas. Ses{' '}
        <code>children</code> remplacent le chevron par défaut.
      </>
    ),
  },
];

export const sidebarPage: DocPage = {
  slug: 'composants/sidebar',
  label: 'Sidebar',
  group: 'composants',
  title: 'Sidebar',
  lede: (
    <>
      Une barre latérale de verre en cinq parties composées — <code>Sidebar</code>,{' '}
      <code>.Header</code>, <code>.Items</code>, <code>.Item</code>, <code>.Footer</code>, plus{' '}
      <code>.Toggle</code>. Elle rend un vrai <code>&lt;aside&gt;</code> et un vrai{' '}
      <code>&lt;nav&gt;</code> <em>nommé</em>, donc deux points de repère corrects ; ses entrées, en
      revanche, sont des <code>&lt;button&gt;</code> et non des liens.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Sidebar" code={USAGE} />

      <Specimen
        title="Pliable et contrôlée — repliez-la"
        note={
          <>
            La scène impose 256 px de hauteur : une barre latérale haute de son seul contenu ne
            ressemble pas à une barre latérale. Le pli est <strong>contrôlé ici</strong>, pour que
            l’état soit affiché sous la barre. Le fond sombre n’est plus une{' '}
            <strong>condition de lisibilité</strong> — le rail n’écrit plus d’encre en dur, il
            hérite de celle de la scène ; il reste parce qu’un verre posé sur un aplat ne réfracte
            rien. Repliez la barre et vérifiez au clavier : les libellés restent des noms de
            boutons, ils sont seulement masqués à l’œil.
          </>
        }
      >
        <SidebarCollapsibleScene />
      </Specimen>

      <Specimen
        title="Non pliable — et Sidebar.Toggle qui ne rend rien"
        note={
          <>
            Cette barre porte un <code>Sidebar.Toggle</code> dans son en-tête, et vous ne le voyez
            pas : sans <code>collapsible</code>, il rend <code>null</code>. C’est un choix{' '}
            <strong>délibéré du composant</strong>, pas un oubli du spécimen — un bouton qui ne peut
            rien faire est pire qu’un bouton absent : il occupe un cran de tabulation, il s’annonce,
            et il ne répond pas.
          </>
        }
      >
        <MaterialSwitch name="Sidebar" tall>
          {(liquidGlass) => (
            <Sidebar liquidGlass={liquidGlass} defaultActiveItemId="carte" size="small">
              <Sidebar.Header>
                <strong>Voyage</strong>
                <Sidebar.Toggle />
              </Sidebar.Header>

              <Sidebar.Items>
                <Sidebar.Item itemId="etapes">Étapes</Sidebar.Item>
                <Sidebar.Item itemId="carte">Carte</Sidebar.Item>
              </Sidebar.Items>
            </Sidebar>
          )}
        </MaterialSwitch>
      </Specimen>

      <PropsTable
        id="magic-sidebar"
        note={
          <>
            <code>SidebarProps</code> étend{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;aside&apos;&gt;</code> — moins son{' '}
            <code>onToggle</code> du DOM, voir plus bas — et reprend{' '}
            <strong>quatre props nommées</strong> de <code>GlassProps</code> :{' '}
            <code>rootClassName</code>, <code>rootStyle</code>, <code>enableLiquidAnimation</code>,{' '}
            <code>triggerAnimation</code>. Il n’intersecte plus <code>GlassProps</code> en entier,
            qui apportait le <code>as</code> du verre — de quoi remplacer l’
            <code>&lt;aside&gt;</code> — et tous les attributs d’un <code>&lt;div&gt;</code>. Chaque
            sous-composant étend l’élément qu’il rend — <code>&apos;div&apos;</code> pour l’en-tête
            et le pied, <code>&apos;nav&apos;</code> pour <code>.Items</code>,{' '}
            <code>&apos;button&apos;</code> pour <code>.Item</code> et <code>.Toggle</code>.{' '}
            <code>Sidebar.useSidebar()</code> expose le contexte.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Ce que la réécriture a corrigé, et qui ne se voit pas à l’écran.</strong> Quatre
        défauts d’accessibilité, hérités tels quels de la librairie d’où ce composant vient.{' '}
        <strong>Le premier est le plus grave</strong> : une entrée repliée perdait son nom. Le
        libellé était retiré du DOM au repli et le nom rattrapé par un <code>aria-label</code>{' '}
        calculé depuis les enfants — mais seulement{' '}
        <code>typeof children === &apos;string&apos;</code>. Toute entrée dont le libellé passait
        par un élément — une traduction, un <code>&lt;span&gt;</code>, du texte enrichi — devenait
        un <em>bouton anonyme</em> dès qu’on repliait le rail, ce que ni TypeScript ni React ne
        signalent. Le libellé est désormais toujours rendu et seulement masqué à l’œil, si bien que
        le nom est le même dans les deux états et ne dépend plus du type des enfants. Les trois
        autres : le <code>&lt;nav&gt;</code> est nommé, l’entrée retenue porte{' '}
        <code>aria-current=&quot;page&quot;</code>, et la bascule porte <code>aria-expanded</code> —
        son nom disait l’action, rien ne disait l’état à froid.
      </p>

      <p className="tc-doc-prose">
        <strong>Ce qui reste, et qui n’est pas un oubli.</strong> Les entrées sont des boutons : pas
        de <code>href</code>, donc ni clic du milieu, ni « ouvrir dans un nouvel onglet », ni
        glisser vers la barre d’adresse. C’est le contrat public du composant —{' '}
        <code>SidebarItemProps</code> étend <code>&lt;button&gt;</code> et <code>onSelectItem</code>{' '}
        reçoit un <code>MouseEvent&lt;HTMLButtonElement&gt;</code> —, et en faire un composant
        polymorphe serait une autre interface, pas une correction. Le badge, lui, est{' '}
        <code>aria-hidden</code> : le laisser dans l’arbre ferait du nom du bouton « Analytics 4 »,
        un nom qui ne correspond plus au libellé visible (WCAG 2.5.3) et qui change à chaque fois
        que le compteur bouge. Ce qu’on y perd est réel — le compteur ne s’entend pas —, et une
        entrée dont le compte est une information à part entière doit passer son propre{' '}
        <code>aria-label</code>. Le sommaire de cette vitrine montre l’autre parti, celui d’une
        vraie navigation : des <code>&lt;a&gt;</code> dans des <code>&lt;li&gt;</code> et des listes
        nommées.
      </p>

      <p className="tc-doc-prose">
        <strong>
          Une collision de types, trouvée en écrivant cette page — et corrigée depuis.
        </strong>{' '}
        <code>onToggle</code> était déclarée <code>(collapsed: boolean) =&gt; void</code>, mais{' '}
        <code>SidebarProps</code> étendait{' '}
        <code>ComponentPropsWithoutRef&lt;&apos;aside&apos;&gt;</code> en entier, qui apporte déjà
        un <code>onToggle</code> — celui du DOM, l’événement de <code>&lt;details&gt;</code>.
        TypeScript intersectait les deux signatures, si bien que le paramètre arrivait en{' '}
        <code>boolean | ToggleEvent&lt;HTMLElement&gt;</code> : passer un <code>setCollapsed</code>{' '}
        de React <em>ne compilait pas</em>, et il fallait un{' '}
        <code>typeof next === &apos;boolean&apos;</code> qui ne servait à rien à l’exécution.{' '}
        <strong>
          Le <code>onToggle</code> du DOM est désormais retiré du type
        </strong>
        , et la signature documentée est enfin la vraie. Ce que cela coûte, en toute rigueur : un
        appelant ne peut plus écouter l’événement <code>toggle</code> natif sur l’{' '}
        <code>&lt;aside&gt;</code> par cette prop — un événement qu’un <code>&lt;aside&gt;</code> ne
        déclenche que s’il porte un <code>popover</code>, et qui se branche alors sur son{' '}
        <code>ref</code>. Le même motif guette n’importe quel type qui étend un élément du DOM et
        redéclare un de ses gestionnaires ; les composants d’Opale l’évitent autrement, leur prop{' '}
        <code>liquidGlass</code> rendant le verre sans emprunter le typage de{' '}
        <code>GlassProps</code>.
      </p>

      <p className="tc-doc-prose">
        <strong>
          Le piège de <code>badge</code>, mesuré en écrivant cette page.
        </strong>{' '}
        {/* LE MÉCANISME A ÉTÉ RÉÉCRIT, PAS LE PIÈGE. La phrase disait que
            `liquidGlass` « délègue au composant vendoré » : ce n'est plus vrai,
            il n'y a plus de composant tiers derrière la prop. `Opale.Badge`
            rend lui-même `<Glass as="span">`, et c'est `Glass` — le nôtre — qui
            enveloppe toujours son contenu dans un `<div>`. Le HTML invalide est
            donc EXACTEMENT le même, pour une raison qui nous appartient
            désormais : dire le contraire aurait laissé croire que la réécriture
            avait réglé ce cas-là aussi. */}
        Y passer un{' '}
        <a className="tc-doc-link" href={hrefFor('composants/opale-badge')}>
          Badge
        </a>{' '}
        est tentant, et l’écriture nue est sûre : <code>Opale.Badge</code> rend un{' '}
        <code>&lt;span&gt;</code>. <strong>Ajoutez-lui</strong> <code>liquidGlass</code>{' '}
        <strong>et le HTML devient invalide</strong> : la pastille passe alors par{' '}
        <code>Glass</code>, dont l’enveloppe est un <code>&lt;div&gt;</code> quel que soit le{' '}
        <code>as</code> demandé, or <code>Sidebar.Item</code> rend un <code>&lt;button&gt;</code>.
        Un bloc dans un bouton — que ni TypeScript ni React ne signalent. Le spécimen ci-dessus
        emploie donc un <code>&lt;span&gt;</code> nu.
      </p>

      <p className="tc-doc-prose">
        Opale n’a pas de barre latérale publiée : la sienne est celle du site de documentation,
        écrite dans <code>src/showcase/doc-nav.tsx</code> et pas dans la librairie. Le composant de
        chrome le plus proche est{' '}
        <a className="tc-doc-link" href={hrefFor('composants/topbar')}>
          Topbar
        </a>
        .
      </p>
    </PageBody>
  ),
};
