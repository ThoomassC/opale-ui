import { createContext, type ChangeEventHandler, type FocusEventHandler, type Ref } from 'react';

import type { OpaleSize } from '../../shared';

/** Ce que le groupe transmet à chacun de ses radios. Interne. */
export interface RadioGroupContextValue {
  name: string;
  /** Présente, le groupe est contrôlé : chaque radio porte `checked`. */
  value: string | undefined;
  /** Libre, chaque radio porte `defaultChecked`, que `form.reset()` rétablit. */
  defaultValue: string | undefined;
  required: boolean;
  form: string | undefined;
  size: OpaleSize;
  liquidGlass: boolean;
  inputRef: Ref<HTMLInputElement> | undefined;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
