import { Tabs } from '../../../opale';
import { Specimen } from '../../section';
import { PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { ComponentPageLayout } from '../component-page';
import { TabsControlledScene } from './scenes';
import { MaterialSwitch, PlainStage } from './material-switch';

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

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `tabs.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function TabsContent() {
  return (
    <ComponentPageLayout
      id="tabs"
      imports={['Tabs']}
      demo={
        <Specimen
          title="Non contrôlé — et le clavier est le sujet"
          note={
            <>
              Prenez un onglet à la tabulation : <strong>un seul arrêt</strong> pour les trois, puis
              les flèches à l’intérieur. Le troisième déclencheur est <code>disabled</code> : il
              reste dans le DOM et dans l’ordre visuel, mais il n’est pas atteignable, si bien que
              les flèches passent de « Carte » à « Étapes » en bouclant. Le panneau « Carte » porte{' '}
              <code>lazyMount</code> — il n’existe pas dans le DOM avant sa première ouverture, et
              il y reste ensuite. Fond sombre <strong>obligatoire</strong> tant que les cinq jetons{' '}
              <code>--opale-tabs-*</code> gardent leur valeur par défaut : l’encre est claire, et
              sur une plaque claire elle disparaîtrait.
            </>
          }
        >
          <MaterialSwitch name="Tabs">
            {(liquidGlass) => (
              <Tabs liquidGlass={liquidGlass} defaultValue="etapes">
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
            )}
          </MaterialSwitch>
        </Specimen>
      }
      examples={
        <>
          <UsageBlock label="Import et appels représentatifs de Tabs" code={USAGE} />
          <Specimen
            title="Contrôlé — et ce que activationMode change"
            note={
              <>
                <code>activationMode=&quot;manual&quot;</code> est passé ici, et la différence
                s’entend : les flèches déplacent le focus <em>sans</em> changer de panneau, il faut{' '}
                <kbd>Entrée</kbd> ou <kbd>Espace</kbd> pour confirmer. L’arrêt de tabulation suit
                alors le focus et non la sélection — sortez du groupe au milieu d’un parcours,
                revenez-y, vous reprenez où vous en étiez. En <code>&quot;auto&quot;</code>, le
                déplacement suffit.
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
                <strong>à côté</strong> du panneau. La pastille glisse de haut en bas sans une ligne
                de code dédiée à l’axe : elle est placée en <code>translate3d</code> sur les deux
                axes à la fois, donc l’orientation ne la regarde pas.
              </>
            }
          >
            <PlainStage stack>
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
            </PlainStage>
          </Specimen>
        </>
      }
      props={
        <>
          <PropsTable
            id="tabs"
            note={
              <>
                <code>TabsProps</code> étend{' '}
                <code>ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;</code> et{' '}
                <code>GlassProps</code> ; les trois sous-composants étendent respectivement{' '}
                <code>&apos;div&apos;</code>, <code>&apos;button&apos;</code> et{' '}
                <code>&apos;div&apos;</code>. <code>Tabs.useTabs()</code> donne accès au contexte
                depuis un descendant — la valeur retenue, de quoi la changer, les deux modes et les
                deux fabriques d’identifiants.
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
              <code>disabled</code> sur <code>Tabs.Trigger</code> : l’onglet reste dans le DOM et
              dans l’ordre visuel, mais il n’est pas focusable et les flèches le sautent.
            </>
          ),
        },
      ]}
      accessibility={{
        keyboard: [
          <>
            Un seul arrêt de tabulation pour la liste (<code>tabIndex</code> roulant) : il suit le
            focus, puis la sélection, puis le premier onglet atteignable.
          </>,
          <>
            Horizontal : <kbd>←</kbd> et <kbd>→</kbd> ; vertical : <kbd>↑</kbd> et <kbd>↓</kbd>. Le
            déplacement boucle ; <kbd>Origine</kbd> et <kbd>Fin</kbd> vont au premier et au dernier
            onglet atteignable.
          </>,
          <>
            En <code>activationMode=&quot;auto&quot;</code>, se déplacer sélectionne ; en{' '}
            <code>&quot;manual&quot;</code>, <kbd>Entrée</kbd> ou <kbd>Espace</kbd> confirment.
          </>,
          <>
            Chaque panneau est lui-même un arrêt de tabulation (<code>tabIndex={'{0}'}</code>).
          </>,
        ],
        semantics: [
          <>
            <code>Tabs.List</code> porte <code>role=&quot;tablist&quot;</code> et{' '}
            <code>aria-orientation</code> ; il n’a pas de nom par défaut, un <code>aria-label</code>{' '}
            le lui donne.
          </>,
          <>
            <code>Tabs.Trigger</code> porte <code>role=&quot;tab&quot;</code>,{' '}
            <code>aria-selected</code> et <code>aria-controls</code> vers son panneau.
          </>,
          <>
            <code>Tabs.Content</code> porte <code>role=&quot;tabpanel&quot;</code> et{' '}
            <code>aria-labelledby</code> vers son onglet ; un panneau inactif porte{' '}
            <code>hidden</code>.
          </>,
          <>
            L’indicateur qui glisse est <code>aria-hidden</code> et perd sa transition sous{' '}
            <code>prefers-reduced-motion</code>.
          </>,
        ],
      }}
      limits={[
        <>
          Avec <code>liquidGlass</code>, chaque onglet est enveloppé par le conteneur du matériau :
          un <code>&lt;div&gt;</code> sans rôle s’intercale entre{' '}
          <code>role=&quot;tablist&quot;</code> et ses <code>role=&quot;tab&quot;</code>.
        </>,
        <>
          Avec <code>liquidGlass</code>, l’encre par défaut est claire : sur un fond clair,
          redéfinissez <code>--opale-tabs-ink</code>.
        </>,
        <>
          <code>aria-disabled=&quot;true&quot;</code> fait sauter l’onglet au clavier, mais le clic
          n’est pas bloqué.
        </>,
      ]}
    />
  );
}
