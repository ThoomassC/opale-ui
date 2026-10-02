import { Specimen } from '../../section';
import { PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { ComponentPageLayout } from '../component-page';
import { SidebarCollapsibleScene, SidebarMobileScene } from './scenes';

const USAGE = `import { Badge, Sidebar } from '@thomascaron/opale-ui';

// \`customScrollbar\`, \`resizable\` et \`mobile\` : la barre, la poignée et le format
// mobile du sommaire de cette documentation.
<Sidebar customScrollbar resizable mobile="auto" defaultValue="etapes">
  <Sidebar.Items>
    <Sidebar.Group title="Le voyage">
      <Sidebar.Item itemId="etapes" icon={<Pin />}>Étapes</Sidebar.Item>
      <Sidebar.Item itemId="carte" badge={<Badge>3</Badge>}>Carte</Sidebar.Item>
    </Sidebar.Group>
  </Sidebar.Items>
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
        Contrôlé / non contrôlé. <code>onCollapsedChange</code> est appelée dans les deux cas et
        reçoit l’état <em>suivant</em>.
      </>
    ),
  },
  {
    name: 'onCollapsedChange',
    type: '(collapsed: boolean) => void',
    description: (
      <>
        L’état <em>suivant</em>, et rien d’autre. Remplace <code>onToggle</code>, déprécié depuis
        2.6 et toujours appelé, après lui.
      </>
    ),
  },
  {
    name: 'value / defaultValue',
    type: 'string | null',
    description: (
      <>
        L’entrée retenue, contrôlée ou non ; <code>null</code> n’en retient aucune.{' '}
        <code>onValueChange(itemId)</code> est appelée dans les deux cas. Remplacent{' '}
        <code>activeItemId</code>, <code>defaultActiveItemId</code> et <code>onSelectItem</code>,
        dépréciés depuis 2.6.
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
        L’identité de l’entrée : ce que reçoit <code>onValueChange</code>, et ce que{' '}
        <code>value</code> compare. L’entrée retenue porte{' '}
        <code>aria-current=&quot;page&quot;</code>. Le{' '}
        <strong>nom accessible de l’entrée est son libellé</strong>, lu dans le contenu — plus aucun{' '}
        <code>aria-label</code> n’est calculé à votre place, et passer le vôtre l’emporte comme sur
        n’importe quel bouton.
      </>
    ),
  },
  {
    name: 'Sidebar.Item href',
    type: 'string',
    description: (
      <>
        Sa présence rend un <strong>vrai lien</strong> <code>&lt;a href&gt;</code> au lieu d’un{' '}
        <code>&lt;button&gt;</code> : il navigue sans script et s’ouvre dans un onglet au clic du
        milieu. Retenu, il porte <code>aria-current=&quot;page&quot;</code> comme le bouton ;{' '}
        <code>disabled</code> lui retire son adresse et le dit <code>aria-disabled</code>.
      </>
    ),
  },
  {
    name: 'onNavigate',
    type: '(item: { id: string; href: string }, event: MouseEvent<HTMLAnchorElement>) => void',
    description: (
      <>
        Le crochet du routeur, pour les entrées avec <code>href</code>. Sur un clic gauche simple,
        le rail retient l’entrée, annule la navigation native puis l’appelle ; Ctrl, Cmd, Maj, Alt,
        le clic du milieu et un <code>target</code> vers un autre onglet restent au navigateur.
        Next.js : <code>{'(item) => router.push(item.href)'}</code>.
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
    name: 'customScrollbar',
    type: 'boolean',
    defaultValue: 'false',
    description: (
      <>
        La barre de défilement du sommaire de cette documentation : un curseur qu’on glisse, et le
        clavier quand elle a le focus (flèches, pages, <kbd>Début</kbd>, <kbd>Fin</kbd>). Le rail
        défile dans sa propre zone : donnez-lui une hauteur. Sans contenu qui dépasse, la barre se
        cache.
      </>
    ),
  },
  {
    name: 'resizable · width / defaultWidth · minWidth · maxWidth · onWidthChange',
    type: 'boolean · number · number · number · (width: number) => void',
    defaultValue: 'false · taille de size · 224 · 480',
    description: (
      <>
        Une poignée sur le bord règle la largeur, au glisser et au clavier (flèches par 16 px, 32
        avec <kbd>Maj</kbd>, <kbd>Début</kbd> et <kbd>Fin</kbd> aux bornes). C’est un séparateur
        focalisable (<code>role=&quot;separator&quot;</code>) dont la valeur est la largeur en
        pixels. Le rail est enveloppé d’un cadre qui porte la poignée ; plié, il n’en a pas.
      </>
    ),
  },
  {
    name: 'mobile',
    type: "'off' | 'auto' | 'menu'",
    defaultValue: "'off'",
    description: (
      <>
        Le format mobile du sommaire de cette documentation : un bouton « Sommaire », une rangée de
        raccourcis vers chaque <code>Sidebar.Group</code>, puis le rail en pleine largeur, sans
        poignée. <code>auto</code> l’adopte sous 30 rem de fenêtre, <code>menu</code> toujours.
        Libellés : <code>labels.menu</code> et <code>labels.shortcuts</code>.
      </>
    ),
  },
  {
    name: 'Sidebar.Group',
    type: '{ title, collapsible?, defaultOpen?, open?, onOpenChange? }',
    defaultValue: 'collapsible et defaultOpen : true',
    description: (
      <>
        Une partie du rail, comme celles du sommaire de cette documentation : un titre en mono
        capitales, puis ses entrées. Le titre nomme le groupe (<code>role=&quot;group&quot;</code>)
        ; repliable, c’est un bouton qui dit son état (<code>aria-expanded</code>). Rail plié, le
        titre est masqué à l’œil et toutes les entrées restent visibles.
      </>
    ),
  },
  {
    name: 'Sidebar.Items aria-label',
    type: 'string',
    defaultValue: "'Navigation latérale'",
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
  {
    name: 'labels',
    type: 'Partial<SidebarLabels>',
    defaultValue:
      "{ items: 'Navigation latérale', expand: 'Déplier le rail', collapse: 'Replier le rail' }",
    description: (
      <>
        Les textes du rail, transmis par le contexte à <code>Sidebar.Items</code> et à{' '}
        <code>Sidebar.Toggle</code>. Une clé omise garde son défaut français ; l’
        <code>aria-label</code> passé à <code>Sidebar.Items</code> gagne encore.
      </>
    ),
  },
];

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `sidebar.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function SidebarContent() {
  return (
    <ComponentPageLayout
      id="sidebar"
      imports={['Sidebar']}
      demo={
        <Specimen
          title="Le rail du sommaire — faites-le défiler, élargissez-le"
          note={
            <>
              Le même rail que le sommaire de cette documentation : des parties titrées, la barre de
              défilement d’Opale et la poignée de largeur, au glisser comme au clavier. Le rail a
              une hauteur à lui : son contenu défile dans sa zone. L’entrée retenue est{' '}
              <strong>contrôlée ici</strong>, pour être affichée à côté — et elle survit au
              changement de matériau. Sur la photographie, le rail hérite de l’encre de la scène, et
              l’entrée retenue se lit par un liseré plutôt que par la teinte primaire.
            </>
          }
        >
          <SidebarCollapsibleScene />
        </Specimen>
      }
      examples={
        <>
          <UsageBlock label="Import et appels représentatifs de Sidebar" code={USAGE} />
          <Specimen
            title="Format mobile — celui du sommaire d’Opale"
            note={
              <>
                Le bouton « Sommaire » déplie le rail ; la rangée de pastilles mène à chaque partie,
                qu’elle rouvre si elle était fermée ; <kbd>Échap</kbd> replie et rend le focus au
                bouton. Ici forcé par <code>mobile=&quot;menu&quot;</code> dans un cadre de
                téléphone ; <code>mobile=&quot;auto&quot;</code> l’adopte sous 30 rem de fenêtre,
                comme le sommaire de cette documentation.
              </>
            }
          >
            <SidebarMobileScene />
          </Specimen>
        </>
      }
      props={
        <>
          <PropsTable
            id="sidebar"
            note={
              <>
                <code>SidebarProps</code> étend{' '}
                <code>ComponentPropsWithoutRef&lt;&apos;aside&apos;&gt;</code> — moins son{' '}
                <code>onToggle</code> du DOM, voir plus bas — et reprend{' '}
                <strong>des props nommées</strong> de <code>GlassProps</code> :{' '}
                <code>rootClassName</code> et <code>rootStyle</code>, qui atteignent l’enveloppe du
                verre ; <code>enableLiquidAnimation</code> et <code>triggerAnimation</code> restent
                acceptés mais sont dépréciés depuis 2.7. Il n’intersecte plus{' '}
                <code>GlassProps</code> en entier, qui apportait le <code>as</code> du verre — de
                quoi remplacer l’
                <code>&lt;aside&gt;</code> — et tous les attributs d’un <code>&lt;div&gt;</code>.
                Chaque sous-composant étend l’élément qu’il rend — <code>&apos;div&apos;</code> pour
                l’en-tête et le pied, <code>&apos;nav&apos;</code> pour <code>.Items</code>,{' '}
                <code>&apos;button&apos;</code> pour <code>.Item</code> et <code>.Toggle</code>.{' '}
                <code>Sidebar.useSidebar()</code> expose le contexte.
              </>
            }
            rows={PROPS}
          />
        </>
      }
      states={[
        {
          state: 'disabled',
          description: (
            <>
              <code>disabled</code> sur <code>Sidebar.Item</code> pose l’attribut natif du bouton ;
              le clic est ignoré.
            </>
          ),
        },
      ]}
      accessibility={{
        keyboard: [
          <>
            Entrées et bascule sont des <code>&lt;button&gt;</code> natifs, chacun dans l’ordre de
            tabulation : <kbd>Entrée</kbd> et <kbd>Espace</kbd> les activent. Pas de déplacement aux
            flèches.
          </>,
        ],
        semantics: [
          <>
            La racine est un <code>&lt;aside&gt;</code> (repère complémentaire) ;{' '}
            <code>Sidebar.Items</code> est un <code>&lt;nav&gt;</code> nommé « Navigation latérale »
            (<code>labels.items</code>), qu’un <code>aria-label</code> remplace.
          </>,
          <>
            L’entrée retenue porte <code>aria-current=&quot;page&quot;</code>. Son nom est son
            libellé, toujours rendu et seulement masqué à l’œil au repli : il ne change pas d’un
            état à l’autre.
          </>,
          <>
            L’icône, la vignette de repli et le badge sont <code>aria-hidden</code>.
          </>,
          <>
            <code>Sidebar.Toggle</code> porte <code>aria-expanded</code> et{' '}
            <code>aria-controls</code> vers l’<code>&lt;aside&gt;</code> ; il se nomme « Replier le
            rail » ou « Déplier le rail » (<code>labels</code>) s’il n’a pas d’enfants.
          </>,
          <>
            Sous <code>prefers-reduced-motion</code>, le pli se fait sans transition.
          </>,
        ],
      }}
      limits={[
        <>
          Les entrées sont des boutons, pas des liens : ni <code>href</code>, ni clic du milieu, ni
          ouverture dans un nouvel onglet.
        </>,
        <>
          Le badge n’est pas annoncé ; une entrée dont le compte est une information passe son
          propre <code>aria-label</code>.
        </>,
        <>
          Deux rails sur une page doivent recevoir deux noms distincts (<code>labels.items</code>).
        </>,
        <>
          Sans <code>collapsible</code>, <code>Sidebar.Toggle</code> rend <code>null</code>.
        </>,
      ]}
    />
  );
}
