import { Tabs } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { TabsControlledScene } from './scenes';
import { MagicGroundNote, MagicPreamble, MagicStage } from './stage';

const USAGE = `import { Tabs } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// Non contrôlé : \`defaultValue\`, et l'état vit dans le composant.
<Tabs defaultValue="etapes">
  <Tabs.List>
    <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
    <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
    <Tabs.Trigger value="brouillon" disabled>Brouillon</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="etapes">…</Tabs.Content>
  <Tabs.Content value="carte" lazyMount>…</Tabs.Content>
</Tabs>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'string',
    description: (
      <>
        Présente, le composant est <strong>contrôlé</strong> et n’écrit plus son propre état — il
        n’appelle plus que <code>onValueChange</code>.
      </>
    ),
  },
  {
    name: 'defaultValue',
    type: 'string',
    description: (
      <>
        L’onglet initial en mode non contrôlé. <strong>Facultative</strong> : absente, le{' '}
        <em>premier déclencheur non désactivé</em> se sélectionne lui-même depuis un effet.
      </>
    ),
  },
  {
    name: 'onValueChange',
    type: '(next: string) => void',
    description: 'Appelée dans les deux modes, contrôlé comme non contrôlé.',
  },
  {
    name: 'activationMode',
    type: "'auto' | 'manual'",
    defaultValue: "'auto'",
    description: (
      <>
        <strong>Sans effet observable.</strong> Le mode n’est lu que par une fonction{' '}
        <code>deactivate</code> que le composant expose dans son contexte et{' '}
        <strong>n’appelle jamais</strong> : les flèches déplacent le focus sans sélectionner dans
        les deux modes. Défaut réel, non masqué par un <code>eslint-disable</code>.
      </>
    ),
  },
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    defaultValue: "'horizontal'",
    description: (
      <>
        Pose <code>aria-orientation</code> sur la liste et décide quelles flèches déplacent le focus
        — gauche/droite en horizontal, haut/bas en vertical.
      </>
    ),
  },
  {
    name: 'Tabs.Trigger value',
    type: 'string',
    required: true,
    description: (
      <>
        L’identité de l’onglet. Rend un{' '}
        {/* La page du bouton VENDORÉ n'existe plus : il n'y a qu'un `Button`
            désormais, et c'est celui d'Opale — le vendoré est devenu la
            matière derrière sa prop `liquidGlass`. Le lien suit. */}
        <a className="tc-doc-link" href={hrefFor('composants/opale-button')}>
          Button
        </a>{' '}
        de la librairie en <code>size=&quot;small&quot;</code>, avec{' '}
        <code>role=&quot;tab&quot;</code>, <code>aria-selected</code>, <code>aria-controls</code> et
        un <code>tabIndex</code> roving.
      </>
    ),
  },
  {
    name: 'Tabs.Content lazyMount',
    type: 'boolean',
    description: (
      <>
        Ne monte le panneau que lorsqu’il est actif. Sans elle, tous les panneaux sont montés et les
        inactifs portent <code>hidden</code>.
      </>
    ),
  },
];

export const tabsPage: DocPage = {
  slug: 'composants/tabs',
  label: 'Tabs',
  group: 'composants',
  title: 'Tabs',
  lede: (
    <>
      Le composant le mieux fini de la librairie, et de loin : quatre parties composées —{' '}
      <code>Tabs</code>, <code>Tabs.List</code>, <code>Tabs.Trigger</code>,{' '}
      <code>Tabs.Content</code> —, les rôles ARIA du motif tabulaire au complet, les identifiants
      appariés par <code>useId</code>, un <code>tabIndex</code> roving et la navigation par flèches
      avec <kbd>Origine</kbd> et <kbd>Fin</kbd>. Contrôlé ou non, au choix.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Tabs" code={USAGE} />

      <Specimen
        title="Non contrôlé — et c’est le seul clavier qui marche dans /magic"
        note={
          <>
            Prenez un onglet à la tabulation, puis les flèches. Le troisième déclencheur est{' '}
            <code>disabled</code> : il reste dans le DOM et dans l’ordre visuel, mais{' '}
            <code>getEnabledTriggerValues</code> l’écarte, si bien que les flèches passent de «
            Carte » à « Étapes » en bouclant. Le panneau « Carte » porte <code>lazyMount</code> — il
            n’existe pas dans le DOM avant sa première ouverture. <MagicGroundNote />
          </>
        }
      >
        <MagicStage stack>
          <Tabs defaultValue="etapes">
            <Tabs.List>
              <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
              <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
              <Tabs.Trigger value="brouillon" disabled>
                Brouillon
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="etapes">Les étapes du voyage, dans l’ordre.</Tabs.Content>
            <Tabs.Content value="carte" lazyMount>
              La carte, rendue côté serveur.
            </Tabs.Content>
            <Tabs.Content value="brouillon">Inatteignable.</Tabs.Content>
          </Tabs>
        </MagicStage>
      </Specimen>

      <Specimen
        title="Contrôlé — et ce que activationMode ne fait pas"
        note={
          <>
            <code>activationMode=&quot;manual&quot;</code> est passé ici, et vous ne verrez aucune
            différence : les flèches déplacent le focus sans changer l’onglet, exactement comme en{' '}
            <code>&quot;auto&quot;</code>. La prop est inerte.
          </>
        }
      >
        <TabsControlledScene />
      </Specimen>

      <Specimen
        title="Vertical"
        note={
          <>
            <code>orientation=&quot;vertical&quot;</code> change les flèches actives et pose{' '}
            <code>aria-orientation=&quot;vertical&quot;</code>.
          </>
        }
      >
        <MagicStage stack>
          <Tabs defaultValue="carte" orientation="vertical">
            <Tabs.List>
              <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
              <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
              <Tabs.Trigger value="photos">Photos</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="etapes">Les étapes.</Tabs.Content>
            <Tabs.Content value="carte">La carte.</Tabs.Content>
            <Tabs.Content value="photos">Les photos.</Tabs.Content>
          </Tabs>
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-tabs"
        note={
          <>
            <code>TabsProps</code> étend{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;</code> et <code>GlassProps</code>{' '}
            ; les trois sous-composants étendent respectivement <code>&apos;div&apos;</code>,{' '}
            <code>&apos;button&apos;</code> et <code>&apos;div&apos;</code>.{' '}
            <code>Tabs.useTabs()</code> donne accès au contexte complet depuis un descendant.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Deux réserves, malgré le reste.</strong> L’<code>onFocus</code> du déclencheur
        cherche son propre élément par <code>getElementById</code> pour lui redonner le focus qu’il
        a déjà : la boucle est sans effet mais elle est là. Et un <code>exhaustive-deps</code>{' '}
        subsiste, non masqué, sur l’effet d’auto-sélection du premier onglet.
      </p>
    </PageBody>
  ),
};
