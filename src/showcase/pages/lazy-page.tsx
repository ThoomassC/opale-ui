import { Suspense, use, type ComponentType, type ReactNode } from 'react';

import { PageLoading } from './page-loading';

/* =============================================================================
   Les pages se chargent à la demande. Leurs métadonnées (`slug`, `label`,
   `title`, `lede`) restent dans un petit module `*.page.tsx`, lu par le
   sommaire, la recherche et le titre sans rien charger ; seul `render`
   devient un chargeur.

   Le composant passerelle est toujours le même élément : il suspend sous
   `Suspense` avec `use()` tant que le morceau manque, puis rend la page. Il
   ne change jamais d'arbre, donc la page n'est jamais remontée. Déjà chargée,
   elle se rend sans suspendre : `preloadPages()` sert aux tests qui montent
   des pages.
   ========================================================================== */

const PRELOADERS: (() => Promise<unknown>)[] = [];

export function lazyPage<P extends object>(
  loader: () => Promise<ComponentType<P>>,
  props: P = {} as P,
): () => ReactNode {
  let Loaded: ComponentType<P> | null = null;
  let pending: Promise<void> | null = null;
  let failure: Error | null = null;

  /* Un échec de chargement est mémorisé et relancé à chaque rendu jusqu'au
     rechargement : `PageBoundary` l'affiche, et aucune requête n'est relancée.
     Il n'est pas consommé au rendu, React relançant de lui-même un rendu qui
     a levé avant d'appeler la frontière. */
  const load = () =>
    (pending ??= loader().then(
      (component) => {
        Loaded = component;
      },
      (error: unknown) => {
        failure = new Error(
          'Le contenu de cette page n’a pas pu être téléchargé — une nouvelle version a sans doute été publiée. Rechargez la page.',
          { cause: error },
        );
      },
    ));

  /* Le préchargement des tests, lui, réessaie : il remet la page à zéro avant
     de relancer, et remonte l'échec à qui l'attend. */
  PRELOADERS.push(async () => {
    if (failure) {
      failure = null;
      pending = null;
    }
    await load();
    if (failure) throw (failure as Error).cause;
  });

  function PageGate() {
    if (failure) throw failure;
    if (!Loaded) use(load());
    if (failure) throw failure;
    const Page = Loaded as ComponentType<P>;
    return <Page {...props} />;
  }

  return () => (
    <Suspense fallback={<PageLoading />}>
      <PageGate />
    </Suspense>
  );
}

/** Charge d'avance toutes les pages à la demande. Pour les tests, qui les montent d'un coup. */
export function preloadPages(): Promise<unknown> {
  return Promise.all(PRELOADERS.map((load) => load()));
}
