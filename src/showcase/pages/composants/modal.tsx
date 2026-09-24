import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { ModalScene } from './scenes';
import { MaterialSwitch, PlainStage } from './material-switch';
import { MagicGroundNote, MagicPreamble } from './stage';

const USAGE = `import { Modal } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

const [open, setOpen] = useState(false);

<Button text="Ouvrir" onClick={() => setOpen(true)} />

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Supprimer l'étape ?"
  description="Cette action est définitive."
  footer={<Button variant="negative" text="Supprimer" />}
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
    name: 'onClose / onOpenChange',
    type: '() => void / (open: boolean) => void',
    description: (
      <>
        Les deux sont appelées à la fermeture, dans cet ordre : <code>onOpenChange(false)</code>{' '}
        puis <code>onClose()</code>.{' '}
        <strong>La présence de l’une des deux conditionne le bouton de fermeture</strong> — sans
        aucune des deux, la croix n’est pas rendue.
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
    type: "'sm' | 'md' | 'lg'",
    defaultValue: "'md'",
    description: (
      <>
        La largeur maximale. Noter que les crans s’écrivent ici <code>sm</code>/<code>md</code>/
        <code>lg</code> et non <code>small</code>/<code>medium</code>/<code>large</code> comme
        partout ailleurs dans la librairie.
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
];

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `modal.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function ModalContent() {
  return (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Modal" code={USAGE} />

      <Specimen
        title="Ce qu’il faut pour le monter — et les trois crans"
        note={
          <>
            <strong>
              Le modal est portaillé dans <code>document.body</code>, donc il ne se peint pas sur la
              scène ci-dessous : il se peint par-dessus la vitrine entière, et c’est son propre
              voile qui lui fait un fond sombre.
            </strong>{' '}
            La scène ne porte ici que les déclencheurs — et elle est sombre pour la même raison que
            les autres, parce que ce sont des boutons de la librairie. <MagicGroundNote />
          </>
        }
      >
        <MaterialSwitch name="Modal">
          {(liquidGlass) => (
            <>
              <ModalScene liquidGlass={liquidGlass} size="sm" label="Ouvrir — sm" />
              <ModalScene liquidGlass={liquidGlass} size="md" label="Ouvrir — md" />
              <ModalScene liquidGlass={liquidGlass} size="lg" label="Ouvrir — lg" />
            </>
          )}
        </MaterialSwitch>
      </Specimen>

      <Specimen
        title="Sans Échap, sans voile — la porte de sortie qui reste"
        note={
          <>
            Ce modal refuse <kbd>Échap</kbd> et le clic sur le voile. Il reste la croix, et elle
            n’est là que parce qu’un <code>onClose</code> est passé : les trois portes de sortie
            sont toutes optionnelles, et rien n’empêche d’en fermer les trois.
          </>
        }
      >
        <PlainStage>
          <ModalScene closeOnEsc={false} closeOnOverlay={false} label="Ouvrir — croix seule" />
        </PlainStage>
      </Specimen>

      <PropsTable
        id="magic-modal"
        note={
          <>
            <code>ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;</code> plus onze props propres,
            plus <code>GlassProps</code>. Le composant intercepte <code>onClick</code> et{' '}
            <code>onKeyDown</code> — le premier pour arrêter la propagation sur le panneau, le
            second pour le piège de focus — puis rappelle les vôtres.{' '}
            <strong>Les attributs qui portent le contrat de dialogue sont inécrasables :</strong>{' '}
            <code>role</code>, <code>aria-modal</code> et <code>tabIndex</code> sont appliqués{' '}
            <em>après</em> vos props et ne se surchargent plus — les poser cassait le motif entier
            en silence. Le nom accessible, lui, reste à vous.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Le piège du montage a disparu, et c’est ce qui a motivé la réécriture.</strong> La
        version d’avant attendait <em>deux</em> effets avant de rendre quoi que ce soit — un pour un
        drapeau <code>mounted</code>, un pour le conteneur de portail —, donc <code>open</code> à{' '}
        <code>true</code> au premier rendu n’affichait rien avant le premier passage des effets. Ce
        n’était pas un détail de cycle de vie : sous un test qui rendait puis assérait aussitôt, le
        modal était simplement absent. Le conteneur se résout désormais pendant le rendu, et les
        deux <code>setState</code> en corps d’effet — avec l’<code>eslint-disable</code> qui les
        couvrait — n’existent plus.
      </p>

      <p className="tc-doc-prose">
        <strong>Le motif de dialogue est maintenant complet, et voici ce que ça recouvre.</strong>{' '}
        Le focus part au panneau à l’ouverture, il y est <em>piégé</em> — <kbd>Tab</kbd> depuis le
        dernier élément revient au premier, <kbd>Maj+Tab</kbd> depuis le premier repart au dernier —
        et il est <strong>rendu au déclencheur</strong> à la fermeture comme au démontage. Un
        dialogue qui ne le rend pas renvoie le focus sur <code>&lt;body&gt;</code> : la tabulation
        suivante repart du haut de la page, et qui navigue au clavier perd sa place à chaque
        fermeture. Enfin, <code>aria-modal</code> <em>déclare</em> que le reste de la page est
        hors-jeu sans le <em>faire</em> : les frères du conteneur de portail, à chaque niveau
        jusqu’à <code>&lt;body&gt;</code>, reçoivent donc <code>inert</code> et{' '}
        <code>aria-hidden</code> le temps de l’ouverture, et retrouvent exactement leur valeur
        précédente ensuite.
      </p>

      <p className="tc-doc-prose">
        <strong>
          Ce n’est toujours pas un <code>&lt;dialog&gt;</code> natif, et il faut dire ce qui reste
          en moins.
        </strong>{' '}
        <code>showModal()</code> donne gratuitement la couche supérieure du navigateur — un modal
        s’y peint au-dessus de tout, quels que soient les <code>z-index</code> et les contextes
        d’empilement de l’hôte —, l’annulation par <kbd>Échap</kbd> gérée par la plateforme, et une
        inertie que rien dans la page ne peut contourner. Ici tout cela est reconstruit en
        JavaScript, donc tout cela peut être défait par l’hôte : un ancêtre transformé déplace le
        portail, un <code>z-index</code> plus haut passe devant. Le motif d’accessibilité, lui,
        n’est plus à la charge de l’appelant.
      </p>
    </PageBody>
  );
}
