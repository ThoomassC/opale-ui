import { Sidebar } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { UI_VERSION } from '../../version';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { SidebarCollapsibleScene } from './scenes';
import { MagicGroundNote, MagicPreamble, MagicStage } from './stage';

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
    type: '(collapsed: boolean) => void  ∩  ToggleEventHandler',
    description: (
      <>
        <strong>Le type est pollué par une collision</strong> :{' '}
        <code>ComponentPropsWithoutRef&lt;&apos;aside&apos;&gt;</code> apporte le{' '}
        <code>onToggle</code> du DOM — celui de <code>&lt;details&gt;</code>. Le paramètre arrive
        donc en <code>boolean | ToggleEvent&lt;HTMLElement&gt;</code>. Voir plus bas.
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
        La <strong>largeur</strong> de la barre dépliée. Posée sur l’enveloppe du verre, où
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
        L’identité de l’entrée. Le composant calcule un <code>aria-label</code> depuis les enfants
        s’ils sont une chaîne — sinon il retombe sur celui que vous passez.
      </>
    ),
  },
  {
    name: 'Sidebar.Item icon / badge / collapsedFallback',
    type: 'ReactNode',
    description: (
      <>
        L’icône est <code>aria-hidden</code>. Le badge n’est rendu que déplié. Sans icône, une barre
        repliée affiche <code>collapsedFallback</code>, à défaut la première lettre du libellé, à
        défaut un point médian.
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
      <code>&lt;nav&gt;</code>, donc deux points de repère corrects ; ses entrées, en revanche, sont
      des <code>&lt;button&gt;</code> et non des liens.
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
            l’état soit affiché sous la barre. <MagicGroundNote />
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
            pas : sans <code>collapsible</code>, il rend <code>null</code>. C’est un choix de leur
            code, pas un oubli du spécimen.
          </>
        }
      >
        <MagicStage tall>
          <Sidebar defaultActiveItemId="carte" size="small">
            <Sidebar.Header>
              <strong>Voyage</strong>
              <Sidebar.Toggle />
            </Sidebar.Header>

            <Sidebar.Items>
              <Sidebar.Item itemId="etapes">Étapes</Sidebar.Item>
              <Sidebar.Item itemId="carte">Carte</Sidebar.Item>
            </Sidebar.Items>
          </Sidebar>
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-sidebar"
        note={
          <>
            <code>SidebarProps</code> étend{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;aside&apos;&gt;</code> et{' '}
            <code>GlassProps</code>. Chaque sous-composant étend l’élément qu’il rend —{' '}
            <code>&apos;div&apos;</code> pour l’en-tête et le pied, <code>&apos;nav&apos;</code>{' '}
            pour <code>.Items</code>, <code>&apos;button&apos;</code> pour <code>.Item</code> et{' '}
            <code>.Toggle</code>. <code>Sidebar.useSidebar()</code> expose le contexte.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Ce qu’il manque pour une vraie navigation.</strong> Les entrées sont des boutons :
        pas de <code>href</code>, donc ni clic du milieu, ni « ouvrir dans un nouvel onglet », ni
        glisser vers la barre d’adresse — et aucun <code>aria-current</code> sur l’entrée retenue,
        dont l’état actif n’est qu’une classe. Le <code>&lt;nav&gt;</code> de{' '}
        <code>Sidebar.Items</code> n’a pas de nom accessible, donc il s’annonce « navigation » tout
        court ; passez-lui un <code>aria-label</code>. Le sommaire de cette vitrine montre l’autre
        parti — des <code>&lt;a&gt;</code> dans des <code>&lt;li&gt;</code>, un{' '}
        <code>aria-current=&quot;page&quot;</code> et des listes nommées.
      </p>

      <p className="tc-doc-prose">
        <strong>Une collision de types, trouvée en écrivant cette page.</strong>{' '}
        <code>onToggle</code> est déclarée <code>(collapsed: boolean) =&gt; void</code>, mais{' '}
        <code>SidebarProps</code> étend{' '}
        <code>ComponentPropsWithoutRef&lt;&apos;aside&apos;&gt;</code>, qui apporte déjà un{' '}
        <code>onToggle</code> — celui du DOM, l’événement de <code>&lt;details&gt;</code>.
        TypeScript intersecte les deux signatures, si bien que le paramètre arrive en{' '}
        <code>boolean | ToggleEvent&lt;HTMLElement&gt;</code> : passer un <code>setCollapsed</code>{' '}
        de React <strong>ne compile pas</strong>. Il faut un{' '}
        <code>typeof next === &apos;boolean&apos;</code>, comme le fait le code de cette page. Le
        même motif atteint <code>Checkbox.onChange</code> par <code>GlassProps</code> — voir{' '}
        <a className="tc-doc-link" href={hrefFor('composants/checkbox')}>
          Checkbox
        </a>
        .
      </p>

      <p className="tc-doc-prose">
        <strong>
          Le piège de <code>badge</code>, mesuré en écrivant cette page.
        </strong>{' '}
        Y passer un{' '}
        <a className="tc-doc-link" href={hrefFor('composants/badge')}>
          Badge
        </a>{' '}
        est tentant et produit du HTML invalide : <code>Sidebar.Item</code> rend un{' '}
        <code>&lt;button&gt;</code>, et <code>Badge</code> passe par <code>Glass</code>, qui
        enveloppe toujours son contenu dans un <code>&lt;div&gt;</code>. Un bloc dans un bouton —
        que ni TypeScript ni React ne signalent. Le spécimen ci-dessus emploie donc un{' '}
        <code>&lt;span&gt;</code>.
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
