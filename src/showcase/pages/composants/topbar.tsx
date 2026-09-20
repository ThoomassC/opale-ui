import { Opale, Topbar } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MagicGroundNote, MagicPreamble, MagicStage } from './stage';

const USAGE = `import { Opale, Topbar } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

<Topbar size="comfortable">
  <Topbar.Brand icon={<Logo />} title="Voyages" subtitle="12 étapes" />
  <Topbar.Divider />
  <Topbar.Section grow>
    <Opale.Badge>brouillon</Opale.Badge>
  </Topbar.Section>
  <Topbar.Actions>
    <Opale.Button size="small">Publier</Opale.Button>
  </Topbar.Actions>
</Topbar>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'size',
    type: "'compact' | 'comfortable' | 'spacious'",
    defaultValue: "'comfortable'",
    description: (
      <>
        Hauteur et coussin. Passée dans le contexte, donc <code>Topbar.Brand</code> et{' '}
        <code>Topbar.Divider</code> s’y accordent — et les deux <strong>jettent</strong> si on les
        rend hors d’un <code>Topbar</code>.
      </>
    ),
  },
  {
    name: 'elevated',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Ajoute l’ombre portée. C’est la seule prop propre en dehors de la taille.',
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

export const topbarPage: DocPage = {
  slug: 'composants/topbar',
  label: 'Topbar',
  group: 'composants',
  title: 'Topbar',
  lede: (
    <>
      Une barre d’application en verre, rendue comme un vrai <code>&lt;header&gt;</code> — donc un
      point de repère correct. Cinq parties composées : <code>Topbar</code>, <code>.Section</code>,{' '}
      <code>.Brand</code>, <code>.Actions</code>, <code>.Divider</code>. Le <strong>seul</strong>{' '}
      composant de la librairie qui n’a aucun état, aucun contexte de valeur et rien à contrôler :
      c’est de la mise en page.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Topbar" code={USAGE} />

      <Specimen
        title="La barre complète — marque, séparateur, section qui pousse, actions"
        note={
          <>
            La section du milieu porte <code>grow</code> : c’est elle qui repousse les actions à
            droite. Sans elle, tout se colle à gauche. <MagicGroundNote />
          </>
        }
      >
        <MagicStage stack>
          <Topbar>
            <Topbar.Brand
              icon={<span aria-hidden="true">◈</span>}
              title="Voyages"
              subtitle="12 étapes"
            />
            <Topbar.Divider />
            <Topbar.Section grow>
              {/* `Opale.Badge` ET NON LE `Badge` VENDORÉ, qui n'est plus une
                  porte publique : il est la matière derrière
                  `Opale.Badge liquidGlass`. Le ton par défaut remplace son
                  `variant="info"`, qui n'a pas d'équivalent — Opale en expose
                  trois (`primary`, `accent`, `danger`) là où le vendoré en
                  proposait six. Un `accent` aurait dit « attention » sur une
                  pastille qui ne fait qu'étiqueter un brouillon. */}
              <Opale.Badge>brouillon</Opale.Badge>
            </Topbar.Section>
            <Topbar.Actions>
              <Opale.Button size="small">Publier</Opale.Button>
            </Topbar.Actions>
          </Topbar>
        </MagicStage>
      </Specimen>

      <Specimen
        title="Les trois tailles, et l’ombre qu’on peut retirer"
        note={
          <>
            <code>size</code> agit aussi sur la marque et le séparateur, par le contexte : les trois
            barres ci-dessous ne diffèrent pas seulement en hauteur. La dernière porte{' '}
            <code>elevated={'{false}'}</code>.
          </>
        }
      >
        <MagicStage stack>
          {(['compact', 'comfortable', 'spacious'] as const).map((size) => (
            <Topbar key={size} size={size}>
              <Topbar.Brand icon={<span aria-hidden="true">◈</span>} title={size} />
              <Topbar.Divider />
              <Topbar.Section grow>
                <span>size=&quot;{size}&quot;</span>
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
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-topbar"
        note={
          <>
            <code>TopbarProps</code> étend{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;header&apos;&gt;</code> et{' '}
            <code>GlassProps</code>. <code>Topbar.useTopbar()</code> ne rend que{' '}
            <code>{'{ size }'}</code> — c’est tout ce que le contexte porte.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Deux remarques d’emploi.</strong> Un <code>&lt;header&gt;</code> n’est un point de
        repère « banner » que s’il n’est pas imbriqué dans un <code>&lt;article&gt;</code> ou une{' '}
        <code>&lt;section&gt;</code> — sur les scènes de cette page il ne l’est donc pas, et c’est
        normal. Et rien dans ce composant ne pose <code>position: sticky</code> : le collage en haut
        de fenêtre est à votre charge, comme l’est le décalage de défilement qui empêche la barre de
        manger l’anneau de focus (WCAG 2.4.11) — la barre de cette vitrine le fait dans{' '}
        <code>doc.css</code>.
      </p>

      <p className="tc-doc-prose">
        L’équivalent d’Opale n’est pas publié : la barre du haut de ce site vit dans{' '}
        <code>src/showcase/doc-shell.tsx</code>. Voir aussi{' '}
        <a className="tc-doc-link" href={hrefFor('composants/sidebar')}>
          Sidebar
        </a>{' '}
        pour l’autre moitié du chrome.
      </p>
    </PageBody>
  ),
};
