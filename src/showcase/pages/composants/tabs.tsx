import { Tabs } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { TabsControlledScene } from './scenes';
import { MagicPreamble, MagicStage } from './stage';

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
        <em>premier déclencheur atteignable dans l’ordre du document</em> se sélectionne, et{' '}
        <code>onValueChange</code> l’annonce. C’est la liste qui tranche, parce qu’elle est la seule
        à voir ses onglets dans l’ordre.
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
        En <code>&quot;auto&quot;</code>, se déplacer aux flèches <strong>change de panneau</strong>{' '}
        ; en <code>&quot;manual&quot;</code>, le déplacement ne fait que déplacer et c’est{' '}
        <kbd>Entrée</kbd> ou <kbd>Espace</kbd> qui confirme.
      </>
    ),
  },
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    defaultValue: "'horizontal'",
    description: (
      <>
        Pose <code>aria-orientation</code> sur la liste, décide quelles flèches déplacent le focus —
        gauche/droite en horizontal, haut/bas en vertical — et met la liste <em>à côté</em> des
        panneaux plutôt qu’au-dessus.
      </>
    ),
  },
  {
    name: 'Tabs.Trigger value',
    type: 'string',
    required: true,
    description: (
      <>
        L’identité de l’onglet. Rend un <code>&lt;button&gt;</code> natif enveloppé dans le matériau{' '}
        <code>Glass</code>, porteur de <code>role=&quot;tab&quot;</code>, <code>aria-selected</code>
        , <code>aria-controls</code>, du <code>tabIndex</code> roulant et d’un{' '}
        <code>data-value</code> — c’est par lui que le déplacement au clavier retrouve l’onglet
        visé, sans registre tenu à côté du DOM.
      </>
    ),
  },
  {
    name: 'Tabs.Content lazyMount',
    type: 'boolean',
    description: (
      <>
        Ne monte le panneau qu’à sa <strong>première</strong> ouverture ; ensuite il reste monté et
        seulement caché. Sans elle, tous les panneaux sont montés dès le départ et les inactifs
        portent <code>hidden</code>.
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
      Quatre parties composées — <code>Tabs</code>, <code>Tabs.List</code>,{' '}
      <code>Tabs.Trigger</code>, <code>Tabs.Content</code> —, les rôles ARIA du motif tabulaire au
      complet, les identifiants appariés par <code>useId</code>, un seul arrêt de tabulation pour
      tout le groupe et la navigation par flèches avec <kbd>Origine</kbd> et <kbd>Fin</kbd>.
      Contrôlé ou non, au choix. <strong>Réécrit par Opale</strong> : c’était le plus gros des
      composants repris ailleurs, et un motif d’accessibilité ne se recopie pas — il se tient.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Tabs" code={USAGE} />

      <Specimen
        title="Non contrôlé — et le clavier est le sujet"
        note={
          <>
            Prenez un onglet à la tabulation : <strong>un seul arrêt</strong> pour les trois, puis
            les flèches à l’intérieur. Le troisième déclencheur est <code>disabled</code> : il reste
            dans le DOM et dans l’ordre visuel, mais il n’est pas atteignable, si bien que les
            flèches passent de « Carte » à « Étapes » en bouclant. Le panneau « Carte » porte{' '}
            <code>lazyMount</code> — il n’existe pas dans le DOM avant sa première ouverture, et il
            y reste ensuite. Fond sombre <strong>obligatoire</strong> tant que les cinq jetons{' '}
            <code>--opale-tabs-*</code> gardent leur valeur par défaut : l’encre est claire, et sur
            une plaque claire elle disparaîtrait.
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
        title="Contrôlé — et ce que activationMode change"
        note={
          <>
            <code>activationMode=&quot;manual&quot;</code> est passé ici, et la différence s’entend
            : les flèches déplacent le focus <em>sans</em> changer de panneau, il faut{' '}
            <kbd>Entrée</kbd> ou <kbd>Espace</kbd> pour confirmer. L’arrêt de tabulation suit alors
            le focus et non la sélection — sortez du groupe au milieu d’un parcours, revenez-y, vous
            reprenez où vous en étiez. En <code>&quot;auto&quot;</code>, le déplacement suffit.
          </>
        }
      >
        <TabsControlledScene />
      </Specimen>

      <Specimen
        title="Vertical"
        note={
          <>
            <code>orientation=&quot;vertical&quot;</code> change les flèches actives, pose{' '}
            <code>aria-orientation=&quot;vertical&quot;</code> et pose la liste{' '}
            <strong>à côté</strong> du panneau. La pastille glisse de haut en bas sans une ligne de
            code dédiée à l’axe : elle est placée en <code>translate3d</code> sur les deux axes à la
            fois, donc l’orientation ne la regarde pas.
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
            <code>Tabs.useTabs()</code> donne accès au contexte depuis un descendant — la valeur
            retenue, de quoi la changer, les deux modes et les deux fabriques d’identifiants.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Deux réserves, et elles sont écrites ici faute de pouvoir être corrigées.</strong>{' '}
        Chaque déclencheur est enveloppé par le conteneur du matériau, si bien qu’un{' '}
        <code>&lt;div&gt;</code> sans rôle s’intercale entre <code>role=&quot;tablist&quot;</code>{' '}
        et ses <code>role=&quot;tab&quot;</code> : les restitutions vocales et les vérificateurs
        traversent un élément générique, mais la parenté n’est plus directe. La supprimer
        demanderait de renoncer au verre sur les onglets — c’est pourtant lui qui laisse voir la
        pastille à travers la capsule. Et l’encre par défaut est claire : posé sur un fond clair
        sans redéfinir <code>--opale-tabs-ink</code>, le composant est illisible.
      </p>
    </PageBody>
  ),
};
