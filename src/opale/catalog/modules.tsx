/* Les modules du catalogue : fichiers, dépôt, visionneuse, presse-papier. */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type RefCallback,
} from 'react';
import clsx from 'clsx';

import Glass from '../components/glass/Glass';
import { GLYPH_FILE } from '../components/icon/glyphs';
import { IconPaths } from '../components/icon/IconPaths';
import { Modal, type ModalLabels } from '../components/modal';
import { warnDeprecatedProps } from '../deprecations';
import { resolveLabels } from '../shared/labels';
import { mergeRefs } from '../shared/merge-refs';
import { Button, type ButtonLabels, type ButtonProps } from './forms';
import { closeHandler, closeClickHandler } from './close-handlers';

/** Les textes de `FileCard`. */
export interface FileCardLabels {
  /**
   * Dit la sélection d'une carte non cliquable, qui n'a pas d'`aria-pressed`
   * pour l'annoncer. Défaut : « Sélectionné ».
   */
  selected: string;
}

const DEFAULT_FILE_CARD_LABELS: FileCardLabels = { selected: 'Sélectionné' };

/**
 * Les props de `FileCard`. La coquille est un `<button>` quand `onClick` est
 * passé, un `<div>` sinon : `ref` et les attributs visent donc un `HTMLElement`.
 */
export interface FileCardProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Le nom du fichier, affiché sur la carte. */
  name: string;
  /** Le poids du fichier, tel qu'il s'affiche : « 2 Mo ». */
  fileSize?: string;
  /**
   * @deprecated Depuis 2.10 — utilisez `fileSize`. Partout ailleurs dans Opale,
   * `size` est l'échelle `OpaleSize` ; ici c'était le poids du fichier.
   */
  size?: string;
  /** La carte est retenue, annoncée `aria-pressed` quand elle est cliquable. Défaut : `false`. */
  selected?: boolean;
  /** Rend la carte cliquable : la coquille devient un `<button>`. Absente, un `<div>`. */
  onClick?: () => void;
  /** Rend la carte dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<FileCardLabels>;
  /** La référence de la coquille, `<button>` ou `<div>` selon `onClick`. */
  ref?: Ref<HTMLElement>;
}

export function FileCard({
  name,
  fileSize,
  size,
  selected = false,
  onClick,
  liquidGlass = false,
  labels: labelsProp,
  className,
  ref,
  ...rest
}: FileCardProps) {
  warnDeprecatedProps('FileCard', { size });
  /* `fileSize` gagne ; l'ancien `size` ne sert que s'il est seul. */
  const weight = fileSize ?? size;
  const labels = resolveLabels(DEFAULT_FILE_CARD_LABELS, labelsProp);
  /* Une ref d'`HTMLElement` ne se pose pas telle quelle sur un `<button>` : la
     fonction qui l'enveloppe, elle, convient aux deux balises. */
  const shellRef = useCallback((node: HTMLElement | null) => mergeRefs(ref)(node), [ref]);
  return (
    /* `aria-pressed` ET UNE CLASSE PROPRE, À LA PLACE DU LAVIS.

       La sélection n'était signalée que par `.opale-liquid` — l'ancienne
       imitation du verre, détournée en surbrillance. Deux défauts pour le
       prix d'un : un lecteur d'écran ne pouvait pas dire quelles cartes
       étaient choisies (WCAG 4.1.2), et l'information n'existait que par la
       couleur (1.4.1). La classe dédiée porte un liseré et une coche ; l'état
       est désormais annoncé. */
    <FileCardShell
      {...rest}
      shellRef={shellRef}
      liquidGlass={liquidGlass}
      className={clsx(
        'opale-surface',
        liquidGlass && 'opale-surface--glass',
        'opale-file-card',
        selected && 'opale-file-card--selected',
        className,
      )}
      selected={selected}
      onClick={onClick}
    >
      <IconPaths paths={GLYPH_FILE} className="opale-file-card__icon" />
      <span className="opale-file-card__text">
        <strong>{name}</strong>
        {weight && <small className="opale-field__helper">{weight}</small>}
        {selected && !onClick && <span className="opale-visually-hidden">{labels.selected}</span>}
      </span>
    </FileCardShell>
  );
}

/**
 * La coquille de la carte de fichier, dans l'une ou l'autre matière.
 *
 * `Glass as="button"` REND LE BOUTON SUR SA COUCHE DE CONTENU : `aria-pressed`
 * et le gestionnaire de clic restent donc sur le MÊME nœud que dans le rendu
 * original. C'est la règle de tout ce fichier — le contrat d'accessibilité ne
 * dépend pas de l'apparence.
 */
function FileCardShell({
  liquidGlass,
  children,
  selected,
  onClick,
  shellRef,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, 'onClick'> & {
  liquidGlass: boolean;
  className: string;
  selected: boolean;
  onClick?: () => void;
  shellRef: RefCallback<HTMLElement>;
  children: ReactNode;
}) {
  if (liquidGlass) {
    return onClick ? (
      <Glass
        {...props}
        ref={shellRef}
        as="button"
        type="button"
        rootClassName="opale-file-card--glass-root"
        aria-pressed={selected}
        onClick={onClick}
      >
        {children}
      </Glass>
    ) : (
      <Glass {...props} ref={shellRef} as="div" rootClassName="opale-file-card--glass-root">
        {children}
      </Glass>
    );
  }

  return onClick ? (
    <button {...props} ref={shellRef} type="button" aria-pressed={selected} onClick={onClick}>
      {children}
    </button>
  ) : (
    <div {...props} ref={shellRef}>
      {children}
    </div>
  );
}
/** Les textes de `Dropzone`. */
export interface DropzoneLabels {
  /** L'invite, quand `children` n'est pas passé. Défaut : « Ajoutez vos fichiers ». */
  prompt: string;
  /** Défaut : « Sélectionner des fichiers ». */
  select: string;
  /** Défaut : « Sélection désactivée ». */
  disabled: string;
  /** Défaut : « Sélectionnez au maximum 2 fichiers. ». */
  tooManyFiles: (maxFiles: number) => string;
  /** Défaut : « Un fichier dépasse la taille maximale de 1024 octets. ». */
  fileTooLarge: (maxSizeBytes: number) => string;
  /** Défaut : « Le type d’un fichier n’est pas accepté. ». */
  typeRejected: string;
}

const DEFAULT_DROPZONE_LABELS: DropzoneLabels = {
  prompt: 'Ajoutez vos fichiers',
  select: 'Sélectionner des fichiers',
  disabled: 'Sélection désactivée',
  tooManyFiles: (maxFiles) =>
    `Sélectionnez au maximum ${maxFiles} fichier${maxFiles > 1 ? 's' : ''}.`,
  fileTooLarge: (maxSizeBytes) =>
    `Un fichier dépasse la taille maximale de ${maxSizeBytes} octets.`,
  typeRejected: 'Le type d’un fichier n’est pas accepté.',
};

/** Les props de `Dropzone`. `ref` et les attributs vont au `<label>` qui porte la zone. */
export interface DropzoneProps extends Omit<
  ComponentPropsWithRef<'label'>,
  'children' | 'onError'
> {
  /** Appelée avec les fichiers retenus, choisis ou déposés, une fois les contrôles passés. */
  onFiles?: (files: FileList) => void;
  /**
   * Appelée avec le message d'un refus (nombre, poids, type), aussi affiché et annoncé dans la
   * zone.
   */
  onError?: (message: string) => void;
  /** Le texte de la zone. Défaut : `labels.prompt`. */
  children?: ReactNode;
  /** Les types acceptés, au format de l'attribut natif : `image/*,.pdf`. Vérifié aussi au dépôt. */
  accept?: string;
  /**
   * Le nombre maximal de fichiers par sélection. Absent : aucune limite ; `1` avec
   * `multiple={false}`.
   */
  maxFiles?: number;
  /** Le poids maximal d'un fichier, en octets. Absent : aucune limite. */
  maxSizeBytes?: number;
  /** Rend la zone inactive : ni choix, ni dépôt. Défaut : `false`. */
  disabled?: boolean;
  /** Rend la zone dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /** Remplace les textes français par défaut, clé par clé. `children` gagne sur `labels.prompt`. */
  labels?: Partial<DropzoneLabels>;
  /**
   * Le nom de formulaire du champ de fichiers. Présent (ou avec `required`),
   * le champ GARDE les fichiers retenus — choisis ou déposés — jusqu'à la
   * soumission : un `<form>`, un `FormData` ou une Server Action les reçoit.
   * Chaque sélection remplace la précédente, comme sur un champ natif ; une
   * sélection refusée vide le champ.
   */
  name?: string;
  /** Plusieurs fichiers à la fois. Défaut : `true`. À `false`, un dépôt de plusieurs fichiers est refusé. */
  multiple?: boolean;
  /** Un fichier est exigé à la soumission du formulaire. */
  required?: boolean;
}

function fileMatchesAccept(file: File, accept: string): boolean {
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return rules.some((rule) =>
    rule.startsWith('.')
      ? name.endsWith(rule)
      : rule.endsWith('/' + '*')
        ? type.startsWith(rule.slice(0, -1))
        : type === rule,
  );
}

export function Dropzone({
  onFiles,
  onError,
  children,
  accept,
  maxFiles,
  maxSizeBytes,
  disabled = false,
  liquidGlass = false,
  labels: labelsProp,
  name,
  multiple = true,
  required,
  className,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...rest
}: DropzoneProps) {
  const Zone = liquidGlass ? Glass : 'label';
  const zoneProps = liquidGlass
    ? ({ as: 'label', rootClassName: 'opale-dropzone--glass-root' } as const)
    : {};
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const depth = useRef(0);
  const labels = resolveLabels(DEFAULT_DROPZONE_LABELS, labelsProp);
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  /* LE CHAMP GARDE SES FICHIERS DÈS QU'UN FORMULAIRE LES ATTEND : avec `name`,
     pour les soumettre ; avec `required`, pour que sa validation passe — vidé
     après chaque choix, un champ requis restait invalide et bloquait l'envoi
     pour toujours. Sans l'un ni l'autre, il est vidé comme en 2.9.1. */
  const keepsFiles = name !== undefined || Boolean(required);

  /** Rend `true` quand les fichiers sont retenus, `false` quand ils sont refusés ou ignorés. */
  const receive = (files: FileList): boolean => {
    if (disabled || files.length === 0) return false;
    const limit = multiple ? maxFiles : 1;
    let message = '';
    if (limit !== undefined && files.length > limit) {
      message = labels.tooManyFiles(limit);
    } else if (
      maxSizeBytes !== undefined &&
      Array.from(files).some((file) => file.size > maxSizeBytes)
    ) {
      message = labels.fileTooLarge(maxSizeBytes);
    } else if (accept && Array.from(files).some((file) => !fileMatchesAccept(file, accept))) {
      message = labels.typeRejected;
    }
    setError(message);
    if (message) onError?.(message);
    else onFiles?.(files);
    return message === '';
  };

  /* Le geste de la zone d'abord, le gestionnaire de l'appelant ensuite. */
  const dragHandlers = {
    onDragEnter: (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      if (!disabled) {
        depth.current += 1;
        setDragging(true);
      }
      onDragEnter?.(event);
    },
    onDragOver: (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      onDragOver?.(event);
    },
    onDragLeave: (event: DragEvent<HTMLLabelElement>) => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
      onDragLeave?.(event);
    },
    onDrop: (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      depth.current = 0;
      setDragging(false);
      const files = event.dataTransfer.files;
      const accepted = receive(files);
      /* LE DÉPÔT REJOINT LE FORMULAIRE. Les fichiers déposés n'étaient jamais
         recopiés sur le champ : `onFiles` les recevait, la soumission non.
         Ils y sont posés — un `FileList` de dépôt s'affecte tel quel à
         `input.files` dans les navigateurs. REFUSÉ, le dépôt VIDE le champ,
         comme le sélecteur : l'erreur affichée ne doit pas laisser partir
         la sélection d'avant. Un dépôt vide ou ignoré ne touche à rien. */
      const input = inputRef.current;
      if (keepsFiles && input && !disabled && files.length > 0) {
        if (accepted) input.files = files;
        else input.value = '';
      }
      onDrop?.(event);
    },
  };

  /* L'ERREUR VIT HORS DU `<label>` : dedans, elle entrait dans le nom du champ.
     Elle le décrit, et sa région reste montée pour être annoncée. */
  return (
    <>
      <Zone
        {...rest}
        {...zoneProps}
        {...dragHandlers}
        className={clsx('opale-dropzone', liquidGlass && 'opale-dropzone--glass', className)}
        data-dragging={dragging ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          className="opale-visually-hidden"
          name={name}
          multiple={multiple}
          required={required}
          accept={accept}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            const input = event.currentTarget;
            const accepted = input.files ? receive(input.files) : false;
            /* SANS `name` NI `required`, LE CHAMP EST VIDÉ COMME AVANT : un
               même fichier choisi deux fois doit redéclencher `onFiles`.
               SINON, il garde sa sélection pour le formulaire — sauf refusée,
               pour ne jamais envoyer ce que la zone a signalé invalide. */
            if (!keepsFiles || !accepted) input.value = '';
          }}
        />
        <strong>{children === undefined ? labels.prompt : children}</strong>
        <span className="opale-dropzone__action">{disabled ? labels.disabled : labels.select}</span>
      </Zone>
      <span id={errorId} className="opale-dropzone__error" role="alert">
        {error}
      </span>
    </>
  );
}

/** Les textes de `Lightbox`. `close` nomme la croix et le bouton Fermer. */
export interface LightboxLabels extends ModalLabels {
  /** Le nom du dialogue, quand `aria-label` n'est pas passé. Défaut : « Aperçu ». */
  dialog: string;
}

const DEFAULT_LIGHTBOX_LABELS: LightboxLabels = { close: 'Fermer', dialog: 'Aperçu' };

/** Les props de `Lightbox`. `ref` et les attributs vont au panneau. */
export interface LightboxProps extends Omit<ComponentPropsWithRef<'div'>, 'title' | 'children'> {
  /** L'adresse de l'image montrée. Absente, la visionneuse ne s'ouvre pas, même avec `open`. */
  src?: string;
  /* `alt` EST OBLIGATOIRE, ET IL NE PEUT PAS EN ÊTRE AUTREMENT. Sa valeur par
     défaut était la chaîne vide, c'est-à-dire « cette image est décorative » —
     déclaré sur la seule chose que la visionneuse existe pour montrer. Un
     appelant distrait produisait une lightbox vide pour qui ne voit pas, sans
     le moindre signal. Une prop obligatoire dit « décris-moi » ; un défaut
     vide dit « ce n'est pas grave ». Rupture d'API assumée. */
  /** La description de l'image, obligatoire : la visionneuse n'existe que pour la montrer. */
  alt: string;
  /** Ouverte ou non, pilotée par l'appelant. Défaut : `false`. */
  open?: boolean;
  /** Appelée avec `false` sur Échap, le voile, la croix ou Fermer. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Depuis 2.6 — utilisez `onOpenChange`. */
  onClose?: () => void;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<LightboxLabels>;
  /**
   * Rend le bouton « Fermer » du pied, en plus de la croix d'en-tête. Défaut : `true`.
   * À `false`, seule la croix ferme le dialogue (elle n'existe qu'avec `onOpenChange`
   * ou `onClose`) ; son nom et la gestion du focus sont inchangés.
   */
  footerClose?: boolean;
  /** Rend le panneau dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

export function Lightbox({
  src,
  alt,
  open = false,
  onOpenChange,
  onClose,
  labels: labelsProp,
  liquidGlass = false,
  footerClose = true,
  ...rest
}: LightboxProps) {
  warnDeprecatedProps('Lightbox', { onClose });
  const close = closeHandler(onOpenChange, onClose);
  const labels = resolveLabels(DEFAULT_LIGHTBOX_LABELS, labelsProp);
  return (
    <Modal
      aria-label={labels.dialog}
      {...rest}
      labels={{ close: labels.close }}
      open={open && Boolean(src)}
      onOpenChange={close}
      liquidGlass={liquidGlass}
      rootClassName="opale-lightbox"
      footer={
        /* UN BOUTON PLEIN, ET NON LE FANTÔME. `ghost` trace son contour par un
           masque découpé en squircle : autour d'un libellé court, il ne restait
           que deux crochets de part et d'autre de « Fermer ». `tonal` est le
           bouton secondaire du système. */
        footerClose ? (
          <Button
            variant="tonal"
            liquidGlass={liquidGlass}
            onClick={closeClickHandler(onOpenChange, onClose)}
          >
            {labels.close}
          </Button>
        ) : undefined
      }
    >
      {src && <img src={src} alt={alt} />}
    </Modal>
  );
}
/* =============================================================================
   LE PRESSE-PAPIER DIT CE QUI S'EST PASSÉ.

   `writeText` était lancé sans être attendu, et « Copié » posé sans
   condition : en HTTP hors localhost — où `navigator.clipboard` n'existe
   pas — ou sur un refus de permission, le bouton affirmait une copie qui
   n'avait pas eu lieu. Et l'état ne revenait jamais : un second clic, une
   heure plus tard, ne changeait plus rien à l'écran.

   L'ANNONCE PASSE PAR UNE RÉGION, pas par le libellé du bouton. Un lecteur
   d'écran ne relit pas le nom du contrôle qu'on vient d'actionner : « Copié »
   apparaissait sans un mot (WCAG 4.1.3). La région est montée vide dès le
   départ, condition pour que son premier changement soit entendu.
   ========================================================================== */
const CLIPBOARD_RESET_MS = 2000;

type ClipboardState = 'idle' | 'copied' | 'failed';

/** Les textes de `Clipboard`. */
export interface ClipboardLabels {
  /** Le bouton au repos, quand `children` n'est pas passé. Défaut : « Copier ». */
  copy: string;
  /** Le bouton après une copie réussie. Défaut : « Copié ». */
  copied: string;
  /** L'annonce d'une copie réussie. Défaut : « Copié dans le presse-papier ». */
  copiedStatus: string;
  /** Le bouton et l'annonce d'un échec. Défaut : « Échec de la copie ». */
  failed: string;
}

const DEFAULT_CLIPBOARD_LABELS: ClipboardLabels = {
  copy: 'Copier',
  copied: 'Copié',
  copiedStatus: 'Copié dans le presse-papier',
  failed: 'Échec de la copie',
};

/** Les props de `Clipboard`. `ref` et les attributs vont au bouton de copie. */
export interface ClipboardProps extends Omit<ButtonProps, 'children' | 'value' | 'labels'> {
  /** Le texte copié dans le presse-papier au clic. */
  value: string;
  /** Rend le bouton dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /** Le texte du bouton au repos ; gagne sur `labels.copy`. */
  children?: ReactNode;
  /**
   * Remplace les textes français par défaut, clé par clé. `loading` reste
   * celui du bouton (`ButtonLabels`), transmis tel quel : il était accepté
   * avant que `Clipboard` n'ait ses propres textes.
   */
  labels?: Partial<ClipboardLabels> & Partial<ButtonLabels>;
}

export function Clipboard({
  value,
  liquidGlass = false,
  children,
  labels: labelsProp,
  onClick,
  ...rest
}: ClipboardProps) {
  const labels = resolveLabels(DEFAULT_CLIPBOARD_LABELS, labelsProp);
  const status: Record<ClipboardState, string> = {
    idle: '',
    copied: labels.copiedStatus,
    failed: labels.failed,
  };
  const [state, setState] = useState<ClipboardState>('idle');
  const reset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(reset.current), []);

  const copy = async () => {
    /* LA RÉGION REPASSE PAR LE VIDE. Deux copies rapprochées laissaient le même
       texte en place : la seconde n'était pas entendue. */
    setState('idle');
    clearTimeout(reset.current);
    let next: ClipboardState = 'failed';
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        next = 'copied';
      }
    } catch {
      next = 'failed';
    }
    setState(next);
    /* L'ÉCHEC RESTE jusqu'au prochain essai : effacé au bout de deux secondes,
       il disparaissait avant qu'on ait pu le lire ou réagir. */
    if (next === 'copied') {
      reset.current = setTimeout(() => setState('idle'), CLIPBOARD_RESET_MS);
    }
  };

  return (
    <>
      <Button
        size="small"
        variant="tonal"
        {...rest}
        liquidGlass={liquidGlass}
        labels={labelsProp?.loading === undefined ? undefined : { loading: labelsProp.loading }}
        onClick={(event) => {
          void copy();
          onClick?.(event);
        }}
      >
        {state === 'copied'
          ? labels.copied
          : state === 'failed'
            ? labels.failed
            : children === undefined
              ? labels.copy
              : children}
      </Button>
      <span className="opale-visually-hidden" role="status">
        {status[state]}
      </span>
    </>
  );
}
