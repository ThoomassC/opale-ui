import { Suspense, use, type ComponentType, type ReactNode } from 'react';

/* =============================================================================
   LES PAGES SE CHARGENT À LA DEMANDE.

   La vitrine partait d'un seul bloc : ouvrir l'accueil téléchargeait les
   quatre-vingt-quatorze pages. Mesuré sur le paquet construit, les pages
   pèsent 47 ko gzip sur 143 ; React (56 ko) et la bibliothèque qu'utilise la
   coquille (31 ko) sont incompressibles. Les fondations, les composants écrits
   à la main et le catalogue passent donc en morceaux chargés à la navigation ;
   l'accueil et les guides, où l'on arrive d'abord, restent dans le paquet.

   LES MÉTADONNÉES RESTENT ET LE CONTENU PART. Le sommaire, la recherche et le
   titre de la page lisent `slug`, `label`, `title` et `lede` sans rien charger :
   ils vivent dans un petit module `*.page.tsx`, et seul `render` devient un
   chargeur.

   `use()` SOUS `Suspense`, ET JAMAIS DE REMONTAGE. Le composant passerelle est
   toujours le même élément : tant que le morceau n'est pas là, il suspend ;
   ensuite, il rend la page. Une version qui rendait `<Lazy />` au premier
   passage puis la page nue aux suivants changeait d'arbre au premier nouveau
   rendu — changement de langue compris — et remontait la page, état perdu.

   DÉJÀ CHARGÉE, ELLE SE REND SANS DÉTOUR. C'est ce qui garde synchrones les
   tests qui montent des pages : `preloadPages()` charge tout d'avance, et plus
   rien ne suspend.
   ========================================================================== */

const PRELOADERS: (() => Promise<unknown>)[] = [];

function PageLoading() {
  return (
    <div className="tc-doc-page-loading" aria-busy="true">
      <span className="opale-visually-hidden">Chargement de la page</span>
    </div>
  );
}

export function lazyPage<P extends object>(
  loader: () => Promise<ComponentType<P>>,
  props: P = {} as P,
): () => ReactNode {
  let Loaded: ComponentType<P> | null = null;
  let pending: Promise<void> | null = null;
  let failure: Error | null = null;

  /* UN ÉCHEC EST REMIS À `PageBoundary`, ET IL Y RESTE. Un morceau introuvable
     — une version déployée entre-temps a changé son empreinte — rejette.
     Oublier la promesse avant que React la voie le faisait relancer un
     chargement à chaque tentative de rendu : soixante-neuf requêtes en une
     seconde et demie sur un réseau lent, l'emplacement d'attente sans fin, et
     l'erreur jamais montrée.

     L'ÉCHEC N'EST PAS CONSOMMÉ AU RENDU, parce que React relance de lui-même
     un rendu qui a levé avant d'appeler la frontière : consommé au premier
     lancer, il repartait en chargement au second. Il reste donc levé pour
     cette page jusqu'au rechargement — le seul remède d'ailleurs, puisque le
     morceau disparu ne reviendra pas —, et le message le dit. */
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
