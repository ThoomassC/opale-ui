import { Opale, Topbar } from '../../../magic';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MaterialSwitch, PlainStage } from './material-switch';

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
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de Topbar" code={USAGE} />

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
          )}
        </MaterialSwitch>
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
        <PlainStage stack>
          {(['compact', 'comfortable', 'spacious'] as const).map((size) => (
            <Topbar key={size} size={size}>
              <Topbar.Brand icon={<span aria-hidden="true">◈</span>} title={size} />
              <Topbar.Divider />
              <Topbar.Section grow>
                {/* `<code>` ET NON `<span>` : c'est du code, et le code en ligne de
                  la vitrine se coupe — `size="comfortable"` d'un seul tenant
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

      <PropsTable
        id="magic-topbar"
        note={
          <>
            <code>TopbarProps</code> étend{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;header&apos;&gt;</code> et reprend{' '}
            <strong>quatre props nommées</strong> de <code>GlassProps</code> —{' '}
            <code>rootClassName</code>, <code>rootStyle</code>, <code>enableLiquidAnimation</code>,{' '}
            <code>triggerAnimation</code>. Il n’intersecte plus <code>GlassProps</code> en entier :
            cela exposait le <code>as</code> du verre, avec lequel un appelant pouvait remplacer le{' '}
            <code>&lt;header&gt;</code> — donc faire disparaître le point de repère{' '}
            <code>banner</code> — en passant une prop qu’aucune documentation ne mentionnait.{' '}
            <code>Topbar.useTopbar()</code> ne rend que <code>{'{ size }'}</code> — c’est tout ce
            que le contexte porte.
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
        <strong>La barre n’impose plus son encre, et c’est ce qui change le plus à l’usage.</strong>{' '}
        La version d’où ce composant vient écrivait <code>text-white</code> sur la barre et sur la
        marque. Un verre est transparent : son texte se lit sur ce qu’il y a derrière, donc une
        encre blanche en dur est juste au-dessus d’une photographie et invisible au-dessus d’une
        carte blanche — <strong>1,00:1</strong>, mesuré sur le sol clair de cette vitrine. La barre
        hérite désormais la couleur de son contexte, et les deux nuances dont elle a besoin — le
        sous-titre, le fond de la pastille de marque — se dérivent de <code>currentColor</code> par{' '}
        <code>color-mix</code> : elles suivent l’encre, donc elles suivent le fond. Aucune couleur
        n’est écrite dans sa feuille ; les rayons, les coussins, l’ombre et le filet viennent des
        jetons <code>--opale-*</code>.
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
  );
}
