/* =============================================================================
   LA GARDE DE PUBLICATION : UNE VERSION DOIT DÉPASSER TOUT CE QUI EST PUBLIÉ.

   Le 24/09, un tag v4.0.0 a été posé, puis la ligne est redescendue en 3.x.
   Pour semver, v4.0.0 restait la plus récente : « le dernier tag » ou ^4
   installaient un code antérieur à la 3.2.0. Vérifier que le tag exact
   n'existe pas ne suffisait donc pas : il faut dépasser le plus haut.

   Fonctions pures, séparées du script, pour être testées sans toucher Git.
   ========================================================================== */

const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)$/;

/** Les trois nombres d'une version, ou `null` si ce n'en est pas une. */
function parse(version) {
  const match = SEMVER.exec(version);
  return match ? match.slice(1).map(Number) : null;
}

/** Négatif, nul ou positif, comme un comparateur de tri. */
export function compareVersions(left, right) {
  const a = parse(left);
  const b = parse(right);
  if (!a || !b) throw new Error(`Version invalide : « ${!a ? left : right} ».`);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

/** Le plus haut tag de version (`vX.Y.Z`), sans son « v », ou `null`. */
export function highestTag(tags) {
  const versions = tags.map((tag) => tag.trim()).filter((tag) => SEMVER.test(tag));
  if (versions.length === 0) return null;
  return versions.sort(compareVersions).at(-1).replace(/^v/, '');
}

/** Pourquoi `version` ne peut pas être publiée, ou `null` si elle le peut. */
export function releaseBlocker(version, tags) {
  if (tags.map((tag) => tag.trim()).includes(`v${version}`)) {
    return `Le tag v${version} existe déjà. Montez la version plutôt que de réécrire une publication.`;
  }
  const highest = highestTag(tags);
  if (highest && compareVersions(version, highest) <= 0) {
    return (
      `${version} n'est pas au-dessus du plus haut tag publié (v${highest}). ` +
      `Semver le tiendrait pour plus ancien : « le dernier tag » installerait v${highest}.`
    );
  }
  return null;
}
