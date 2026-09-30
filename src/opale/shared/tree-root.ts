/* =============================================================================
   LA PORTÉE D'ARBRE D'UN NŒUD (ROB-09). Interne : non réexporté.

   `document` est le document de la fenêtre qui a chargé le script. Un
   composant rendu dans une racine fantôme (`attachShadow`) ou dans une iframe
   n'y vit pas, et deux lectures y mentent en silence :
   - `document.activeElement` renvoie l'HÔTE fantôme — ou l'iframe —, jamais
     l'élément qui a le focus ;
   - `url(#id)` se résout dans la portée d'arbre de l'élément : un `<filter>`
     posé dans le `<body>` du document global y est introuvable.
   Ces aides partent donc du nœud lui-même.

   PAS D'`instanceof`. Le `Document` d'une iframe est construit par le
   `Document` de SA fenêtre : `doc instanceof Document` y est faux. Le type de
   nœud, lui, ne dépend d'aucune fenêtre.
   ========================================================================== */

const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

/** Le document ou la racine fantôme où vit `node` ; `null` s'il est détaché. */
export function treeRootOf(node: Node): Document | ShadowRoot | null {
  const root = node.getRootNode();
  if (root.nodeType === DOCUMENT_NODE) return root as Document;
  if (root.nodeType === DOCUMENT_FRAGMENT_NODE && 'host' in root) return root as ShadowRoot;
  return null;
}

/**
 * L'élément qui a le focus, lu dans la portée d'arbre de `node`.
 *
 * Dans une racine fantôme, c'est l'élément focalisé À L'INTÉRIEUR — ou `null`
 * si le focus est ailleurs. Pour un nœud détaché, on retombe sur le document
 * propriétaire : c'est ce que lisait le code avant cette aide.
 */
export function activeElementOf(node: Node): Element | null {
  return (treeRootOf(node) ?? node.ownerDocument)?.activeElement ?? null;
}
