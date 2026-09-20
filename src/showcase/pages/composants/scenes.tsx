import { useState } from 'react';

import { UI_VERSION } from '../../version';

import {
  Opale,
  Checkbox,
  Modal,
  Select,
  Sidebar,
  Slider,
  Switch,
  Tabs,
  ToastProvider,
  useToast,
} from '../../../magic';
import type { SelectOption, ToastDefinition } from '../../../magic';

import { MagicCell, MagicStage } from './stage';

/* =============================================================================
   LES SCÈNES QUI ONT UN ÉTAT.

   POURQUOI CE FICHIER EXISTE, ET NON UN COMPOSANT PAR PAGE. Deux raisons, dans
   cet ordre.

   1. UN HOOK NE PEUT PAS VIVRE DANS `render()`. Le registre appelle
      `page.render()` depuis un composant de la coquille (`PageContent` dans
      `doc-shell.tsx`) : un `useState` écrit là serait un état DE LA COQUILLE,
      remis à zéro à chaque navigation et partagé avec les autres pages. Un
      composant est donc obligatoire dès qu'une scène est jouable.

   2. UN COMPOSANT DÉCLARÉ DANS UN FICHIER DE PAGE FAIT ROUGIR LE LINTER.
      `react-refresh/only-export-components` refuse un fichier qui déclare des
      composants et n'exporte qu'un objet — ce qu'est exactement un fichier de
      page, dont l'unique export est son `DocPage`. Mesuré : treize
      avertissements avant ce fichier, zéro après.

   NE VIENNENT ICI QUE LES SCÈNES RÉELLEMENT JOUABLES. Une scène figée — les
   deux apparences d'un contrôle désactivé, par exemple — reste du JSX écrit
   dans sa page : elle n'a pas d'état, donc elle n'a pas besoin d'être un
   composant, et la garder sur place la garde lisible à côté de sa prose.

   Les huit composants ci-dessous sont, à une exception près, la liste des
   composants de `/magic` SANS ÉTAT INTERNE : `Checkbox`, `Select`, `Slider`,
   `Switch` et `Modal` sont toujours contrôlés, et `Toast` exige un fournisseur.
   `Tabs` et `Sidebar` savent se piloter seuls — leurs scènes contrôlées sont
   ici pour MONTRER l'autre mode, pas parce qu'il le faut.
   ========================================================================== */

/** Les trois crans de `Checkbox`, chacun avec son propre état. */
export function CheckboxSizeScene() {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    small: false,
    medium: true,
    large: false,
  });

  return (
    <MagicStage>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <MagicCell key={size} label={<code>size=&quot;{size}&quot;</code>}>
          {/* `typeof next === 'boolean'` N'EST PAS DE LA PRUDENCE DÉCORATIVE.
              `CheckboxProps` déclare `onChange?: (checked: boolean) => void`
              PUIS intersecte `GlassProps`, qui apporte le `onChange` de React
              (`ChangeEventHandler<HTMLDivElement>`). TypeScript intersecte les
              deux signatures, si bien que le paramètre arrive en
              `boolean | ChangeEvent<HTMLDivElement>` et qu'un `setChecked(next)`
              direct NE COMPILE PAS. À l'exécution le composant n'appelle jamais
              qu'avec un booléen : le garde est là pour le compilateur, et la
              collision est décrite dans la prose de la page. */}
          <Checkbox
            size={size}
            checked={checked[size] ?? false}
            onChange={(next) => {
              if (typeof next === 'boolean') setChecked((all) => ({ ...all, [size]: next }));
            }}
            label={`cran ${size}`}
            aria-label={`cran ${size}`}
          />
        </MagicCell>
      ))}
    </MagicStage>
  );
}

/** Les trois crans de `Select`. La scène est haute : le panneau se déploie. */
export function SelectSizeScene({ options }: { readonly options: readonly SelectOption[] }) {
  const [values, setValues] = useState<Record<string, string | undefined>>({
    small: undefined,
    medium: 'perou',
    large: undefined,
  });

  return (
    <MagicStage tall>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <MagicCell key={size} label={<code>size=&quot;{size}&quot;</code>}>
          {/* `[...options]` et non `options` : leur `SelectProps` déclare
              `options: SelectOption[]`, un tableau MUTABLE, donc un
              `readonly SelectOption[]` est refusé. Une copie, pas un `as`. */}
          <Select
            size={size}
            options={[...options]}
            value={values[size]}
            onChange={(next) => setValues((all) => ({ ...all, [size]: next }))}
            placeholder="Choisir un pays"
          />
        </MagicCell>
      ))}
    </MagicStage>
  );
}

/** Les trois crans de `Switch`. */
export function SwitchSizeScene() {
  const [active, setActive] = useState<Record<string, boolean>>({
    small: false,
    medium: true,
    large: false,
  });

  return (
    <MagicStage>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <MagicCell key={size} label={<code>size=&quot;{size}&quot;</code>}>
          <Switch
            size={size}
            isActive={active[size] ?? false}
            setIsActive={(next) => setActive((all) => ({ ...all, [size]: next }))}
            aria-label={`Interrupteur ${size}`}
          />
        </MagicCell>
      ))}
    </MagicStage>
  );
}

/**
 * Les trois crans de `Slider`.
 *
 * La valeur est affichée par la LÉGENDE de la figure et non par le composant :
 * sa prop `showValue` est déstructurée et jamais lue — elle n'a aucun effet.
 */
export function SliderSizeScene() {
  const [values, setValues] = useState<Record<string, number>>({
    small: 25,
    medium: 50,
    large: 75,
  });

  return (
    <MagicStage stack>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <MagicCell
          key={size}
          label={
            <>
              <code>size=&quot;{size}&quot;</code> — valeur {values[size]} (affichée par la légende,
              pas par le composant)
            </>
          }
        >
          <Slider
            size={size}
            value={values[size] ?? 50}
            onChange={(next) => setValues((all) => ({ ...all, [size]: next }))}
          />
        </MagicCell>
      ))}
    </MagicStage>
  );
}

/** Le pas de 25 : cinq valeurs émises, avec une poignée visuellement continue. */
export function SliderStepScene() {
  const [value, setValue] = useState(50);

  return (
    <MagicStage stack>
      <MagicCell
        label={
          <>
            <code>
              min={'{0}'} max={'{100}'} step={'{25}'}
            </code>{' '}
            — valeur {value}
          </>
        }
      >
        <Slider min={0} max={100} step={25} value={value} onChange={setValue} />
      </MagicCell>
      <MagicCell label={<code>disabled</code>}>
        <Slider disabled value={60} />
      </MagicCell>
    </MagicStage>
  );
}

/** La barre latérale pliable, contrôlée pour que son état soit affiché. */
export function SidebarCollapsibleScene() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState('etapes');

  return (
    <MagicStage tall>
      {/* `onToggle` NE PEUT PAS RECEVOIR `setCollapsed` DIRECTEMENT, et ce n'est
          pas un caprice du compilateur : `SidebarProps` déclare
          `onToggle?: (collapsed: boolean) => void` puis étend
          `ComponentPropsWithoutRef<'aside'>`, qui apporte le `onToggle` du DOM
          (`ToggleEventHandler`, l'événement de `<details>`). TypeScript
          intersecte les deux, donc le paramètre arrive en
          `boolean | ToggleEvent<HTMLElement>`. Même motif que
          `Checkbox.onChange`, décrit dans la prose des deux pages. */}
      <Sidebar
        collapsible
        collapsed={collapsed}
        onToggle={(next) => {
          if (typeof next === 'boolean') setCollapsed(next);
        }}
        activeItemId={active}
        onSelectItem={setActive}
      >
        <Sidebar.Header>
          {!collapsed && <strong>Voyage</strong>}
          <Sidebar.Toggle />
        </Sidebar.Header>

        <Sidebar.Items aria-label="Sections du voyage">
          <Sidebar.Item itemId="etapes" icon={<span aria-hidden="true">◆</span>}>
            Étapes
          </Sidebar.Item>
          {/* `badge` reçoit un `<span>` ET NON un `Badge` de /magic, à dessein.
              `Sidebar.Item` rend un `<button>`, et `Badge` passe par `Glass`,
              qui enveloppe toujours son contenu dans un `<div>` : ce serait un
              bloc dans un bouton, c'est-à-dire du HTML invalide — que ni
              TypeScript ni React ne signalent. Écrit dans la prose de la page. */}
          <Sidebar.Item itemId="carte" badge={<span>3</span>}>
            Carte
          </Sidebar.Item>
          <Sidebar.Item itemId="photos">Photos</Sidebar.Item>
          <Sidebar.Item itemId="brouillon" disabled>
            Brouillon
          </Sidebar.Item>
        </Sidebar.Items>

        <Sidebar.Footer>{collapsed ? '·' : `v${UI_VERSION}`}</Sidebar.Footer>
      </Sidebar>

      <p className="tc-doc-magicstage__label">
        Repliée : <code>{String(collapsed)}</code> — entrée retenue : <code>{active}</code>
      </p>
    </MagicStage>
  );
}

/** Les onglets en mode contrôlé, pour montrer que `onValueChange` remonte. */
export function TabsControlledScene() {
  const [value, setValue] = useState('carte');

  return (
    <MagicStage stack>
      <p className="tc-doc-magicstage__label">
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
    </MagicStage>
  );
}

export interface ModalSceneProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly closeOnOverlay?: boolean;
  readonly closeOnEsc?: boolean;
  /** Le libellé du déclencheur — c'est lui qu'on voit sur la scène. */
  readonly label: string;
}

/**
 * Un déclencheur, et son modal.
 *
 * LE MODAL SE PORTAILLE DANS `document.body`, DONC HORS DE LA SCÈNE. Il ne se
 * peint pas sur le dégradé de la page mais par-dessus la vitrine entière :
 * c'est son propre voile qui lui fait un fond sombre. C'est le seul composant
 * de `/magic` dont la lisibilité ne dépende pas de la mise en scène.
 */
export function ModalScene({
  size,
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
        onClose={() => setOpen(false)}
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
 * Un bouton qui empile un toast.
 *
 * IL DOIT ÊTRE UN COMPOSANT SÉPARÉ DU FOURNISSEUR, et ce n'est pas un choix de
 * style : `useToast` lit un contexte, donc il ne peut pas être appelé dans le
 * composant qui rend le `ToastProvider` — un fournisseur ne se consomme pas
 * lui-même. C'est la contrainte de montage que la page décrit, rendue
 * exécutable ici.
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

/** Les quatre variantes de toast, dans le coin par défaut. */
export function ToastVariantScene() {
  return (
    <ToastProvider duration={4000}>
      <MagicStage>
        <ToastTrigger
          label="default"
          toast={{ title: 'Brouillon enregistré', description: 'Il y a un instant.' }}
        />
        <ToastTrigger
          label="success"
          toast={{ variant: 'success', title: 'Étape publiée', description: 'Kyoto, 3 jours.' }}
        />
        <ToastTrigger
          label="error"
          toast={{ variant: 'error', title: 'Publication refusée', description: 'Titre manquant.' }}
        />
        <ToastTrigger
          label="info"
          toast={{ variant: 'info', title: 'Carte régénérée', description: '12 étapes.' }}
        />
        <ToastClear />
      </MagicStage>
    </ToastProvider>
  );
}

/** Trois coins, trois animations, et une durée infinie. */
export function ToastPositionScene() {
  return (
    <ToastProvider duration={Infinity} position="bottom-center" animation="slide-from-bottom">
      <MagicStage>
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
      </MagicStage>
    </ToastProvider>
  );
}
