import { Opale, Topbar } from '../../../opale';
import { Specimen } from '../../section';
import { PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { ComponentPageLayout } from '../component-page';
import { MaterialSwitch, PlainStage } from './material-switch';

const USAGE = `import { Badge, Button, Topbar } from '@thomascaron/opale-ui';

<Topbar size="medium">
  <Topbar.Brand icon={<Logo />} title="Voyages" subtitle="12 étapes" />
  <Topbar.Divider />
  <Topbar.Section grow>
    <Badge>brouillon</Badge>
  </Topbar.Section>
  <Topbar.Actions>
    <Button size="small">Publier</Button>
  </Topbar.Actions>
</Topbar>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: (
      <>
        Hauteur et coussin. Passée dans le contexte, donc <code>Topbar.Brand</code> et{' '}
        <code>Topbar.Divider</code> s’y accordent — et les deux <strong>jettent</strong> si on les
        rend hors d’un <code>Topbar</code>. Les anciens noms <code>compact</code>,{' '}
        <code>comfortable</code> et <code>spacious</code> restent acceptés, et{' '}
        <code>Topbar.useTopbar().size</code> les rend toujours.
      </>
    ),
  },
  {
    name: 'elevated',
    type: 'boolean',
    defaultValue: 'true',
    description: (
      <>
        Ajoute l’ombre portée, sur <strong>l’enveloppe de verre</strong>. Elle était posée sur le{' '}
        <code>&lt;header&gt;</code> intérieur, c’est-à-dire du mauvais côté de l’
        <code>overflow: hidden</code> de l’enveloppe : elle était rognée par son propre parent et ne
        se voyait pas. C’est la seule prop propre en dehors de la taille.
      </>
    ),
  },
  {
    name: 'Topbar.Section grow',
    type: 'boolean',
    defaultValue: 'false',
    description: (
      <>
        <code>flex-grow</code>. C’est ainsi qu’on repousse les actions à droite : une section qui
        pousse au milieu.
      </>
    ),
  },
  {
    name: 'Topbar.Section align',
    type: "'left' | 'center' | 'right' | 'between'",
    defaultValue: "'left'",
    description: 'Justification interne de la section.',
  },
  {
    name: 'Topbar.Section gap / wrap',
    type: "'tight' | 'regular' | 'relaxed' / boolean",
    defaultValue: "'regular' / false",
    description: (
      <>
        L’écart entre les enfants, et l’autorisation de passer à la ligne.{' '}
        <code>Topbar.Actions</code> est un <code>Topbar.Section</code> préréglé{' '}
        <code>align=&quot;right&quot; gap=&quot;tight&quot;</code>.
      </>
    ),
  },
  {
    name: 'Topbar.Brand icon / title / subtitle',
    type: 'ReactNode',
    description: (
      <>
        Trois emplacements. L’icône est <code>aria-hidden</code>. Passer des <code>children</code>{' '}
        remplace <em>title et subtitle à la fois</em>.
      </>
    ),
  },
];

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `topbar.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function TopbarContent() {
  return (
    <ComponentPageLayout
      id="topbar"
      imports={['Topbar']}
      demo={
        <Specimen
          title="La barre complète — marque, séparateur, section qui pousse, actions"
          note={
            <>
              La section du milieu porte <code>grow</code> : c’est elle qui repousse les actions à
              droite. Sans elle, tout se colle à gauche. Le fond sombre n’est plus une{' '}
              <strong>condition de lisibilité</strong> — la barre n’écrit plus d’encre en dur, elle
              hérite de celle de son contexte, ici le blanc de la scène. Il reste pour une autre
              raison : un verre posé sur un aplat ne réfracte rien, et ne se voit qu’au-dessus de
              quelque chose.
            </>
          }
        >
          <MaterialSwitch name="Topbar">
            {(liquidGlass) => (
              <Topbar liquidGlass={liquidGlass}>
                <Topbar.Brand
                  icon={<span aria-hidden="true">◈</span>}
                  title="Voyages"
                  subtitle="12 étapes"
                />
                <Topbar.Divider />
                <Topbar.Section grow>
                  {/* `Opale.Badge` ET NON LE `Badge` D’ORIGINE, qui n'est plus une
                  porte publique : il est la matière derrière
                  `Opale.Badge liquidGlass`. Le ton par défaut remplace son
                  `variant="info"`, qui n'a pas d'équivalent — Opale en expose
                  trois (`primary`, `accent`, `danger`) là où l’ancien composant en
                  proposait six. Un `accent` aurait dit « attention » sur une
                  pastille qui ne fait qu'étiqueter un brouillon. */}
                  <Opale.Badge>brouillon</Opale.Badge>
                </Topbar.Section>
                <Topbar.Actions>
                  <Opale.Button size="small">Publier</Opale.Button>
                </Topbar.Actions>
              </Topbar>
            )}
          </MaterialSwitch>
        </Specimen>
      }
      examples={
        <>
          <UsageBlock label="Import et appels représentatifs de Topbar" code={USAGE} />
          <Specimen
            title="Les trois tailles, et l’ombre qu’on peut retirer"
            note={
              <>
                <code>size</code> agit aussi sur la marque et le séparateur, par le contexte : les
                trois barres ci-dessous ne diffèrent pas seulement en hauteur. La dernière porte{' '}
                <code>elevated={'{false}'}</code>.
              </>
            }
          >
            <PlainStage stack>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <Topbar key={size} size={size}>
                  <Topbar.Brand icon={<span aria-hidden="true">◈</span>} title={size} />
                  <Topbar.Divider />
                  <Topbar.Section grow>
                    {/* `<code>` ET NON `<span>` : c'est du code, et le code en ligne de
                      la vitrine se coupe — un `size="…"` d'un seul tenant
                      débordait la barre à 320 px. */}
                    <code>size=&quot;{size}&quot;</code>
                  </Topbar.Section>
                </Topbar>
              ))}

              <Topbar elevated={false}>
                <Topbar.Brand icon={<span aria-hidden="true">◈</span>} title="sans ombre" />
                <Topbar.Divider />
                <Topbar.Section grow>
                  <span>elevated={'{false}'}</span>
                </Topbar.Section>
              </Topbar>
            </PlainStage>
          </Specimen>
        </>
      }
      props={
        <>
          <PropsTable
            id="topbar"
            note={
              <>
                <code>TopbarProps</code> étend{' '}
                <code>ComponentPropsWithoutRef&lt;&apos;header&apos;&gt;</code> et reprend{' '}
                <strong>des props nommées</strong> de <code>GlassProps</code> —{' '}
                <code>rootClassName</code> et <code>rootStyle</code>, qui atteignent l’enveloppe du
                verre ; l’onde est interne au matériau. Il n’intersecte plus <code>GlassProps</code>{' '}
                en entier : cela exposait le <code>as</code> du verre, avec lequel un appelant
                pouvait remplacer le <code>&lt;header&gt;</code> — donc faire disparaître le point
                de repère <code>banner</code> — en passant une prop qu’aucune documentation ne
                mentionnait. <code>Topbar.useTopbar()</code> ne rend que <code>{'{ size }'}</code> —
                c’est tout ce que le contexte porte.
              </>
            }
            rows={PROPS}
          />
        </>
      }
      accessibility={{
        keyboard: [
          <>
            Aucune touche propre : la barre ne fait que disposer ses enfants, qui gardent leur
            clavier.
          </>,
        ],
        semantics: [
          <>
            La racine est un <code>&lt;header&gt;</code> : un repère <code>banner</code> tant qu’il
            n’est pas imbriqué dans un <code>&lt;article&gt;</code> ou une{' '}
            <code>&lt;section&gt;</code>. Aucune prop ne permet de changer cet élément.
          </>,
          <>
            Pas de nom par défaut ; un <code>aria-label</code> passé le lui donne.
          </>,
          <>
            L’icône de <code>Topbar.Brand</code> est <code>aria-hidden</code>.{' '}
            <code>Topbar.Divider</code> est <code>aria-hidden</code>, et non un{' '}
            <code>role=&quot;separator&quot;</code>.
          </>,
        ],
      }}
      limits={[
        <>
          Rien ne pose <code>position: sticky</code> : le collage en haut de fenêtre, et le décalage
          de défilement qui garde l’anneau de focus visible (WCAG 2.4.11), sont à la charge de
          l’hôte.
        </>,
        <>
          <code>Topbar.Brand</code>, <code>Topbar.Divider</code> et <code>Topbar.useTopbar</code>{' '}
          jettent hors d’un <code>Topbar</code>.
        </>,
      ]}
    />
  );
}
