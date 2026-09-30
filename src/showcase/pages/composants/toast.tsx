import { Specimen } from '../../section';
import { PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { COMPONENT_ALTERNATIVES } from '../component-alternatives';
import { ComponentPageLayout } from '../component-page';
import { MaterialSwitch } from './material-switch';
import { ToastPositionScene, ToastVariantScene } from './scenes';
import { StageGroundNote } from './stage';

const USAGE = `import { Button, ToastProvider, useToast } from '@thomascaron/opale-ui';

// 1. Le fournisseur, AUTOUR de l'arbre qui déclenchera les toasts.
<ToastProvider position="bottom-right" duration={4000}>
  <App />
</ToastProvider>

// 2. Le déclencheur, DANS cet arbre. \`useToast\` JETTE hors du fournisseur.
function Publish() {
  const { showToast, dismissToast, clearToasts } = useToast();

  return (
    <Button
      onClick={() => showToast({ title: 'Étape publiée', tone: 'success' })}
    >
      Publier
    </Button>
  );
}`;

const PROPS: readonly PropRow[] = [
  {
    name: 'ToastProvider children',
    type: 'ReactNode',
    required: true,
    description: (
      <>
        L’arbre qui pourra déclencher des toasts. <code>useToast</code>{' '}
        <strong>jette une erreur</strong> hors de ce fournisseur — ce n’est pas un repli silencieux.
      </>
    ),
  },
  {
    name: 'ToastProvider duration',
    type: 'number',
    defaultValue: '4000',
    description: (
      <>
        Millisecondes avant fermeture automatique. <code>Infinity</code> désarme la minuterie : le
        toast reste jusqu’à un clic ou un <code>dismissToast</code>. Sans durée passée ici ni au
        toast, <code>error</code> et <code>warning</code> restent jusqu’à leur fermeture.{' '}
        <strong>
          La minuterie se met en pause au survol et dès que le focus entre dans la carte
        </strong>
        , puis reprend le temps qui restait — pas la durée entière.
      </>
    ),
  },
  {
    name: 'ToastProvider position',
    type: "'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'",
    defaultValue: "'top-right'",
    description: (
      <>
        Le coin par défaut. Chaque toast peut le surcharger, et les toasts sont regroupés par
        position — six piles possibles, empilées du plus récent en haut ou en bas selon le coin.
        Chaque pile est elle-même coupée en deux régions live, une polie et une assertive : à
        l’intérieur d’un coin, les <code>error</code> se groupent donc entre eux plutôt que de
        s’intercaler par ordre d’arrivée. Voir plus bas.
      </>
    ),
  },
  {
    name: 'ToastProvider animation',
    type: "'slide-from-right' | 'slide-from-left' | 'slide-from-bottom' | 'scale'",
    defaultValue: "'slide-from-right'",
    description: (
      <>
        L’entrée par défaut, surchargeable par toast. Les quatre sorties durent 220 ms
        (<code>--opale-motion</code>).
      </>
    ),
  },
  {
    name: 'ToastProvider portalContainer',
    type: 'HTMLElement | null',
    defaultValue: 'document.body',
    description: (
      <>
        L’hôte du portail, <strong>résolu pendant le rendu</strong> et non après un effet. Les
        régions live y sont montées <em>avec</em> le fournisseur, donc avant le premier toast —
        c’est la condition pour qu’une insertion soit annoncée.
      </>
    ),
  },
  {
    name: 'ToastProvider labels',
    type: 'Partial<ToastLabels>',
    defaultValue: "{ close: 'Fermer la notification' }",
    description: 'Les textes des cartes de la file ; une clé omise garde son défaut français.',
  },
  {
    name: 'useToast().showToast',
    type: '(toast: ToastDefinition) => string',
    description: (
      <>
        Empile un toast et rend son identifiant. <code>ToastDefinition</code> accepte{' '}
        <code>id</code>, <code>title</code>, <code>description</code>, <code>tone</code>,{' '}
        <code>duration</code>, <code>animation</code>, <code>position</code>,{' '}
        <code>enableLiquidAnimation</code> et <code>onClose</code>.{' '}
        <strong>
          Un <code>id</code> déjà présent dans la file remplace son toast au lieu d’en empiler un
          second
        </strong>{' '}
        — c’est ce qui rend la prop utilisable pour un message qui se met à jour
        («&nbsp;Enregistrement…&nbsp;» puis «&nbsp;Enregistré&nbsp;»).
      </>
    ),
  },
  {
    name: 'useToast().dismissToast / clearToasts',
    type: '(id: string) => void / () => void',
    description: (
      <>
        Marquent un toast, ou tous, comme congédiés : la phase de sortie s’enclenche, puis le
        retrait effectif après la durée d’animation.
      </>
    ),
  },
];

/* La page « ToastProvider » : la file de toasts (`ToastProvider`, `useToast`),
   portaillée dans les coins de l'écran. `Opale.Toast` est un autre mécanisme,
   rendu sur place et piloté par `open` : il a sa propre page. Les métadonnées
   de la page vivent dans `toast.page.tsx`, lu par le sommaire sans rien charger. */
export default function ToastContent() {
  return (
    <ComponentPageLayout
      id="toast"
      imports={['ToastProvider', 'useToast']}
      alternative={COMPONENT_ALTERNATIVES['composants/toast-provider']}
      demo={
        <Specimen
          title="Les cinq tons — déclenchez-les"
          note={
            <>
              <strong>
                Les toasts sont portaillés dans <code>document.body</code> : ils apparaissent en
                haut à droite de la fenêtre, pas dans la scène.
              </strong>{' '}
              Ils se ferment seuls au bout de 4 s — sauf l’erreur et l’avertissement, qui attendent
              —, à la croix, ou avec « Tout fermer » — et{' '}
              <strong>la minuterie s’arrête tant que le pointeur est dessus</strong>, donc
              survolez-en un pour le garder le temps de le lire. La scène est sombre pour ses
              boutons, qui sont ceux de la librairie. <StageGroundNote />
            </>
          }
        >
          <MaterialSwitch name="ToastProvider">
            {(liquidGlass) => <ToastVariantScene liquidGlass={liquidGlass} />}
          </MaterialSwitch>
        </Specimen>
      }
      examples={
        <>
          <UsageBlock label="Le montage de ToastProvider, en deux temps" code={USAGE} />
          <Specimen
            title="Positions, animations, et une durée infinie"
            note={
              <>
                Ce fournisseur est réglé sur <code>duration={'{Infinity}'}</code> : rien ne se ferme
                tout seul, il faut la croix ou « Tout fermer ». Les trois boutons visent trois coins
                différents — les piles sont indépendantes.
              </>
            }
          >
            <ToastPositionScene />
          </Specimen>
        </>
      }
      props={
        <>
          <PropsTable
            id="toast"
            title="L’interface — le fournisseur et le hook"
            note={
              <>
                <code>ToastProvider</code> est un composant de configuration : ses cinq props sont
                les <em>défauts</em> de la file, et chaque appel à <code>showToast</code> peut les
                surcharger.{' '}
                <strong>
                  Cette file n’exporte aucun composant <code>Toast</code>
                </strong>{' '}
                — sa carte est interne et n’est atteignable que par <code>showToast</code>. Le{' '}
                <code>Opale.Toast</code> que publie le paquet est un composant à part, rendu en
                place : il n’est pas la carte de cette file.
              </>
            }
            rows={PROPS}
          />
        </>
      }
      states={[
        {
          state: 'error',
          description: (
            <>
              Les tons <code>warning</code> et <code>error</code> entrent dans la région assertive{' '}
              <code>role=&quot;alert&quot;</code> de leur coin ; les autres dans la région polie{' '}
              <code>role=&quot;status&quot;</code>.
            </>
          ),
        },
      ]}
      accessibility={{
        keyboard: [
          <>
            Le focus n’est jamais déplacé vers un toast. La croix est un <code>&lt;button&gt;</code>{' '}
            natif.
          </>,
          <>
            La minuterie se met en pause au survol et dès que le focus entre dans la carte, puis
            reprend le temps restant.
          </>,
        ],
        semantics: [
          <>
            Chaque coin porte deux régions live vides, montées avec le fournisseur :{' '}
            <code>role=&quot;status&quot;</code> (<code>aria-live=&quot;polite&quot;</code>) et{' '}
            <code>role=&quot;alert&quot;</code> (<code>aria-live=&quot;assertive&quot;</code>),
            toutes deux <code>aria-atomic=&quot;false&quot;</code>.
          </>,
          <>
            La croix est nommée « Fermer la notification » (<code>labels.close</code>) ; son glyphe
            est <code>aria-hidden</code>.
          </>,
          <>
            Le portail reste actif et audible pendant qu’une <code>Modal</code> est ouverte.
          </>,
          <>
            Sous <code>prefers-reduced-motion</code>, glissements et mise à l’échelle deviennent des
            fondus.
          </>,
        ],
      }}
      limits={[
        <>
          Dans un même coin, les messages urgents se groupent entre eux au lieu de suivre l’ordre
          d’arrivée.
        </>,
        <>
          <kbd>Échap</kbd> ne ferme pas un toast ; seule la croix, la minuterie ou{' '}
          <code>dismissToast</code> le font.
        </>,
        <>
          <code>useToast</code> jette hors d’un <code>ToastProvider</code>.
        </>,
      ]}
    />
  );
}
