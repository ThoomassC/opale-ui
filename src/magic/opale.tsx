import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
} from 'react';

import MagicBadge from './components/badge/Badge';
import MagicButton from './components/button/Button';
import MagicCard from './components/card/Card';
import MagicCheckbox from './components/checkbox/Checkbox';
import MagicInput from './components/input/Input';
import MagicSelect from './components/select/Select';
import MagicSlider from './components/slider/Slider';
import MagicSwitch from './components/switch/Switch';

/* =============================================================================
   LE VERRE EST LA PEAU, LE CONTRÔLE NATIF RESTE LE MOTEUR.

   C'est la règle qui gouverne les sept fusions de ce fichier, et elle mérite
   d'être posée une fois plutôt que réexpliquée sept.

   LE PATRON VIENT DE `Button` : un seul composant par nom, et la prop
   `liquidGlass` choisit la MATIÈRE. Le paquet publiait deux `Button`, deux
   `Input`, deux `Card`… dont l'un imitait l'autre en CSS. La prop rend
   désormais le vrai matériau, et la porte publique du vendoré se ferme.

   MAIS `Button` EST LE CAS FACILE, ET IL FAUT LE DIRE. Un bouton n'a pas
   d'état : `children`, `disabled`, un clic. Le vendoré le porte en entier,
   donc on peut le substituer tel quel. Les six autres ont un ÉTAT et un
   CONTRAT D'ÉVÉNEMENT, et là le vendoré ne suit plus :

     — `Checkbox` émet `onChange(checked: boolean)` quand Opale émet un
       `ChangeEvent<HTMLInputElement>` ;
     — `Slider` émet `onChange(value: number)`, et sa piste est un `<div>` sans
       rôle, sans `tabindex` et sans clavier — défaut réel, documenté en tête
       de `Slider.tsx` ;
     — `Switch` expose `isActive`/`setIsActive` là où `Toggle` étend
       `InputHTMLAttributes` : `name`, `required`, participation au formulaire ;
     — `Select` n'est pas un `<select>` : c'est un bouton et une liste de
       `<button>`, donc ni nom de formulaire, ni sélecteur natif mobile.

   Substituer purement et simplement aurait donc échangé un composant accessible
   contre un composant qui ne l'est pas, et fait taire des `onChange` que des
   formulaires écoutent. Une prop d'apparence n'a pas à casser un contrat.

   D'OÙ LA RÈGLE : le composant vendoré est rendu pour ce qu'on lui demande —
   SA SURFACE. Il est inerte (`aria-hidden`, `tabIndex={-1}`,
   `pointer-events: none`), et le contrôle natif d'Opale reste monté, garde le
   focus, le clavier, le nom de formulaire et son événement. Un état miroir
   (`useMirrorState`) tient le vendoré au courant de la valeur pour qu'il la
   peigne.

   CE QUI EST DONC VRAI À L'ÉCRAN : basculer le commutateur ne change QUE la
   matière — ni la taille, ni la position, ni le comportement, ni ce qu'entend
   un lecteur d'écran. C'était l'exigence.

   `Badge` ET `Card` N'ONT PAS D'ÉTAT, donc ils échappent à tout cela : ils sont
   substitués comme `Button`, sans miroir ni contrôle caché.
   ========================================================================== */

/**
 * La valeur affichée par la peau de verre, qu'on soit contrôlé ou non.
 *
 * Le vendoré a besoin d'une valeur pour se peindre, et Opale accepte les deux
 * modes. En mode contrôlé la prop fait foi et le miroir ne sert pas ; en mode
 * non contrôlé le DOM fait foi, et le miroir est le seul moyen de le savoir.
 */
function useMirrorState<T>(controlled: T | undefined, initial: T): [T, (next: T) => void] {
  const [mirror, setMirror] = useState<T>(initial);
  return [controlled ?? mirror, setMirror];
}

/** Rend un composant vendoré inerte : il peint, il n'agit pas. */
const DECORATIVE = { 'aria-hidden': true, tabIndex: -1 } as const;

/* `Input` NE DÉCLARE PAS DE `ref`, ET REACT 19 LA TRANSMET QUAND MÊME.

   Leur composant est un `React.FC` typé `ComponentPropsWithoutRef<'input'>`,
   donc TypeScript refuse `ref`. À l'exécution, en revanche, React 19 traite
   `ref` comme une prop ordinaire sur un composant fonction : elle tombe dans
   leur `{...props}` et atterrit sur le vrai `<input>`.

   Sans ce recast, il aurait fallu renoncer à `ref` sous verre — et
   `Input` est un `forwardRef`. Une référence qui cesse silencieusement
   d'être transmise est précisément le genre de panne qu'aucun test de rendu
   n'attrape : le champ s'affiche, et `inputRef.current` vaut `null`. */
const GlassInput = MagicInput as unknown as ComponentType<
  ComponentProps<typeof MagicInput> & { ref?: Ref<HTMLInputElement> }
>;

type ButtonVariant =
  'primary' | 'secondary' | 'accent' | 'danger' | 'tonal' | 'ghost' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  liquidGlass?: boolean;
}

function Surface({ liquidGlass = false, className, children, ...props }: SurfaceProps) {
  return (
    <div
      className={cx('opale-surface', liquidGlass && 'opale-liquid', className)}
      data-liquid-glass={liquidGlass ? 'true' : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
  liquidGlass?: boolean;
}

/* =============================================================================
   UN SEUL BOUTON, ET `liquidGlass` CHOISIT SA MATIÈRE.

   IL Y EN AVAIT DEUX, ET C'EST CE QUI EST CORRIGÉ ICI. Le paquet exportait un
   `Button` vendoré — celui qui passe par `<Glass>`, avec ses filtres SVG de
   déplacement et son onde au clic — ET ce `Button`, dont la prop
   `liquidGlass` ne posait qu'une classe CSS : deux dégradés radiaux sur
   `--opale-glass-surface`. Deux composants du même nom, dont l'un imitait
   l'autre sans l'égaler.

   DÉSORMAIS LA PROP DÉLÈGUE AU VRAI MATÉRIAU. `liquidGlass` ne repeint plus un
   fond : elle rend le composant de verre lui-même. « Activer le verre » et
   « utiliser le composant de verre » sont devenus la même chose, ce qui était
   déjà la promesse de la prop — elle ne la tenait pas.

   CE QUE CELA DONNE À QUI INTÈGRE : un seul nom à connaître, et le choix
   d'embarquer ou non le matériau, composant par composant, sans changer
   d'import.

   LE VERRE PORTE LA PALETTE D'OPALE, PAS CELLE DU COMPOSANT VENDORÉ.

   Une première version faisait correspondre les sept rôles Opale aux quatre
   teintes du vendoré — `danger` sur `negative`, `accent` sur `warning`. Elle
   s'est démentie toute seule le jour où le secondaire est passé de l'olive au
   bleu : sous verre il restait VERT, parce qu'il empruntait la teinte
   `positive` d'une autre palette. Une correspondance arbitraire ne survit pas
   au premier changement de marque.

   Le composant vendoré est donc rendu SANS variante, et la teinte vient d'une
   classe par rôle Opale, tirée des jetons. Basculer le commutateur ne change
   plus la couleur du bouton, seulement sa matière — ce qui était le propos.

   CE QUI SE PERD, ET IL FAUT LE SAVOIR : `loading`, `startIcon`, `endIcon` et
   `fullWidth` n'existent pas sur le composant vendoré. Ils sont ignorés sous
   verre, et c'est préférable à une seconde implémentation qui les simulerait
   mal. `opale.tsx` cesse par ailleurs d'être une feuille autonome : c'est le
   prix d'un composant unique, et il est moins cher que le doublon.
   ========================================================================== */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      startIcon,
      endIcon,
      fullWidth = false,
      liquidGlass = false,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) =>
    liquidGlass ? (
      <MagicButton
        ref={ref}
        size={size}
        disabled={disabled || loading}
        /* `opale-button--glass` REND LA GÉOMÉTRIE D'OPALE À LA MATIÈRE DE
           L'AUTRE. Sans elle, basculer le commutateur changeait la TAILLE du
           bouton en même temps que sa surface — 120 × 52 px contre 90 × 44 —,
           si bien que la mise en page sautait et qu'on ne comparait plus deux
           états du même composant mais deux composants. La silhouette
           arrondie, elle, reste celle du verre : c'est son identité, pas un
           accident de dimension. */
        className={cx('opale-button--glass', `opale-button--glass-${variant}`, className)}
        /* LA SILHOUETTE EST CELLE D'OPALE, ET IL FAUT L'ENVELOPPE POUR L'AVOIR.
           Le verre est arrondi par le `border-radius` de son conteneur, pas par
           le bouton : habiller le seul contenu laissait des coins ronds tout
           autour. `rootClassName` atteint ce conteneur, et le composant vendoré
           le transmet à `<Glass>`. Il est passé APRÈS le sien dans les props,
           donc il l'emporte — celui-ci ne sert qu'au mode `rounded`, qu'on
           n'emploie pas. */
        rootClassName="opale-button--glass-root"
        {...props}
      >
        {children}
      </MagicButton>
    ) : (
      <button
        ref={ref}
        className={cx(
          'opale-button',
          `opale-button--${variant}`,
          size !== 'medium' && `opale-button--${size}`,
          fullWidth && 'opale-button--full',
          className,
        )}
        data-liquid-glass={liquidGlass ? 'true' : undefined}
        disabled={disabled || loading}
        type={type}
        {...props}
      >
        {loading ? <span className="opale-spinner" aria-hidden="true" /> : startIcon}
        <span>{children}</span>
        {!loading && endIcon}
      </button>
    ),
);
Button.displayName = 'Button';

export const Pressable = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <Button ref={ref} variant="text" {...props} />
));
Pressable.displayName = 'Pressable';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  elevation?: 0 | 1 | 2 | 3;
  liquidGlass?: boolean;
}

export function Card({
  title,
  subtitle,
  actions,
  footer,
  elevation = 1,
  liquidGlass = false,
  className,
  children,
  ...props
}: CardProps) {
  const content = (
    <>
      {(title || subtitle || actions) && (
        <div className="opale-card__header">
          <div>
            {title && <h3 className="opale-card__title">{title}</h3>}
            {subtitle && <p className="opale-card__subtitle">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="opale-card__body">{children}</div>
      {footer && <div className="opale-card__footer">{footer}</div>}
    </>
  );

  /* LA CLASSE DU CONSOMMATEUR PART SUR LA RACINE, PAS SUR LE CONTENU, et ce
     n'est pas un détail de goût. `Card` ne déstructure PAS `className` : il
     pose la sienne puis répand `{...props}` par-dessus, si bien qu'une classe
     venue de l'extérieur EFFACE `styles.card` — la carte perd son fond, son
     rayon et son rembourrage d'un coup, sans que rien ne rougisse. La racine
     du verre est de toute façon l'élément qu'on voit ; c'est là qu'une classe
     d'habillage a sa place.

     `elevation` N'A PAS D'ÉQUIVALENT et n'en aura pas : le verre porte sa
     propre ombre, qui EST sa profondeur. Lui superposer les trois niveaux
     d'Opale donnerait deux ombres sur une surface translucide. */
  if (liquidGlass) {
    return (
      <MagicCard rootClassName={cx('opale-card--glass-root', className)} {...props}>
        {content}
      </MagicCard>
    );
  }

  return (
    <Surface className={cx('opale-card', `opale-card--e${elevation}`, className)} {...props}>
      {content}
    </Surface>
  );
}

export function CardGrid({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('opale-card-grid', className)} {...props}>
      {children}
    </div>
  );
}

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  icon?: ReactNode;
  liquidGlass?: boolean;
}

export const Input = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, helperText, error, icon, liquidGlass = false, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <label className={cx('opale-field', className)} htmlFor={inputId}>
        {label && <span className="opale-field__label">{label}</span>}
        {/* LA FRONTIÈRE PASSE SOUS LE LIBELLÉ, ET AU-DESSUS DU CHAMP.

            Ce qui porte du TEXTE reste à Opale — le libellé, le texte d'aide,
            le message d'erreur, et l'association `htmlFor`/`id` qui les relie.
            Seule la BOÎTE du champ devient du verre. Envoyer le libellé au
            vendoré n'était pas possible de toute façon : il n'en a pas.

            LE VENDORÉ REND UN VRAI `<input>` ET REÇOIT `{...props}` DESSUS,
            donc c'est le seul des sept où la substitution est complète : la
            valeur, le type, le nom, le `placeholder` et l'`onChange` natif
            passent tels quels. Rien à pontifier, rien à masquer.

            CE QUI SE PERD : `icon`. Le vendoré n'a aucun emplacement où la
            poser, et l'insérer de force demanderait de reconstruire son
            balisage — c'est-à-dire de recréer le doublon qu'on supprime. */}
        {liquidGlass ? (
          <span className="opale-input--glass">
            <GlassInput ref={ref} id={inputId} {...props} />
          </span>
        ) : (
          <span className="opale-input-shell">
            {icon}
            <input ref={ref} id={inputId} className="opale-input" {...props} />
          </span>
        )}
        {(error || helperText) && (
          <span
            className={cx('opale-field__helper', Boolean(error) && 'opale-field__helper--error')}
          >
            {error || helperText}
          </span>
        )}
      </label>
    );
  },
);
Input.displayName = 'Input';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
  liquidGlass?: boolean;
}

export function Checkbox({
  label,
  description,
  liquidGlass = false,
  className,
  onChange,
  ...props
}: CheckboxProps) {
  const [checked, setChecked] = useMirrorState(
    props.checked,
    props.defaultChecked ?? props.checked ?? false,
  );

  /* LE VERRE REMPLACE LA COCHE PEINTE, PAS LA CASE.

     `.opale-checkbox-mark` est déjà une décoration `aria-hidden` : la vraie
     case est l'`<input>` natif, invisible et posé sur toute la rangée. Le
     verre prend exactement la place de cette décoration, et reste comme elle
     inerte — c'est le `<label>` qui reçoit le clic, comme avant.

     `pointer-events: none` (posé en CSS) EST CE QUI ÉVITE LA DOUBLE BASCULE :
     leur case est un `<button>` avec son propre `onClick`. Laissé cliquable à
     l'intérieur d'un `<label>`, il aurait coché puis décoché dans le même
     geste, ou pire, selon que le navigateur considère ou non qu'un bouton
     interrompt la propagation du libellé. On ne parie pas là-dessus. */
  return (
    <label className={cx('opale-checkbox-row', className)}>
      <input
        type="checkbox"
        className="opale-checkbox"
        onChange={(event) => {
          setChecked(event.currentTarget.checked);
          onChange?.(event);
        }}
        {...props}
      />
      {liquidGlass ? (
        <span
          className="opale-checkbox--glass"
          data-checked={checked ? 'true' : undefined}
          aria-hidden="true"
        >
          <MagicCheckbox
            checked={checked}
            disabled={props.disabled}
            enableClickAnimation={false}
            rootClassName="opale-checkbox--glass-root"
            {...DECORATIVE}
          />
        </span>
      ) : (
        <span className="opale-checkbox-mark" aria-hidden="true" />
      )}
      <span>{label ?? description}</span>
      {label && description && <small className="opale-field__helper">{description}</small>}
    </label>
  );
}

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  liquidGlass?: boolean;
}

export function Toggle({
  label,
  liquidGlass = false,
  className,
  onChange,
  ...props
}: ToggleProps) {
  const [checked, setChecked] = useMirrorState(
    props.checked,
    props.defaultChecked ?? props.checked ?? false,
  );

  /* `liquidGlass` NE POSAIT QU'UNE CLASSE, ET C'EST CE QUI EST CORRIGÉ ICI.
     Elle ajoutait `opale-liquid` à la RANGÉE — un lavis CSS sur le fond du
     libellé, qui imitait le verre sans l'être et ne touchait même pas la
     piste. La prop rend désormais l'interrupteur vendoré à la place de la
     piste peinte, inerte comme elle l'était (`aria-hidden`), l'`<input>`
     natif gardant le focus, le clavier et le nom de formulaire. */
  return (
    <label className={cx('opale-toggle-row', className)}>
      <input
        type="checkbox"
        className="opale-toggle"
        onChange={(event) => {
          setChecked(event.currentTarget.checked);
          onChange?.(event);
        }}
        {...props}
      />
      {liquidGlass ? (
        <span
          className="opale-toggle--glass"
          data-checked={checked ? 'true' : undefined}
          aria-hidden="true"
        >
          <MagicSwitch
            isActive={checked}
            disabled={props.disabled}
            enableClickAnimation={false}
            rootClassName="opale-toggle--glass-root"
            {...DECORATIVE}
          />
        </span>
      ) : (
        <span className="opale-toggle-track" aria-hidden="true">
          <span className="opale-toggle-thumb" />
        </span>
      )}
      {label && <span>{label}</span>}
    </label>
  );
}

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  valueLabel?: ReactNode;
  liquidGlass?: boolean;
}

export function Slider({
  label,
  valueLabel,
  liquidGlass = false,
  className,
  onChange,
  ...props
}: SliderProps) {
  const [value, setValue] = useMirrorState(
    props.value === undefined ? undefined : Number(props.value),
    Number(props.defaultValue ?? props.value ?? 0),
  );

  /* ICI LE CONTRÔLE NATIF N'EST PAS UNE PRÉCAUTION, C'EST UNE CORRECTION.

     Leur piste est un `<div>` sans rôle, sans `tabindex` et sans clavier — le
     défaut est relevé en tête de `Slider.tsx`, dans ce dépôt. Le substituer à
     l'`<input type="range">` d'Opale aurait échangé un curseur utilisable au
     clavier contre un curseur qui ne l'est pas : une régression
     d'accessibilité déguisée en changement d'apparence. WCAG 2.1.1 n'admet pas
     ce troc, et le propriétaire n'a pas demandé de perdre le clavier.

     LE NATIF EST DONC POSÉ PAR-DESSUS, TRANSPARENT (voir `opale.css`) : il
     reçoit le pointeur ET les flèches du clavier, et le verre au-dessous se
     contente de peindre la valeur qu'il annonce. C'est le geste inverse de
     celui du bouton, et c'est le même principe — rendre la matière sans rien
     retirer au composant. */
  const range = (
    <input
      type="range"
      className={cx('opale-range', liquidGlass && 'opale-range--glass')}
      onChange={(event) => {
        setValue(Number(event.currentTarget.value));
        onChange?.(event);
      }}
      {...props}
    />
  );

  return (
    <label className={cx('opale-field', className)}>
      {(label || valueLabel) && (
        <span className="opale-card__header">
          <span className="opale-field__label">{label}</span>
          <span>{valueLabel ?? props.value}</span>
        </span>
      )}
      {liquidGlass ? (
        <span className="opale-slider--glass">
          <MagicSlider
            value={value}
            min={props.min === undefined ? undefined : Number(props.min)}
            max={props.max === undefined ? undefined : Number(props.max)}
            step={props.step === undefined ? undefined : Number(props.step)}
            disabled={props.disabled}
            enableClickAnimation={false}
          />
          {range}
        </span>
      ) : (
        range
      )}
    </label>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  helperText?: ReactNode;
  options?: readonly { value: string; label: ReactNode }[];
  liquidGlass?: boolean;
}

export function Select({
  label,
  helperText,
  options,
  liquidGlass = false,
  className,
  id,
  children,
  onChange,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const [value, setValue] = useMirrorState(
    props.value === undefined ? undefined : String(props.value),
    String(props.defaultValue ?? props.value ?? options?.[0]?.value ?? ''),
  );

  const nativeSelect = (
    <select
      id={selectId}
      className={cx('opale-select', liquidGlass && 'opale-select--native')}
      onChange={(event) => {
        setValue(event.currentTarget.value);
        onChange?.(event);
      }}
      {...props}
    >
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {children}
    </select>
  );

  /* LE `<select>` NATIF RESTE, ET IL RESTE AU-DESSUS.

     Leur `Select` n'est pas un `<select>` : c'est un bouton et une liste de
     `<button>`. Le substituer aurait coûté trois choses à la fois — le nom de
     formulaire (`name`), le sélecteur natif du mobile, et les `<option>` que
     le consommateur passe en enfants. Le champ aurait continué de s'afficher,
     et le formulaire aurait cessé d'envoyer sa valeur : la panne muette
     typique.

     Le natif est donc posé par-dessus la peau de verre, transparent. Il garde
     le clic, le clavier et la soumission ; le verre peint l'état fermé, qui
     est le seul que l'on voie — la liste ouverte, elle, est celle du système,
     exactement comme sans verre.

     LES LIBELLÉS D'OPTION SONT DES `ReactNode` ET LE VENDORÉ VEUT DES CHAÎNES.
     Seules les options dont le libellé EST une chaîne lui sont passées ; les
     autres gardent leur rendu natif au-dessus, donc rien ne disparaît à
     l'écran, seule la peau est moins bavarde. */
  if (liquidGlass) {
    return (
      <label className={cx('opale-field', className)} htmlFor={selectId}>
        {label && <span className="opale-field__label">{label}</span>}
        <span className="opale-select--glass">
          <MagicSelect
            options={(options ?? [])
              .filter((option) => typeof option.label === 'string')
              .map((option) => ({ value: option.value, label: option.label as string }))}
            value={value}
            disabled={props.disabled}
            enableClickAnimation={false}
          />
          {nativeSelect}
        </span>
        {helperText && <span className="opale-field__helper">{helperText}</span>}
      </label>
    );
  }

  return (
    <label className={cx('opale-field', className)} htmlFor={selectId}>
      {label && <span className="opale-field__label">{label}</span>}
      <span className="opale-input-shell">{nativeSelect}</span>
      {helperText && <span className="opale-field__helper">{helperText}</span>}
    </label>
  );
}

export interface MultiSelectProps extends SelectProps {
  values?: readonly string[];
}

/**
 * La sélection multiple, habillée aux couleurs d'Opale.
 *
 * ================================================================
 * POURQUOI CE COMPOSANT N'EST PLUS UN `<select multiple>` VISIBLE.
 *
 * Il en était un, et c'était un mur : la liste déroulante multiple native est
 * la SEULE commande de formulaire qu'aucune feuille de style ne peut habiller.
 * Ses rangées sélectionnées sont peintes par le système d'exploitation — d'où
 * les bandes GRISES qui traversaient le composant au milieu d'une vitrine qui
 * n'a pas une seule autre surface grise. Ni `background`, ni `color`, ni
 * `::selection`, ni `appearance: none` n'ont de prise dessus : le rendu
 * appartient au moteur, pas au document.
 *
 * LE NATIF N'A PAS DISPARU POUR AUTANT — IL EST DEVENU LE PORTEUR DE VALEUR.
 * Un `<select multiple>` reste rendu, masqué visuellement, et c'est lui qui
 * porte les `<option>` et leur état `selected`. Cela préserve À L'IDENTIQUE le
 * contrat des consommateurs : `onChange` reçoit un événement dont
 * `currentTarget.selectedOptions` est la liste attendue, et le champ continue
 * de participer à la soumission d'un formulaire avec son `name`. Réécrire
 * l'API aurait cassé tous les appels existants pour un gain d'apparence.
 *
 * L'ÉVÉNEMENT EST ÉMIS SUR LE NATIF, ET C'EST CE QUI REND L'ILLUSION HONNÊTE.
 * Cocher une option modifie `option.selected` puis distribue un `change` qui
 * bouillonne : React l'entend à la racine et appelle le `onChange` du
 * consommateur avec le vrai `<select>` pour cible. Personne n'a à savoir que
 * la liste visible est faite de `<div>`.
 *
 * LE NATIF EST HORS DE L'ARBRE D'ACCESSIBILITÉ (`aria-hidden`, `tabIndex={-1}`)
 * et la liste VISIBLE porte les rôles. L'inverse — garder le natif focusable
 * et décorer par-dessus — était tentant et faux : un champ focusable invisible
 * est un piège au clavier, d'autant plus depuis que la vitrine ne peint plus
 * d'anneau de focus. Ici, ce qu'on voit est ce qu'on pilote.
 * ================================================================
 */
export function MultiSelect({
  values,
  label,
  helperText,
  options = [],
  liquidGlass = false,
  className,
  id,
  onChange,
  ...props
}: MultiSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const labelId = `${fieldId}-label`;
  const selectRef = useRef<HTMLSelectElement>(null);
  const selected = new Set(values ?? []);

  /* `activeIndex` est l'option DÉSIGNÉE au clavier, distincte des options
     COCHÉES : dans une `listbox` multi-sélection, on parcourt sans choisir et
     l'on choisit sans se déplacer. Les confondre obligerait à cocher tout ce
     qu'on survole en chemin. */
  const [activeIndex, setActiveIndex] = useState(0);

  const toggle = (value: string) => {
    const select = selectRef.current;

    if (!select) return;

    for (const option of Array.from(select.options)) {
      if (option.value === value) option.selected = !option.selected;
    }

    /* `bubbles`, sans quoi React ne verra rien : son écouteur n'est pas posé
       sur le `<select>` mais à la racine de l'arbre. */
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => (current >= last ? 0 : current + 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((current) => (current <= 0 ? last : current - 1));
        return;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        return;
      case 'End':
        event.preventDefault();
        setActiveIndex(last);
        return;
      case ' ':
      case 'Enter': {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) toggle(option.value);
        return;
      }
      default:
    }
  };

  return (
    <div className={cx('opale-field', className)}>
      {label && (
        <span className="opale-field__label" id={labelId}>
          {label}
        </span>
      )}

      <select
        ref={selectRef}
        id={fieldId}
        className="opale-visually-hidden"
        multiple
        value={values}
        onChange={onChange}
        aria-hidden="true"
        tabIndex={-1}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {typeof option.label === 'string' ? option.label : option.value}
          </option>
        ))}
      </select>

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- la
          `listbox` EST la commande : c'est le motif ARIA de la sélection
          multiple, et les `option` en sont les enfants exigés. */}
      <div
        className={cx('opale-multiselect', liquidGlass && 'opale-liquid')}
        role="listbox"
        aria-multiselectable="true"
        aria-labelledby={label ? labelId : undefined}
        aria-activedescendant={`${fieldId}-option-${activeIndex}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {options.map((option, index) => {
          const isSelected = selected.has(option.value);

          return (
            /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus --
               LES DEUX RÈGLES SE TROMPENT ICI, ET POUR LA MÊME RAISON. Elles
               réclament un écouteur clavier et un `tabIndex` sur l'option. Or
               le motif `listbox` + `aria-activedescendant` veut exactement
               l'inverse : le focus reste sur la LISTE, qui porte tout le
               clavier, et l'option désignée l'est par son identifiant. Rendre
               l'option focusable ajouterait autant d'arrêts de tabulation que
               d'options et couperait la frappe de la liste ; y poser un
               `onKeyDown` serait du code mort, l'élément ne pouvant jamais
               recevoir d'événement clavier. Même arbitrage que le combobox de
               la recherche de la vitrine. */
            <div
              key={option.value}
              id={`${fieldId}-option-${index}`}
              className="opale-multiselect__option"
              role="option"
              aria-selected={isSelected}
              data-active={index === activeIndex ? 'true' : undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setActiveIndex(index);
                toggle(option.value);
              }}
            >
              <span className="opale-multiselect__mark" aria-hidden="true" />
              <span className="opale-multiselect__label">{option.label}</span>
            </div>
          );
        })}
      </div>

      {helperText && <span className="opale-field__helper">{helperText}</span>}
    </div>
  );
}

export interface AutocompleteProps extends FieldProps {
  options?: readonly string[];
}

export function Autocomplete({ options = [], ...props }: AutocompleteProps) {
  const listId = useId();
  return (
    <>
      <Input list={listId} {...props} />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}

export function InlineInput(props: FieldProps) {
  return <Input {...props} />;
}

export interface SegmentedControlProps {
  options: readonly { value: string; label: ReactNode }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/**
 * Le fond de la sélection est un élément UNIQUE qui glisse sous l'option
 * choisie, et non un fond qui s'allume sur un bouton pendant qu'il s'éteint sur
 * un autre — cette seconde forme ne laisse rien à animer, elle saute.
 *
 * Le raisonnement est celui de `Tabs.List` (voir l'en-tête de
 * `components/tabs/Tabs.tsx`), redit ici parce que ce fichier ne dépend
 * d'AUCUN composant de `components/**` et que c'est délibéré : `opale.tsx` est
 * une feuille autonome, lisible d'un bout à l'autre sans ouvrir le reste du
 * dossier. Les trois points qui comptent :
 *  - `aria-pressed` reste la source de vérité, lue dans le DOM ;
 *  - l'indicateur est `aria-hidden`, il n'annonce rien que `aria-pressed` ne
 *    dise déjà ;
 *  - le premier placement ne s'anime pas, sinon l'indicateur traverserait le
 *    composant à chaque montage.
 *
 * `translate3d` avec les deux axes, et non le seul X : `.opale-segmented` est
 * en `flex-wrap: wrap`, donc les options passent à la ligne dès que la place
 * manque et l'indicateur doit descendre avec elles.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const hasPlacedRef = useRef(false);

  useLayoutEffect(() => {
    const group = groupRef.current;
    const indicator = indicatorRef.current;

    if (!group || !indicator) return;

    const place = () => {
      const active = group.querySelector<HTMLElement>('[aria-pressed="true"]');

      if (!active) {
        indicator.style.opacity = '0';
        return;
      }

      const groupRect = group.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      /* Rectangles nuls : première mise en page, ou jsdom qui n'a pas de mise
         en page. On ne place rien plutôt que de poser un indicateur de 0 px
         dans le coin, d'où il glisserait à la première vraie mesure. */
      if (activeRect.width === 0 || activeRect.height === 0) return;

      indicator.style.opacity = '1';
      indicator.style.width = `${activeRect.width}px`;
      indicator.style.height = `${activeRect.height}px`;
      indicator.style.transform = `translate3d(${activeRect.left - groupRect.left + group.scrollLeft}px, ${activeRect.top - groupRect.top + group.scrollTop}px, 0)`;

      if (!hasPlacedRef.current) {
        hasPlacedRef.current = true;
        /* Force le calcul de la mise en page : la position ci-dessus devient
           l'état de départ de la transition armée juste après. */
        void indicator.offsetWidth;
        indicator.dataset.animated = 'true';
      }
    };

    place();

    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(place);

    if (observer) {
      observer.observe(group);
      group.querySelectorAll('.opale-segmented__item').forEach((item) => observer.observe(item));
    }

    window.addEventListener('resize', place);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [options, value]);

  return (
    <div ref={groupRef} className={cx('opale-segmented', className)} role="group">
      <span ref={indicatorRef} aria-hidden="true" className="opale-segmented__indicator" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="opale-segmented__item"
          aria-pressed={value === option.value}
          onClick={() => onChange?.(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Form({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form className={cx('opale-stack', 'opale-stack--column', className)} {...props} />;
}

export function LanguageSelector({
  value = 'FR',
  onChange,
  className,
  ariaLabel = 'Langue',
}: {
  value?: string;
  onChange?: SelectHTMLAttributes<HTMLSelectElement>['onChange'];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Select
      className={className}
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
      options={[
        { value: 'FR', label: 'Français' },
        { value: 'EN', label: 'English' },
        { value: 'ES', label: 'Español' },
      ]}
    />
  );
}

export function ThemeToggle({
  dark = false,
  onChange,
  className,
}: {
  dark?: boolean;
  onChange?: (dark: boolean) => void;
  className?: string;
}) {
  return (
    <Toggle
      className={className}
      aria-label="Thème"
      checked={dark}
      onChange={(event) => onChange?.(event.currentTarget.checked)}
    />
  );
}

export function AddButton(props: Omit<ButtonProps, 'children'>) {
  return (
    <Button {...props} startIcon="+">
      Ajouter
    </Button>
  );
}
export function SaveButton({
  onSaved,
  ...props
}: Omit<ButtonProps, 'children'> & { onSaved?: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <Button
      {...props}
      onClick={(event) => {
        setSaved(true);
        onSaved?.();
        props.onClick?.(event);
      }}
    >
      {saved ? 'Enregistré' : 'Enregistrer'}
    </Button>
  );
}
export function ApproveButton(props: Omit<ButtonProps, 'children'>) {
  return (
    <Button {...props} variant="primary" startIcon="✓">
      Valider
    </Button>
  );
}
export function EditButton(props: Omit<ButtonProps, 'children'>) {
  return (
    <Button {...props} variant="tonal" startIcon="✎">
      Modifier
    </Button>
  );
}
export function DeleteButton(props: Omit<ButtonProps, 'children'>) {
  return (
    <Button {...props} variant="danger" startIcon="×">
      Supprimer
    </Button>
  );
}
export function IconActionButton({
  label = 'Action',
  ...props
}: Omit<ButtonProps, 'children'> & { label?: string }) {
  return (
    <Button {...props} aria-label={label} variant="ghost">
      {label.slice(0, 1)}
    </Button>
  );
}

export function Badge({
  tone = 'primary',
  liquidGlass = false,
  children,
  className,
}: {
  tone?: 'primary' | 'accent' | 'danger';
  liquidGlass?: boolean;
  children: ReactNode;
  className?: string;
}) {
  /* `Badge` EST LE SEUL VENDORÉ QUI FUSIONNE `className` AU LIEU DE L'ÉCRASER
     (il le déstructure et le passe à `clsx`), donc c'est le seul où la
     géométrie peut voyager par là. Les six autres exigent `rootClassName`.

     SA VARIANTE N'EST PAS EMPLOYÉE, pour la raison qui a déjà tranché sur le
     bouton : ses six teintes viennent d'une autre palette, et une
     correspondance arbitraire entre les tons d'Opale et les leurs se dément au
     premier changement de marque — le secondaire du bouton était resté vert.
     La teinte vient donc d'une classe par ton, tirée des jetons. */
  if (liquidGlass) {
    return (
      <MagicBadge
        className={cx('opale-badge--glass', `opale-badge--glass-${tone}`, className)}
        rootClassName="opale-badge--glass-root"
      >
        {children}
      </MagicBadge>
    );
  }

  return (
    <span className={cx('opale-badge', tone !== 'primary' && `opale-badge--${tone}`, className)}>
      {children}
    </span>
  );
}

export function StatusChip({
  status = 'En production',
  className,
}: {
  status?: string;
  className?: string;
}) {
  return <Badge className={className}>{status}</Badge>;
}

export function Heading({
  level = 2,
  children,
  className,
}: {
  level?: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}) {
  const Heading = `h${level}` as 'h1';
  return <Heading className={cx('opale-heading', className)}>{children}</Heading>;
}

export function Text({
  variant = 'body',
  children,
  className,
}: {
  variant?: 'body' | 'label' | 'caption' | 'metric';
  children: ReactNode;
  className?: string;
}) {
  return <p className={cx('opale-text', `opale-text--${variant}`, className)}>{children}</p>;
}

export function Icon({
  name = '✦',
  label,
  className,
}: {
  name?: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cx('opale-icon', className)}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  );
}

export function Feedback({
  severity = 'info',
  title,
  children,
  className,
}: {
  severity?: 'success' | 'info' | 'warning' | 'error';
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx('opale-feedback', `opale-feedback--${severity}`, className)}
      role={severity === 'error' ? 'alert' : 'status'}
    >
      <strong>{title ?? severity}</strong>
      <span>{children}</span>
    </div>
  );
}

export function Toast({
  message,
  open = true,
  onClose,
  className,
}: {
  message: ReactNode;
  open?: boolean;
  onClose?: () => void;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className={cx('opale-surface', 'opale-panel', className)} role="status">
      <span>{message}</span>
      {onClose && (
        <button className="opale-dialog__close" type="button" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      )}
    </div>
  );
}

export function Spinner({
  label = 'Chargement',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span className={cx('opale-stack', className)} role="status">
      <span className="opale-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function ProgressBar({
  value = 0,
  label,
  className,
}: {
  value?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cx('opale-field', className)}>
      {label && <span className="opale-field__label">{label}</span>}
      <div
        className="opale-progress"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="opale-progress__value"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open = false,
  title = 'Confirmer',
  children,
  onConfirm,
  onCancel,
}: {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  if (!open) return null;
  return (
    <div className="opale-dialog-backdrop">
      <div
        className="opale-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="opale-confirm-title"
      >
        <div className="opale-dialog__header">
          <h2 id="opale-confirm-title" className="opale-card__title">
            {title}
          </h2>
          <button
            className="opale-dialog__close"
            type="button"
            onClick={onCancel}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className="opale-dialog__body">{children}</div>
        <div className="opale-dialog__footer">
          <Button variant="text" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onConfirm}>Confirmer</Button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title = 'Aucun résultat',
  description,
  action,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="opale-empty-state" title={title} subtitle={description} actions={action}>
      <Icon name="⌁" />
    </Card>
  );
}

export interface NavItem {
  id: string;
  label: ReactNode;
  href?: string;
  icon?: ReactNode;
}
export function Navbar({
  items = [],
  activeId,
  onSelect,
  className,
}: {
  items?: readonly NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <nav className={cx('opale-surface', 'opale-nav', className)} aria-label="Navigation">
      {items.map((item) =>
        item.href ? (
          <a
            key={item.id}
            href={item.href}
            className="opale-nav__item"
            aria-current={activeId === item.id ? 'page' : undefined}
          >
            {item.icon}
            {item.label}
          </a>
        ) : (
          <button
            key={item.id}
            type="button"
            className="opale-nav__item"
            aria-current={activeId === item.id ? 'page' : undefined}
            onClick={() => onSelect?.(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ),
      )}
    </nav>
  );
}

export function Menu({
  label = 'Menu',
  items = [],
  className,
  children,
}: {
  label?: ReactNode;
  items?: readonly NavItem[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <details className={cx('opale-surface', 'opale-panel', className)}>
      <summary>{label}</summary>
      {items.length > 0 ? <Navbar items={items} /> : children}
    </details>
  );
}

export function Link({
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return (
    <a className={cx('opale-link', className)} {...props}>
      {children}
    </a>
  );
}

export function SidePanel({
  open = false,
  title = 'Panneau',
  children,
  onClose,
}: {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
}) {
  if (!open) return null;
  return (
    <div className="opale-dialog-backdrop">
      <aside className="opale-dialog" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="opale-dialog__header">
          <h2 className="opale-card__title">{title}</h2>
          <button
            className="opale-dialog__close"
            type="button"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function SettingsMenu({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Menu className={className} label="Réglages" items={[]}>
      <div className="opale-stack opale-stack--column">{children}</div>
    </Menu>
  );
}
export function CommandPalette({
  open = false,
  value = '',
  onChange,
  children,
}: {
  open?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  children?: ReactNode;
}) {
  return open ? (
    <div className="opale-dialog-backdrop">
      <div className="opale-dialog">
        <Input
          value={value}
          onChange={(event) => onChange?.(event.currentTarget.value)}
          placeholder="Rechercher une commande"
        />
        {children}
      </div>
    </div>
  ) : null;
}

export function Breadcrumb({ items = [] }: { items?: readonly NavItem[] }) {
  return (
    <nav className="opale-breadcrumb" aria-label="Fil d'Ariane">
      {items.map((item, index) => (
        <span key={item.id}>
          {index > 0 && <span aria-hidden="true">/</span>}
          {item.href ? <a href={item.href}>{item.label}</a> : item.label}
        </span>
      ))}
    </nav>
  );
}
export function Toolbar({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('opale-surface', 'opale-toolbar', 'opale-panel', className)} {...props}>
      {children}
    </div>
  );
}
export function CookieBanner({
  open = true,
  children = 'Nous utilisons des cookies pour améliorer votre expérience.',
  onAccept,
}: {
  open?: boolean;
  children?: ReactNode;
  onAccept?: () => void;
}) {
  return open ? (
    <Feedback severity="info" title="Cookies">
      {children}
      <Button size="small" onClick={onAccept}>
        Accepter
      </Button>
    </Feedback>
  ) : null;
}
export function SelectionBar({
  selectedCount = 0,
  children,
}: {
  selectedCount?: number;
  children?: ReactNode;
}) {
  return (
    <div className="opale-surface opale-selection-bar opale-panel">
      <span>
        {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
      </span>
      {children}
    </div>
  );
}
export function Scrollbar({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('opale-scrollbar', className)}>{children}</div>;
}

export function Stack({
  direction = 'column',
  wrap = false,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { direction?: 'row' | 'column'; wrap?: boolean }) {
  return (
    <div
      className={cx(
        'opale-stack',
        direction === 'column' && 'opale-stack--column',
        wrap && 'opale-stack--wrap',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
export function Layout({
  navigation,
  children,
  className,
}: {
  navigation?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('opale-layout', className)}>
      {navigation}
      <main className="opale-layout__content">{children}</main>
    </div>
  );
}
export function PageScaffold({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('opale-page-scaffold', className)}>{children}</div>;
}
export function PageContent({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cx('opale-page-content', className)}>{children}</section>;
}
export function Divider({ className }: { className?: string }) {
  return <hr className={cx('opale-divider', className)} />;
}
export function Separator({ className }: { className?: string }) {
  return <span className={cx('opale-separator', className)} aria-hidden="true" />;
}
export function BackgroundSurface({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('opale-opaley-background', className)}>{children}</div>;
}
export function ShapeBackground({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('opale-shape-background', className)}>{children}</div>;
}
export function SlidingIndicator({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('opale-sliding-indicator', className)}>{children}</div>;
}

export function DescriptionList({
  items = [],
}: {
  items?: readonly { term: ReactNode; description: ReactNode }[];
}) {
  return (
    <dl className="opale-description-list">
      {items.map((item, index) => (
        <span key={index}>
          <dt>{item.term}</dt>
          <dd>{item.description}</dd>
        </span>
      ))}
    </dl>
  );
}
export function BulletList({ items = [] }: { items?: readonly ReactNode[] }) {
  return (
    <ul className="opale-bullet-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
export function Rating({ value = 0, max = 5 }: { value?: number; max?: number }) {
  return (
    <span className="opale-rating" aria-label={`${value} sur ${max}`}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} aria-hidden="true">
          {index + 1 <= value ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}
export function StatCard({
  label,
  value,
  delta,
  liquidGlass = false,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  liquidGlass?: boolean;
}) {
  return (
    <Surface className="opale-stat-card" liquidGlass={liquidGlass}>
      <span className="opale-stat-card__label">{label}</span>
      <strong className="opale-stat-card__value">{value}</strong>
      {delta && <span className="opale-stat-card__delta">{delta}</span>}
    </Surface>
  );
}
export function Donut({
  value = 60,
  label = `${value}%`,
}: {
  value?: number;
  label?: string;
}) {
  return (
    <div
      className="opale-donut"
      data-label={label}
      style={{ '--opale-donut-value': `${value}%` } as CSSProperties}
      role="img"
      aria-label={label}
    />
  );
}
export function Legend({
  items = [],
}: {
  items?: readonly { label: ReactNode; color?: string }[];
}) {
  return (
    <div className="opale-stack opale-stack--wrap">
      {items.map((item, index) => (
        <span key={index} className="opale-stack">
          <Separator />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export interface DataTableProps {
  columns?: readonly { key: string; label: ReactNode }[];
  rows?: readonly Record<string, ReactNode>[];
}
export function DataTable({ columns = [], rows = [] }: DataTableProps) {
  return (
    <div className="opale-surface opale-panel">
      <table className="opale-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key}>{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Carousel({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('opale-card-grid', className)}>{children}</div>;
}
export function LegalLinks({ links = [] }: { links?: readonly NavItem[] }) {
  return (
    <nav className="opale-legal-links" aria-label="Liens légaux">
      {links.map((link) => (
        <a key={link.id} href={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}

export function FileCard({
  name,
  size,
  selected = false,
  onClick,
}: {
  name: string;
  size?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={cx('opale-surface', 'opale-file-card', selected && 'opale-liquid')}
      onClick={onClick}
    >
      <span className="opale-file-card__icon">⌁</span>
      <span>
        <strong>{name}</strong>
        {size && <small className="opale-field__helper">{size}</small>}
      </span>
    </button>
  );
}
export function Dropzone({
  onFiles,
  children = 'Déposez vos fichiers ici',
}: {
  onFiles?: (files: FileList) => void;
  children?: ReactNode;
}) {
  return (
    <label className="opale-dropzone">
      <input
        type="file"
        hidden
        multiple
        onChange={(event) => event.currentTarget.files && onFiles?.(event.currentTarget.files)}
      />
      <strong>{children}</strong>
      <span>Sélectionner des fichiers</span>
    </label>
  );
}
export function FileUploader({ onFiles }: { onFiles?: (files: FileList) => void }) {
  return <Dropzone onFiles={onFiles} />;
}
export function Lightbox({
  src,
  alt = '',
  open = false,
  onClose,
}: {
  src?: string;
  alt?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  return open && src ? (
    <div className="opale-lightbox" role="dialog" aria-label="Aperçu">
      <img src={src} alt={alt} />
      <Button variant="ghost" onClick={onClose}>
        Fermer
      </Button>
    </div>
  ) : null;
}
export function Map({ children = 'Carte interactive' }: { children?: ReactNode }) {
  return (
    <div className="opale-map" role="img" aria-label="Carte">
      {children}
    </div>
  );
}
export function RouteGuard({
  allowed = true,
  fallback = 'Accès refusé',
  children,
}: {
  allowed?: boolean;
  fallback?: ReactNode;
  children?: ReactNode;
}) {
  return allowed ? <>{children}</> : <Feedback severity="error">{fallback}</Feedback>;
}
export function I18n({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
export function Http({ status = 'API prête' }: { status?: ReactNode }) {
  return <StatusChip status={String(status)} />;
}
export function Validation({ valid = true }: { valid?: boolean }) {
  return <StatusChip status={valid ? 'Valide' : 'À corriger'} />;
}
export function Sound({ enabled = true }: { enabled?: boolean }) {
  return <Toggle label="Sons" defaultChecked={enabled} />;
}
export function LocalStore({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
export function Countdown({ seconds = 60 }: { seconds?: number }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className="opale-countdown" aria-live="polite">
      {remaining}s
    </span>
  );
}
export function Game({ score = 0 }: { score?: number }) {
  return (
    <div className="opale-surface opale-game">
      <Heading level={3}>Partie</Heading>
      <strong className="opale-stat-card__value">{score}</strong>
      <Button size="small">Continuer</Button>
    </div>
  );
}
export function Clipboard({
  value,
  children = 'Copier',
}: {
  value: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="small"
      variant="tonal"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setCopied(true);
      }}
    >
      {copied ? 'Copié' : children}
    </Button>
  );
}
export function SvgMap({ children }: { children?: ReactNode }) {
  return (
    <svg className="opale-svg-map" viewBox="0 0 400 180" role="img" aria-label="Carte SVG">
      <path
        d="M20 135 C80 35 135 165 205 75 S325 35 380 125"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        opacity=".35"
      />
      {children}
    </svg>
  );
}

export interface CatalogEntry {
  readonly name: string;
  readonly category: string;
  readonly description: string;
}

export const OPALE_CATALOG: readonly CatalogEntry[] = [
  ['Button', 'Inputs', "Bouton d'action avec variantes, tailles et état de chargement."],
  ['Pressable', 'Inputs', 'Surface cliquable sans apparence : forme, focus et sélection.'],
  ['InlineInput', 'Inputs', "Champ d'édition en place : Entrée valide, Échap abandonne."],
  ['Input', 'Inputs', 'Champ de saisie avec validation, icône et types spécialisés.'],
  ['Checkbox', 'Inputs', 'Case à cocher avec label, sous-label et état indéterminé.'],
  ['Toggle', 'Inputs', 'Interrupteur animé pour les états binaires.'],
  ['Slider', 'Inputs', 'Curseur contrôlé avec libellé, valeur et graduations.'],
  ['MultiSelect', 'Inputs', 'Sélection multiple avec chips et liste déroulante.'],
  ['Select', 'Inputs', 'Sélecteur mono-valeur avec libellé accessible et options illustrées.'],
  ['Autocomplete', 'Inputs', 'Champ à suggestions avec filtrage et présélection.'],
  ['Form', 'Inputs', 'Formulaire orchestré par les primitives contrôlées.'],
  ['LanguageSelector', 'Inputs', "Sélecteur de langue branché sur l'i18n."],
  ['SegmentedControl', 'Inputs', 'Sélecteur segmenté animé pour choisir une option.'],
  ['ThemeToggle', 'Inputs', 'Bascule de thème clair ou sombre, avec matériau local.'],
  ['AddButton', 'Boutons spécialisés', "Bouton d'ajout avec icône plus intégrée."],
  ['SaveButton', 'Boutons spécialisés', "Bouton d'enregistrement unique, avec confirmation."],
  ['ApproveButton', 'Boutons spécialisés', 'Bouton de validation avec icône check.'],
  ['EditButton', 'Boutons spécialisés', "Bouton d'édition avec icône crayon."],
  ['DeleteButton', 'Boutons spécialisés', 'Bouton de suppression avec confirmation intégrée.'],
  ['IconActionButton', 'Boutons spécialisés', "Bouton d'action carré à icône."],
  ['Card', 'Affichage de données', 'Carte avec titre, sous-titre, actions et élévations.'],
  ['CardGrid', 'Affichage de données', 'Grille responsive auto-adaptative pour cartes.'],
  ['Carousel', 'Affichage de données', 'Carrousel de cartes avec navigation.'],
  ['DataTable', 'Affichage de données', 'Table riche avec tri, sélection et clavier.'],
  ['DescriptionList', 'Affichage de données', 'Liste de paires libellé / valeur.'],
  ['BulletList', 'Affichage de données', 'Liste à puces avec icônes personnalisables.'],
  ['StatusChip', 'Affichage de données', 'Pastille de statut en plusieurs tonalités.'],
  ['Badge', 'Affichage de données', 'Pastille de compteur ou point de notification.'],
  ['Rating', 'Affichage de données', 'Note moyenne en étoiles, remplissage fractionnaire.'],
  ['StatCard', 'Affichage de données', 'Carte de métrique avec valeur, variation et icône.'],
  ['Donut', 'Affichage de données', 'Graphique en anneau segmenté avec contenu central.'],
  ['LegalLinks', 'Affichage de données', 'Pied de page légal et mentions.'],
  ['Legend', 'Affichage de données', 'Légende de statuts pour tableaux et graphiques.'],
  ['Heading', 'Affichage de données', 'Titres hiérarchisés avec échelle typographique.'],
  ['Text', 'Affichage de données', 'Corps de texte, labels, légendes et métriques.'],
  ['Icon', 'Affichage de données', 'Icônes Opale en plusieurs tailles.'],
  ['Feedback', 'Feedback', 'Encart de message contextuel en quatre sévérités.'],
  ['Toast', 'Feedback', 'Notification éphémère avec fermeture automatique.'],
  ['Spinner', 'Feedback', 'Indicateur de chargement circulaire.'],
  ['ProgressBar', 'Feedback', 'Barre de progression déterminée ou segmentée.'],
  ['ConfirmDialog', 'Feedback', "Boîte de dialogue de confirmation d'action."],
  ['EmptyState', 'Feedback', 'État vide illustré avec titre, description et action.'],
  ['Navbar', 'Navigation', 'Barre de navigation responsive avec sous-menus.'],
  ['Menu', 'Navigation', 'Menu contextuel positionnable avec items.'],
  ['Link', 'Navigation', 'Lien stylé compatible avec les routeurs externes.'],
  ['SidePanel', 'Navigation', 'Panneau latéral coulissant avec titre et footer.'],
  ['SettingsMenu', 'Navigation', 'Menu de réglages : thème, langue et session.'],
  ['CommandPalette', 'Navigation', 'Palette de commandes avec recherche clavier.'],
  ['Breadcrumb', 'Navigation', "Fil d'Ariane avec repli automatique."],
  ['Toolbar', 'Navigation', 'Barre d’outils : recherche, tri et actions.'],
  ['CookieBanner', 'Navigation', 'Bandeau de consentement avec mémorisation.'],
  ['Scrollbar', 'Navigation', 'Barre de défilement appliquée par le thème.'],
  ['SelectionBar', 'Navigation', "Barre d'actions groupées sur sélection multiple."],
  ['Stack', 'Mise en page', 'Empilement flexbox avec gaps issus des tokens.'],
  ['Layout', 'Mise en page', 'Gabarit de page avec navigation et contenu.'],
  ['PageScaffold', 'Mise en page', 'Squelette complet : navigation, contenu et footer.'],
  ['PageContent', 'Mise en page', 'Conteneur de contenu avec en-tête et footer.'],
  ['Divider', 'Mise en page', 'Séparateur horizontal ou vertical.'],
  ['Separator', 'Mise en page', 'Séparateur décoratif léger.'],
  ['BackgroundSurface', 'Mise en page', 'Fond animé par thème.'],
  ['ShapeBackground', 'Mise en page', 'Arrière-plan décoratif à formes organiques.'],
  ['SlidingIndicator', 'Mise en page', 'Indicateur coulissant partagé entre éléments.'],
  ['FileUploader', 'Modules', 'Upload de fichiers par chunks.'],
  ['FileCard', 'Modules', 'Carte de fichier ou dossier avec aperçu et sélection.'],
  ['Dropzone', 'Modules', 'Zone de dépôt par glisser-déposer ou sélection.'],
  ['Lightbox', 'Modules', "Visionneuse plein écran d'images et documents."],
  ['Map', 'Modules', 'Carte avec marqueurs, bulles et clic.'],
  ['RouteGuard', 'Modules', 'Garde de routes et redirections.'],
  ['I18n', 'Modules', 'Provider d’internationalisation et messages.'],
  ['Http', 'Modules', 'Client API avec gestion d’erreurs normalisée.'],
  ['Validation', 'Modules', 'Règles de validation réutilisables.'],
  ['Sound', 'Modules', 'Sons sémantiques, coupure et volume.'],
  ['LocalStore', 'Modules', 'État local typé, versionné et synchronisé.'],
  ['Countdown', 'Modules', 'Compte à rebours calé sur une échéance absolue.'],
  ['Game', 'Modules', 'Pièces de partie, série et grille partageable.'],
  ['Clipboard', 'Modules', 'Copie dans le presse-papier avec état fugace.'],
  ['SvgMap', 'Modules', 'Carte SVG gestuelle et accessible au clavier.'],
].map(([name, category, description]) => ({ name, category, description }));

export const OpaleUI = {
  Button: Button,
  Pressable: Pressable,
  Card: Card,
  CardGrid: CardGrid,
  Input: Input,
  InlineInput: InlineInput,
  Checkbox: Checkbox,
  Toggle: Toggle,
  Slider: Slider,
  Select: Select,
  MultiSelect: MultiSelect,
  Autocomplete: Autocomplete,
  Form: Form,
  LanguageSelector: LanguageSelector,
  SegmentedControl: SegmentedControl,
  ThemeToggle: ThemeToggle,
  AddButton: AddButton,
  SaveButton: SaveButton,
  ApproveButton: ApproveButton,
  EditButton: EditButton,
  DeleteButton: DeleteButton,
  IconActionButton: IconActionButton,
  Carousel: Carousel,
  DataTable: DataTable,
  DescriptionList: DescriptionList,
  BulletList: BulletList,
  StatusChip: StatusChip,
  Badge: Badge,
  Rating: Rating,
  StatCard: StatCard,
  Donut: Donut,
  LegalLinks: LegalLinks,
  Legend: Legend,
  Heading: Heading,
  Text: Text,
  Icon: Icon,
  Feedback: Feedback,
  Toast: Toast,
  Spinner: Spinner,
  ProgressBar: ProgressBar,
  ConfirmDialog: ConfirmDialog,
  EmptyState: EmptyState,
  Navbar: Navbar,
  Menu: Menu,
  Link: Link,
  SidePanel: SidePanel,
  SettingsMenu: SettingsMenu,
  CommandPalette: CommandPalette,
  Breadcrumb: Breadcrumb,
  Toolbar: Toolbar,
  CookieBanner: CookieBanner,
  Scrollbar: Scrollbar,
  SelectionBar: SelectionBar,
  Stack: Stack,
  Layout: Layout,
  PageScaffold: PageScaffold,
  PageContent: PageContent,
  Divider: Divider,
  Separator: Separator,
  BackgroundSurface: BackgroundSurface,
  ShapeBackground: ShapeBackground,
  SlidingIndicator: SlidingIndicator,
  FileUploader: FileUploader,
  FileCard: FileCard,
  Dropzone: Dropzone,
  Lightbox: Lightbox,
  Map: Map,
  RouteGuard: RouteGuard,
  I18n: I18n,
  Http: Http,
  Validation: Validation,
  Sound: Sound,
  LocalStore: LocalStore,
  Countdown: Countdown,
  Game: Game,
  Clipboard: Clipboard,
  SvgMap: SvgMap,
} as const;

/** Namespace public Opale pour les composants du catalogue V3. */
export const Opale = { ...OpaleUI, Background: BackgroundSurface } as const;
