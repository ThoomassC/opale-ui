import { Opale } from '../../../../opale';

/* =============================================================================
   L'ÉQUIVALENT DE LA CARTE : LA MÊME SÉLECTION, EN LISTE.

   Une région de carte a la taille que lui donne la géographie. Sur un
   téléphone, la Lettonie mesure dix pixels sur quatre, un département de la
   petite couronne à peine plus : bien sous les 24 px que WCAG 2.5.8 demande à
   une cible. Le critère admet une exception — la même action offerte ailleurs
   sur la page, par un contrôle qui, lui, a la taille voulue. C'est ce
   sélecteur : natif, donc la roue du téléphone, et branché sur le MÊME
   gestionnaire que le clic sur la carte.

   IL N'A PAS D'ÉTAT. Sa valeur est celle que l'appelant lui passe — vide pour
   une action ponctuelle (basculer un pays), la réponse donnée pour un choix
   qui reste (le quiz).
   ========================================================================== */

export interface RegionPickerOption {
  readonly id: string;
  readonly label: string;
}

export interface RegionPickerProps {
  readonly label: string;
  readonly placeholder: string;
  readonly options: readonly RegionPickerOption[];
  /** L'identifiant affiché ; chaîne vide pour la ligne d'invite. */
  readonly value: string;
  readonly onPick: (id: string) => void;
  readonly helperText?: string;
  readonly disabled?: boolean;
  readonly liquidGlass?: boolean;
}

export function RegionPicker({
  label,
  placeholder,
  options,
  value,
  onPick,
  helperText,
  disabled = false,
  liquidGlass = false,
}: RegionPickerProps) {
  return (
    <Opale.Select
      label={label}
      helperText={helperText}
      value={value}
      disabled={disabled}
      liquidGlass={liquidGlass}
      onChange={(event) => {
        const id = event.currentTarget.value;
        if (id) onPick(id);
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </Opale.Select>
  );
}
