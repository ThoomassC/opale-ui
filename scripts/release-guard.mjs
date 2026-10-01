/* =============================================================================
   LA GARDE DE PUBLICATION : UNE VERSION DOIT DÉPASSER TOUT CE QUI EST PUBLIÉ.

   Le 24/09, un tag v4.0.0 a été posé, puis la ligne est redescendue en 2.x.
   Pour semver, v4.0.0 restait la plus récente : « le dernier tag » ou ^4
   installaient un code antérieur à la 2.2.0. Vérifier que le tag exact
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

/* LIV-07 — UNE RUPTURE CHANGE LA MAJEURE.

   2.1.1, 2.2.0 et 2.5.0 étaient marquées `breaking: true` : une borne ^2.1.0
   installait des composants retirés et des props devenues obligatoires.
   Avant 1.0, semver fait porter la rupture par la mineure. */

/** Pourquoi une version en rupture ne peut pas porter ce numéro, ou `null`. */
export function breakingBlocker(version, breaking, previous) {
  if (!breaking || !previous) return null;
  const [major, minor] = parse(version) ?? [];
  const [prevMajor, prevMinor] = parse(previous) ?? [];
  if (major === undefined || prevMajor === undefined) {
    throw new Error(`Version invalide : « ${major === undefined ? version : previous} ».`);
  }
  if (major === 0 && prevMajor === 0) {
    if (minor > prevMinor) return null;
    return `${version} est marquée en rupture : avant 1.0, elle doit monter la mineure (0.${prevMinor + 1}.0).`;
  }
  if (major > prevMajor) return null;
  return (
    `${version} est marquée en rupture mais garde la majeure ${prevMajor} : ` +
    `une borne ^${previous} l'installerait. Publiez ${prevMajor + 1}.0.0.`
  );
}

/** `true` si l'entrée `version` de releases.ts porte `breaking: true`. */
export function isBreakingEntry(releasesSource, version) {
  const start = releasesSource.indexOf(`version: '${version}'`);
  if (start === -1) return false;
  const next = releasesSource.indexOf("version: '", start + 1);
  const entry = releasesSource.slice(start, next === -1 ? undefined : next);
  return /\bbreaking:\s*true\b/.test(entry);
}

/* LIV-08 — LES VERSIONS SORTENT DE `recette`. */
const RELEASE_BRANCH = 'recette';

/** Pourquoi on ne publie pas depuis `branch`, ou `null`. */
export function branchBlocker(branch) {
  if (branch === 'HEAD') {
    return `HEAD est détachée : placez-vous sur ${RELEASE_BRANCH} pour publier.`;
  }
  if (branch !== RELEASE_BRANCH) {
    return `On publie depuis ${RELEASE_BRANCH}, pas depuis « ${branch} ».`;
  }
  return null;
}

/* LIV-05 — L'ARCHIVE CONSTRUITE, ATTACHÉE À LA RELEASE GITHUB.

   Installer depuis le tag Git fait tourner `prepare` chez le consommateur :
   il lui faut toute la chaîne de build (typescript, vite, sass…),
   `npm ci --ignore-scripts` livre un paquet sans `dist/`, et pnpm 10 bloque
   ce script par défaut. L'archive de `npm pack`, attachée à la release, arrive
   construite : aucun script ne tourne à l'installation.

   Le nom suit la règle de `npm pack` pour un paquet à portée : le « @ »
   tombe, le « / » devient « - ». */
const PACKAGE_NAME = '@thomascaron/opale-ui';
const REPOSITORY = 'ThoomassC/opale-ui';

/** Le fichier que `npm pack` produit pour `version`. */
export function releaseAssetName(version) {
  if (!parse(version) || version.startsWith('v')) {
    throw new Error(`Version invalide : « ${version} ».`);
  }
  return `${PACKAGE_NAME.replace(/^@/, '').replace('/', '-')}-${version}.tgz`;
}

/** L'adresse de téléchargement de l'archive attachée à la release `tag`. */
export function releaseAssetUrl(tag, version) {
  if (!/^v\d+\.\d+\.\d+$/.test(tag)) throw new Error(`Tag invalide : « ${tag} ».`);
  return `https://github.com/${REPOSITORY}/releases/download/${tag}/${releaseAssetName(version)}`;
}
