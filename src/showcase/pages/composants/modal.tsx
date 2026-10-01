import { Specimen } from '../../section';
import { PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { COMPONENT_ALTERNATIVES } from '../component-alternatives';
import { ComponentPageLayout } from '../component-page';
import { ModalScene } from './scenes';
import { MaterialSwitch, PlainStage } from './material-switch';
import { StageGroundNote } from './stage';

const USAGE = `import { Button, Modal } from '@thomascaron/opale-ui';

const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Ouvrir</Button>

<Modal
  open={open}
  onOpenChange={setOpen}
  title="Supprimer l'étape ?"
  description="Cette action est définitive."
  footer={<Button variant="danger">Supprimer</Button>}
>
  Kyoto, trois jours, douze photos.
</Modal>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'open',
    type: 'boolean',
    required: true,
    description: (
      <>
        <strong>Aucun état interne.</strong> À <code>false</code>, le composant rend{' '}
        <code>null</code> — il n’y a rien dans le DOM, pas même un nœud caché.
      </>
    ),
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description: (
      <>
        Appelée avec <code>false</code> sur Échap, le voile ou la croix.{' '}
        <strong>Sa présence conditionne le bouton de fermeture</strong> — sans elle, la croix n’est
        pas rendue. <code>onClose()</code>, déprécié depuis 2.6, est encore appelé après elle.
      </>
    ),
  },
  {
    name: 'title / description',
    type: 'ReactNode',
    description: (
      <>
        Rendus dans un <code>&lt;h2&gt;</code> et un <code>&lt;p&gt;</code>, et{' '}
        <strong>c’est leur présence qui câble le nom accessible</strong> :{' '}
        <code>aria-labelledby</code> et <code>aria-describedby</code> ne sont posés que si la prop
        correspondante existe. Un modal sans <code>title</code> reste nommable à la main — un{' '}
        <code>aria-label</code> ou un <code>aria-labelledby</code> passé au composant l’emporte sur
        le câblage automatique. Sans ni l’un ni l’autre, c’est un{' '}
        <code>role=&quot;dialog&quot;</code> anonyme.
      </>
    ),
  },
  {
    name: 'footer',
    type: 'ReactNode',
    description: 'Rendu dans son propre bloc, sous le corps. Aucune disposition imposée.',
  },
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: (
      <>
        La largeur maximale, sur l’échelle commune de la librairie. Les anciens crans{' '}
        <code>sm</code>/<code>md</code>/<code>lg</code> restent acceptés.
      </>
    ),
  },
  {
    name: 'closeOnOverlay / closeOnEsc',
    type: 'boolean',
    defaultValue: 'true / true',
    description: (
      <>
        Le clic sur le voile, et la touche <kbd>Échap</kbd>. L’écoute d’<kbd>Échap</kbd> est posée
        sur <code>window</code> et retirée au démontage.
      </>
    ),
  },
  {
    name: 'lockScroll',
    type: 'boolean',
    defaultValue: 'true',
    description: (
      <>
        Pose <code>overflow: hidden</code> sur <code>document.body</code> et{' '}
        <strong>restaure la valeur précédente</strong> au nettoyage — pas une remise à zéro aveugle.
      </>
    ),
  },
  {
    name: 'portalContainer',
    type: 'HTMLElement | null',
    defaultValue: 'document.body',
    description: (
      <>
        L’hôte du portail, <strong>résolu pendant le rendu</strong> et non après un effet :{' '}
        <code>document.body</code> ne demande pas d’être monté, il demande d’exister. Un{' '}
        <code>open</code> à <code>true</code> au premier rendu peint donc le modal tout de suite. Là
        où il n’y a pas de DOM du tout, le composant rend <code>null</code>.
      </>
    ),
  },
  {
    name: 'labels',
    type: 'Partial<ModalLabels>',
    defaultValue: "{ close: 'Fermer' }",
    description: (
      <>
        Les textes de l’interface, clé par clé : une clé omise garde son défaut français. Un{' '}
        <code>aria-label</code> passé au composant l’emporte toujours.
      </>
    ),
  },
];

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `modal.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function ModalContent() {
  return (
    <ComponentPageLayout
      id="modal"
      imports={['Modal']}
      alternative={COMPONENT_ALTERNATIVES['composants/modal']}
      demo={
        <Specimen
          title="Les trois tailles"
          note={
            <>
              Le modal est portaillé dans <code>document.body</code> : il se peint par-dessus la
              vitrine entière, sur son propre voile. La scène ne porte que les déclencheurs.{' '}
              <StageGroundNote />
            </>
          }
        >
          <MaterialSwitch name="Modal">
            {(liquidGlass) => (
              <>
                <ModalScene liquidGlass={liquidGlass} size="small" label="Ouvrir — small" />
                <ModalScene liquidGlass={liquidGlass} size="medium" label="Ouvrir — medium" />
                <ModalScene liquidGlass={liquidGlass} size="large" label="Ouvrir — large" />
              </>
            )}
          </MaterialSwitch>
        </Specimen>
      }
      examples={
        <>
          <UsageBlock label="Import et appels représentatifs de Modal" code={USAGE} />
          <Specimen
            title="Sans Échap, sans voile — la croix seule"
            note={
              <>
                Ce modal refuse <kbd>Échap</kbd> et le clic sur le voile. La croix reste, parce
                qu’un <code>onOpenChange</code> est passé : les trois sorties sont optionnelles.
              </>
            }
          >
            <PlainStage>
              <ModalScene closeOnEsc={false} closeOnOverlay={false} label="Ouvrir — croix seule" />
            </PlainStage>
          </Specimen>
        </>
      }
      props={
        <>
          <PropsTable
            id="modal"
            note={
              <>
                Les attributs natifs d’un <code>&lt;div&gt;</code>, <code>ref</code> comprise, plus
                les props ci-dessous. Le composant intercepte <code>onClick</code> et{' '}
                <code>onKeyDown</code> puis rappelle les vôtres. <code>role</code>,{' '}
                <code>aria-modal</code> et <code>tabIndex</code> sont appliqués <em>après</em> vos
                props et ne se surchargent pas ; le nom accessible reste à vous.
              </>
            }
            rows={PROPS}
          />
        </>
      }
      accessibility={{
        keyboard: [
          <>
            <kbd>Échap</kbd> ferme le modal (<code>onOpenChange(false)</code>) tant que{' '}
            <code>closeOnEsc</code> est vrai ; l’écoute est posée sur <code>window</code>.
          </>,
          <>
            Le focus est piégé : <kbd>Tab</kbd> depuis le dernier élément revient au premier,{' '}
            <kbd>Maj+Tab</kbd> depuis le premier repart au dernier.
          </>,
          <>
            Le focus va au panneau à l’ouverture, et revient à l’élément qui l’avait à la fermeture
            comme au démontage.
          </>,
        ],
        semantics: [
          <>
            Le panneau porte <code>role=&quot;dialog&quot;</code>,{' '}
            <code>aria-modal=&quot;true&quot;</code> et <code>tabIndex={'{-1}'}</code>.
          </>,
          <>
            <code>aria-labelledby</code> vise le <code>&lt;h2&gt;</code> de <code>title</code>,{' '}
            <code>aria-describedby</code> le <code>&lt;p&gt;</code> de <code>description</code> ; un{' '}
            <code>aria-label</code> ou un <code>aria-labelledby</code> passé l’emporte.
          </>,
          <>
            La croix est nommée « Fermer » (<code>labels.close</code>) et n’est rendue qu’avec{' '}
            <code>onOpenChange</code>.
          </>,
          <>
            Pendant l’ouverture, les frères du portail, jusqu’à <code>&lt;body&gt;</code>, reçoivent{' '}
            <code>inert</code> et <code>aria-hidden</code>, puis retrouvent leur valeur ; les toasts
            de <code>ToastProvider</code> restent actifs.
          </>,
          <>
            Le voile est <code>aria-hidden</code>. Sous <code>prefers-reduced-motion</code>,
            l’entrée du panneau devient un simple fondu.
          </>,
        ],
      }}
      limits={[
        <>
          Ce n’est pas un <code>&lt;dialog&gt;</code> natif : couche supérieure, annulation par{' '}
          <kbd>Échap</kbd> et inertie sont reconstruites en JavaScript. Un ancêtre transformé ou un{' '}
          <code>z-index</code> plus haut chez l’hôte peut passer devant.
        </>,
        <>
          Le titre est toujours un <code>&lt;h2&gt;</code>. Sans <code>title</code> ni nom passé, le
          dialogue est anonyme.
        </>,
        <>
          Le piège de focus ne filtre ni les éléments masqués ni les éléments <code>inert</code>.
        </>,
      ]}
    />
  );
}
