import type { OpalePlacement } from '../shared';

/* Les ancres de `Toast` : une par place, partagée par les messages de cette
   place, née avec le premier et retirée après le dernier. Le magasin sert
   `useSyncExternalStore`. */

/** L'ancre d'une place : sa racine et ses deux régions live. */
export interface ToastAnchor {
  readonly status: HTMLDivElement;
  readonly alert: HTMLDivElement;
  readonly root: HTMLDivElement;
  users: number;
}

const TOAST_ANCHORS = new Map<OpalePlacement, ToastAnchor>();
/* Les abonnés, par place : seuls ceux dont l'ancre naît ou disparaît sont
   prévenus. Un message qui rejoint une ancre existante ne change rien. */
const toastAnchorListeners = new Map<OpalePlacement, Set<() => void>>();

function notifyToastAnchor(position: OpalePlacement) {
  toastAnchorListeners.get(position)?.forEach((listener) => listener());
}

/** Occupe l'ancre de `position` ; vrai si elle vient d'être créée. */
function acquireToastAnchor(position: OpalePlacement): boolean {
  let anchor = TOAST_ANCHORS.get(position);
  const created = !anchor;
  if (!anchor) {
    const root = document.createElement('div');
    root.className = `opale-toast-anchor opale-toast-anchor--${position}`;
    const status = document.createElement('div');
    status.setAttribute('role', 'status');
    const alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    root.append(status, alert);
    if (position.startsWith('top')) document.body.prepend(root);
    else document.body.append(root);
    anchor = { root, status, alert, users: 0 };
    TOAST_ANCHORS.set(position, anchor);
  }
  anchor.users += 1;
  return created;
}

/* LA DESTRUCTION ATTEND LA FIN DU COMMIT. Un message qui en remplace un autre
   — `key` qui change — démonte l'ancien et monte le nouveau dans le même
   commit, et le nettoyage du premier passe avant l'abonnement du second. Le
   retrait est donc remis à une micro-tâche, et n'a lieu que si personne n'a
   repris l'ancre entre-temps : le message suivant entre dans des régions live
   déjà surveillées. */
function releaseToastAnchor(position: OpalePlacement) {
  const anchor = TOAST_ANCHORS.get(position);
  if (!anchor) return;
  anchor.users -= 1;
  if (anchor.users > 0) return;
  queueMicrotask(() => {
    if (anchor.users > 0 || TOAST_ANCHORS.get(position) !== anchor) return;
    anchor.root.remove();
    TOAST_ANCHORS.delete(position);
    notifyToastAnchor(position);
  });
}

/** L'ancre de `position`, ou `null` si aucun message ne l'occupe. */
export function getToastAnchor(position: OpalePlacement): ToastAnchor | null {
  return TOAST_ANCHORS.get(position) ?? null;
}

/**
 * Occupe l'ancre de `position` — la crée si l'on est le premier — et abonne
 * `listener` à ses changements. La fonction rendue libère l'ancre.
 */
export function subscribeToastAnchor(position: OpalePlacement, listener: () => void) {
  let listeners = toastAnchorListeners.get(position);
  if (!listeners) {
    listeners = new Set();
    toastAnchorListeners.set(position, listeners);
  }
  listeners.add(listener);
  if (acquireToastAnchor(position)) notifyToastAnchor(position);
  return () => {
    listeners.delete(listener);
    releaseToastAnchor(position);
  };
}
