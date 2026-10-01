import { useState } from 'react';

import { UI_VERSION } from '../../version';

import { Modal, Opale, Sidebar, Tabs, ToastProvider, useToast } from '../../../opale';
import type { OpaleIconName, OpaleSize, ToastDefinition } from '../../../opale';

import { MaterialSwitch, PlainStage } from './material-switch';

/* Les scènes jouables, en composants : un hook ne peut pas vivre dans
   `page.render()`, et un fichier de page n'exporte que son `DocPage`
   (`react-refresh/only-export-components`). Une scène figée reste en JSX dans
   sa page. `Tabs` et `Sidebar` sont montrés ici en mode contrôlé ; `Modal` et
   `Toast` exigent un état ou un fournisseur. */

/* L'icône d'une entrée du rail, par la prop publique de `Opale.Icon` ; la
   classe lui fait suivre la taille et l'encre de l'entrée. */
function SceneGlyph({ name }: { name: OpaleIconName }) {
  return <Opale.Icon name={name} className="tc-doc-sidebar-glyph" />;
}

/** La barre latérale pliable, contrôlée pour que son état soit affiché. */
/* L'état vit au-dessus du commutateur de matériau : les deux matériaux se
   comparent sur le même état. */
export function SidebarCollapsibleScene() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState('etapes');

  return (
    <MaterialSwitch name="Sidebar pliable" tall>
      {(liquidGlass) => (
        <>
          {/* `onCollapsedChange` et `onValueChange` reçoivent chacun un
          `setState` tel quel : le pli arrive en `boolean`, l'entrée en
          identifiant. */}
          <Sidebar
            aria-label="Voyage, menu pliable"
            liquidGlass={liquidGlass}
            collapsible
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            value={active}
            onValueChange={setActive}
          >
            <Sidebar.Header>
              {!collapsed && <strong>Voyage</strong>}
              <Sidebar.Toggle />
            </Sidebar.Header>

            <Sidebar.Items aria-label="Sections du voyage">
              <Sidebar.Item itemId="etapes" icon={<SceneGlyph name="map-pin" />}>
                Étapes
              </Sidebar.Item>
              {/* `badge` reçoit un `<span>` NU, à dessein. `Sidebar.Item` rend un
              `<button>` : un `Opale.Badge` sans verre y tiendrait (c'est un
              `<span>`), mais le même sous `liquidGlass` passe par `Glass`, et
              `Glass` — le nôtre — enveloppe TOUJOURS son contenu dans un
              `<div>`, quel que soit le `as` demandé : l'enveloppe qui porte les
              trois couches est un bloc, seul le contenu suit `as`. Un bloc dans
              un bouton, c'est du HTML invalide, que ni TypeScript ni React ne
              signalent. Le `<span>` écrit ici ne dépend d'aucune prop. Écrit
              dans la prose de la page. */}
              <Sidebar.Item itemId="carte" icon={<SceneGlyph name="map" />} badge={<span>3</span>}>
                Carte
              </Sidebar.Item>
              <Sidebar.Item itemId="photos" icon={<SceneGlyph name="image" />}>
                Photos
              </Sidebar.Item>
              <Sidebar.Item itemId="brouillon" icon={<SceneGlyph name="file-text" />} disabled>
                Brouillon
              </Sidebar.Item>
            </Sidebar.Items>

            {/* LE PIED N'EXISTE QUE DÉPLIÉ. Replié, il peignait un point médian
            seul sous les vignettes : un signe orphelin, sans nom ni
            information, que rien ne rattachait à la version qu'il remplaçait. */}
            {!collapsed && <Sidebar.Footer>v{UI_VERSION}</Sidebar.Footer>}
          </Sidebar>

          <p className="tc-doc-stage__label">
            Repliée : <code>{String(collapsed)}</code> — entrée retenue : <code>{active}</code>
          </p>
        </>
      )}
    </MaterialSwitch>
  );
}

/** Les onglets en mode contrôlé, pour montrer que `onValueChange` remonte. */
export function TabsControlledScene() {
  const [value, setValue] = useState('carte');

  return (
    <PlainStage stack>
      <p className="tc-doc-stage__label">
        Onglet retenu par l’appelant : <code>{value}</code>
      </p>
      <Tabs value={value} onValueChange={setValue} activationMode="manual">
        <Tabs.List>
          <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
          <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
          <Tabs.Trigger value="photos">Photos</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="etapes">Les étapes du voyage, dans l’ordre.</Tabs.Content>
        <Tabs.Content value="carte">La carte, rendue côté serveur.</Tabs.Content>
        <Tabs.Content value="photos">Les photos, une par étape.</Tabs.Content>
      </Tabs>
    </PlainStage>
  );
}

export interface ModalSceneProps {
  readonly size?: OpaleSize;
  /** La matière du panneau. Originale par défaut, comme partout ailleurs. */
  readonly liquidGlass?: boolean;
  readonly closeOnOverlay?: boolean;
  readonly closeOnEsc?: boolean;
  /** Le libellé du déclencheur — c'est lui qu'on voit sur la scène. */
  readonly label: string;
}

/**
 * Un déclencheur, et son modal. Le modal se portaille dans `document.body` et
 * porte son propre voile : sa lisibilité ne dépend pas de la scène.
 */
export function ModalScene({
  size,
  liquidGlass = false,
  closeOnOverlay = true,
  closeOnEsc = true,
  label,
}: ModalSceneProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Opale.Button onClick={() => setOpen(true)}>{label}</Opale.Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        liquidGlass={liquidGlass}
        size={size}
        closeOnOverlay={closeOnOverlay}
        closeOnEsc={closeOnEsc}
        title="Supprimer l’étape ?"
        description="Cette action est définitive."
        footer={
          <>
            <Opale.Button size="small" onClick={() => setOpen(false)}>
              Annuler
            </Opale.Button>
            <Opale.Button size="small" variant="danger" onClick={() => setOpen(false)}>
              Supprimer
            </Opale.Button>
          </>
        }
      >
        Kyoto, trois jours, douze photos.
        {closeOnEsc ? '' : ' Échap ne ferme pas ce modal.'}
        {closeOnOverlay ? '' : ' Le voile ne le ferme pas non plus.'}
      </Modal>
    </>
  );
}

/**
 * Un bouton qui empile un toast, séparé du fournisseur : `useToast` lit le
 * contexte que `ToastProvider` fournit à ses descendants.
 */
function ToastTrigger({
  label,
  toast,
}: {
  readonly label: string;
  readonly toast: ToastDefinition;
}) {
  const { showToast } = useToast();

  return (
    <Opale.Button size="small" onClick={() => showToast(toast)}>
      {label}
    </Opale.Button>
  );
}

/** Le bouton qui vide la file — même contrainte de contexte. */
function ToastClear() {
  const { clearToasts } = useToast();

  return (
    <Opale.Button size="small" onClick={() => clearToasts()}>
      Tout fermer
    </Opale.Button>
  );
}

/** Les cinq variantes de toast, dans le coin par défaut. */
export function ToastVariantScene({ liquidGlass = false }: { liquidGlass?: boolean }) {
  return (
    /* PAS DE SCÈNE ICI : `MaterialSwitch` pose la sienne, et elle change avec
       la matière — le paysage sous le verre, la surface unie sous l'original.
       En garder une seconde à l'intérieur les emboîtait l'une dans l'autre. */
    <ToastProvider liquidGlass={liquidGlass}>
      <div className="tc-doc-opale-scenerow">
        <ToastTrigger
          label="neutral"
          toast={{ title: 'Brouillon enregistré', description: 'Il y a un instant.' }}
        />
        <ToastTrigger
          label="success"
          toast={{ tone: 'success', title: 'Étape publiée', description: 'Kyoto, 3 jours.' }}
        />
        <ToastTrigger
          label="warning"
          toast={{
            tone: 'warning',
            title: 'Carte non régénérée',
            description: 'Les étapes ont bougé depuis.',
          }}
        />
        <ToastTrigger
          label="error"
          toast={{ tone: 'error', title: 'Publication refusée', description: 'Titre manquant.' }}
        />
        <ToastTrigger
          label="info"
          toast={{ tone: 'info', title: 'Carte régénérée', description: '12 étapes.' }}
        />
        <ToastClear />
      </div>
    </ToastProvider>
  );
}

/** Trois coins, trois animations, et une durée infinie. */
export function ToastPositionScene() {
  return (
    <ToastProvider duration={Infinity} position="bottom-center" animation="slide-from-bottom">
      <PlainStage>
        <ToastTrigger
          label="bottom-center (défaut de cette scène)"
          toast={{ title: 'bottom-center', description: 'duration: Infinity' }}
        />
        <ToastTrigger
          label="top-left, slide-from-left"
          toast={{
            title: 'top-left',
            description: 'slide-from-left',
            position: 'top-left',
            animation: 'slide-from-left',
          }}
        />
        <ToastTrigger
          label="top-right, scale"
          toast={{
            title: 'top-right',
            description: 'scale',
            position: 'top-right',
            animation: 'scale',
          }}
        />
        <ToastClear />
      </PlainStage>
    </ToastProvider>
  );
}
