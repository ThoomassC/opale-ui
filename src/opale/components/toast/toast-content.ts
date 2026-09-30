import type { ReactNode } from 'react';

/* =============================================================================
   LE TEXTE PRINCIPAL D'UNE NOTIFICATION, SOUS SES DEUX NOMS (DOCS-04).
   Interne : non réexporté.

   `Toast` l'appelle `message`, `showToast` l'appelle `title`. Chacun accepte
   désormais les deux, et ce n'est pas une dépréciation : aucun nom ne sera
   retiré. Quand les deux sont donnés, le nom HISTORIQUE de l'API l'emporte —
   `message` pour `Toast`, `title` pour `showToast` — et un avertissement part,
   une fois, en développement.
   ========================================================================== */

type ToastApi = 'Toast' | 'showToast';

const HISTORICAL: Record<ToastApi, { readonly kept: string; readonly alias: string }> = {
  Toast: { kept: 'message', alias: 'title' },
  showToast: { kept: 'title', alias: 'message' },
};

/* Même garde que `deprecations.ts` : `process.env.NODE_ENV` traverse le build
   de la librairie, c'est le bundler de l'application qui le remplace. */
declare const process: { readonly env: { readonly NODE_ENV?: string } };

function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

const warned = new Set<ToastApi>();

/**
 * Le texte à afficher : `kept` s'il est donné, sinon `alias`. Avertit, une fois
 * par API, quand les deux le sont.
 */
export function resolveToastText(api: ToastApi, kept: ReactNode, alias: ReactNode): ReactNode {
  if (kept !== undefined && alias !== undefined && isDevelopment() && !warned.has(api)) {
    warned.add(api);
    const names = HISTORICAL[api];
    const note =
      api === 'Toast' ? ' ; `title` y reste l’attribut HTML natif de la carte (infobulle)' : '';
    console.warn(
      `[Opale] ${api} : \`${names.kept}\` et \`${names.alias}\` nomment le même texte — ` +
        `n’en passez qu’un. \`${names.kept}\` l’emporte${note}.`,
    );
  }
  return kept !== undefined ? kept : alias;
}

/** Oublie les avertissements déjà émis. Réservé aux tests. */
export function resetToastContentWarnings(): void {
  warned.clear();
}
