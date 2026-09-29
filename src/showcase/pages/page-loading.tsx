/** L'emplacement d'attente d'une page chargée à la demande. */
export function PageLoading() {
  return (
    <div className="tc-doc-page-loading" aria-busy="true">
      <span className="opale-visually-hidden">Chargement de la page</span>
    </div>
  );
}
