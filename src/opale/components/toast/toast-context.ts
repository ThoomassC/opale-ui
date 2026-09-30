import { createContext, useContext } from 'react';

import type { OpalePlacement } from '../../shared';
import type { ToastAnimation, ToastDefinition } from './ToastProvider';

type ToastPosition = OpalePlacement;

/** Ce que `ToastProvider` met à disposition de `useToast`. */
export type ToastContextValue = {
  showToast: (toast: ToastDefinition) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  defaults: {
    duration: number;
    animation: ToastAnimation;
    position: ToastPosition;
    enableLiquidAnimation: boolean;
    liquidGlass: boolean;
  };
};

/**
 * Ce que rend `useToast` : `showToast`, `dismissToast`, `clearToasts` et les
 * réglages par défaut de la file. Sert à typer un habillage ou une doublure de
 * `useToast` dans un test.
 */
export type UseToastResult = ToastContextValue;

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): UseToastResult => {
  const context = useContext(ToastContext);
  /* Le message est en anglais et au mot près celui de l'origine : la page de
     vitrine le cite entre guillemets, et un appelant a pu l'écrire dans un
     test à lui. C'est une erreur de développement, pas un texte d'interface —
     elle n'a donc pas à suivre la langue du produit. */
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
