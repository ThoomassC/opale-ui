import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { ModalScene } from './scenes';
import { MagicGroundNote, MagicPreamble, MagicStage } from './stage';

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
        correspondante existe. Un modal sans <code>title</code> est un{' '}
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
        L’hôte du portail. Le composant attend d’être monté avant de le résoudre, pour rester
        rendable côté serveur.
      </>
    ),
  },
];

export const modalPage: DocPage = {
  slug: 'composants/modal',
  label: 'Modal',
  group: 'composants',
  title: 'Modal',
  lede: (
    <>
      Une boîte de dialogue de verre, portaillée dans <code>document.body</code>. C’est le composant
      le plus outillé de la librairie après <code>Tabs</code> : <code>role=&quot;dialog&quot;</code>
      , <code>aria-modal</code>, identifiants par <code>useId</code>, verrou de défilement qui
      restaure la valeur précédente, fermeture par <kbd>Échap</kbd> et par le voile, focus donné au
      panneau à l’ouverture.
    </>
  ),
  render: () => (
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
        <MagicStage>
          <ModalScene size="sm" label="Ouvrir — sm" />
          <ModalScene size="md" label="Ouvrir — md" />
          <ModalScene size="lg" label="Ouvrir — lg" />
        </MagicStage>
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
        <MagicStage>
          <ModalScene closeOnEsc={false} closeOnOverlay={false} label="Ouvrir — croix seule" />
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-modal"
        note={
          <>
            <code>ComponentPropsWithoutRef&lt;&apos;div&apos;&gt;</code> plus onze props propres,
            plus <code>GlassProps</code>. Le composant intercepte <code>onClick</code> pour arrêter
            la propagation sur le panneau, puis rappelle le vôtre.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Le piège du montage, et il est réel.</strong> Le composant attend deux effets avant
        de rendre quoi que ce soit — un pour <code>mounted</code>, un pour le conteneur de portail —
        donc <code>open</code> à <code>true</code> au premier rendu n’affiche <em>rien</em> avant le
        premier passage des effets. Sous un test qui rend puis assère aussitôt sans laisser tourner
        les effets, le modal est absent. Les deux <code>setState</code> en corps d’effet sont
        d’ailleurs ce que masque le seul <code>eslint-disable</code> de ce fichier.
      </p>

      <p className="tc-doc-prose">
        <strong>Ce qui manque au motif de dialogue.</strong> Le focus est donné au panneau à
        l’ouverture, mais il n’y est pas <em>piégé</em> : la tabulation sort du modal et repart dans
        la page derrière, qui n’est ni <code>inert</code> ni <code>aria-hidden</code>. Et le focus
        n’est pas rendu au déclencheur à la fermeture. Un <code>&lt;dialog&gt;</code> natif avec{' '}
        <code>showModal()</code> donnerait les deux ; ici, c’est à l’appelant.
      </p>

      <p className="tc-doc-prose">
        <strong>
          Ce modal est le seul de la librairie, et il n’est pas un <code>&lt;dialog&gt;</code>.
        </strong>{' '}
        La 1.0 ne publiait pas de dialogue non plus — son <code>Backdrop</code> était un décor, pas
        une couche modale — mais elle ne prétendait rien. Ici le composant s’annonce comme un modal
        sans en donner les deux garanties du natif : le piège de focus et la restitution du focus au
        déclencheur restent à la charge de l’appelant, comme dit ci-dessus.
      </p>
    </PageBody>
  ),
};
