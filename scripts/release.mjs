#!/usr/bin/env node
/* =============================================================================
   LA LIVRAISON POSE LE TAG, PARCE QU'UN HUMAIN L'A OUBLIÉ QUATRE FOIS.

   LE DÉFAUT RÉEL, RELEVÉ LE 21 SEPTEMBRE 2026 : `package.json` annonçait 2.0.0,
   la vitrine affichait « v2.0.0 », et le dépôt distant ne portait que deux
   tags — v0.1.0 et v0.2.0. Les archives figées allaient pourtant jusqu'à
   v1.1.0. Conséquence : la commande d'installation affichée sur la page
   « Installation », construite depuis la version courante, pointait sur un tag
   INEXISTANT. Elle échouait pour toute version postérieure à 0.2.0, et rien ne
   le disait — ni un test, ni la page elle-même.

   POURQUOI UN SCRIPT ET PAS SEULEMENT UN TEST. Un test « le tag existe »
   rougit pendant toute la préparation d'une version, entre le moment où l'on
   monte le numéro et celui où l'on publie. Un garde rouge pendant des jours
   finit désactivé, et on retombe dans le défaut avec un test en moins. Ici la
   montée de version ET le tag se font dans le même geste, donc ils ne peuvent
   plus diverger. Le test qui les surveille (`release-tag.structure.test.ts`)
   n'a plus alors qu'à constater.

   Le script ne publie RIEN de lui-même : il refuse plus qu'il n'agit, et
   n'écrit que le tag, une fois toutes les vérifications passées.

   LIV-05 — ET IL ATTACHE UNE ARCHIVE CONSTRUITE À LA RELEASE. Installé par
   son tag Git, le paquet se compile chez le consommateur (`prepare`) : il lui
   faut toute la chaîne de build, `npm ci --ignore-scripts` livre un paquet
   sans `dist/`, et pnpm 10 bloque ce script par défaut. Avant le tag, le
   script construit `dist/`, le vérifie et l'emballe (`npm pack
   --ignore-scripts`) ; après, il attache l'archive à une release GitHub : elle
   s'installe avec npm, pnpm ou yarn sans rien compiler. Le tag Git reste une
   voie d'installation — `prepare` est gardé pour ne casser personne.

   `gh` est vérifié AVANT de poser le tag : découvrir à la fin qu'il manque
   laisserait un tag publié sans archive — comme un build rouge, d'où
   l'archive construite avant le tag. Si la release échoue quand même
   après le push, le tag n'est PAS supprimé (il a peut-être déjà été
   installé) : le script donne la commande exacte pour rejouer l'étape.
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

import {
  branchBlocker,
  breakingBlocker,
  highestTag,
  isBreakingEntry,
  releaseAssetName,
  releaseAssetUrl,
  releaseBlocker,
} from './release-guard.mjs';
import { packStaged } from './pack.mjs';

const DRY_RUN = process.argv.includes('--dry-run');

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

const root = resolve(import.meta.dirname, '..');

/** Une commande visible : sa sortie défile, son échec lève une erreur. */
function run(command, ...args) {
  execFileSync(command, args, { cwd: root, stdio: 'inherit' });
}

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

/** La version du manifeste, seule source de vérité. */
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`« ${version} » n'est pas une version de publication (trois nombres, rien d'autre).`);
}

const tag = `v${version}`;

/* 1. L'arbre doit être propre : un tag pose une étiquette sur un commit, pas
      sur ce qu'on a sous la main. Taguer avec des modifications non validées
      produit une archive qui ne correspond à rien de reproductible. */
if (git('status', '--porcelain')) {
  fail('Des modifications ne sont pas validées. Un tag doit désigner un commit, pas un brouillon.');
}

/* 1 bis. La version sort de `recette` : c'est la branche recettée. */
const branchBlock = branchBlocker(git('rev-parse', '--abbrev-ref', 'HEAD'));

if (branchBlock) {
  fail(branchBlock);
}

/* 2. La vitrine doit annoncer la même version que le manifeste. `version.test.ts`
      le vérifie déjà, mais un script de publication qui fait confiance à la
      suite d'un autre est un script qui publie une incohérence le jour où la
      suite n'a pas tourné. */
const shown = readFileSync(new URL('../src/showcase/version.ts', import.meta.url), 'utf8');

if (!shown.includes(`'${version}'`)) {
  fail(`src/showcase/version.ts n'annonce pas ${version} : la vitrine mentirait sur sa version.`);
}

/* 3. La version doit avoir des notes. Sans cela on publie un numéro que
      personne ne peut relier à un changement. */
const releases = readFileSync(new URL('../src/showcase/releases.ts', import.meta.url), 'utf8');

if (!releases.includes(`version: '${version}'`)) {
  fail(`Aucune entrée « ${version} » dans src/showcase/releases.ts. Écrivez les notes d'abord.`);
}

/* 4. Un tag ne se réécrit pas, et une version doit dépasser TOUT ce qui est
      publié. Celui qui existe a peut-être déjà été installé ; un numéro plus
      bas que le plus haut tag passerait, pour semver, pour une version plus
      ancienne — voir `release-guard.mjs`. */
const tags = git('tag', '--list').split('\n');
const blocker = releaseBlocker(version, tags);

if (blocker) {
  fail(blocker);
}

/* 5. Une entrée en rupture change la majeure (LIV-07) : sinon une borne ^X.Y
      installe la rupture sans prévenir. */
const breaking = breakingBlocker(version, isBreakingEntry(releases, version), highestTag(tags));

if (breaking) {
  fail(breaking);
}

/* 6. `gh` doit être installé et authentifié : c'est lui qui crée la release et
      y attache l'archive. Vérifié avant le tag, pour ne pas publier un tag
      sans archive faute d'outil. */
try {
  execFileSync('gh', ['--version'], { stdio: 'ignore' });
} catch {
  fail(
    'La CLI GitHub (gh) est introuvable. Installez-la (https://cli.github.com) : ' +
      "elle crée la release et y attache l'archive construite.",
  );
}

try {
  execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
} catch {
  fail("gh n'est pas authentifié. Lancez « gh auth login », puis relancez la publication.");
}

const asset = releaseAssetName(version);
const notes = [
  `Opale UI ${version}. Notes détaillées : page « Versions » de la vitrine.`,
  '',
  'Installation recommandée — archive construite, sans compilation (npm, pnpm, yarn) :',
  '',
  `    npm i ${releaseAssetUrl(tag, version)}`,
  '',
  'Alternative npm — tag Git, compilé à l’installation (demande la chaîne de build ; pnpm 10 le refuse, prenez l’archive) :',
  '',
  `    npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#${tag}"`,
].join('\n');

/* 7. La suite, puis l'archive, AVANT le tag : construite depuis ce commit
      (l'arbre est propre), vérifiée, emballée sans relancer `prepare`. Un build rouge
      arrête tout ici, sans rien publier — après le push, ce même commit
      échouerait pareil, et le tag resterait sans archive pour toujours.
      Elle est rangée dans `dist-release/` (ignoré par git), pas dans un
      dossier temporaire : une reprise après redémarrage la retrouve. */
/* ROB-14 — LA SUITE ENTIÈRE, PAS SEULEMENT LE BUILD. Ne relancer que
   `build:lib` et `check:dist` laissait partir une archive d'un commit dont la
   CI était rouge, ou n'avait pas tourné : c'est exactement la confiance
   aveugle refusée à l'étape 2. D'abord ce qui ne demande pas `dist/` (le plus
   rapide à échouer), puis ce qui le lit. `--dry-run` les joue toutes : il dit
   si la publication passerait, pas seulement si l'archive se construit.
   `release-script.structure.test.ts` tient ces deux listes. */
const CHECKS_BEFORE_BUILD = ['typecheck', 'lint', 'test'];
const CHECKS_ON_BUILD = ['check:dist', 'check:size', 'check:consumer'];

const work = join(root, 'dist-release', tag);
const tarball = join(work, asset);
const notesFile = join(work, 'notes.md');
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
writeFileSync(notesFile, `${notes}\n`);

try {
  for (const script of CHECKS_BEFORE_BUILD) run('npm', 'run', script);
  run('npm', 'run', 'build:lib');
  for (const script of CHECKS_ON_BUILD) run('npm', 'run', script);

  /* INT-16 — emballée depuis un dossier de préparation, avec un manifeste
     sans scripts ni dépendances de développement (voir `pack.mjs`). */
  const produced = packStaged(root, work);

  if (produced !== asset || !existsSync(tarball)) {
    throw new Error(`npm pack a produit « ${produced} », la garde attend « ${asset} ».`);
  }
} catch (error) {
  fail(`La suite ou l'archive a échoué ; aucun tag n'a été posé.\n  ${error.message}`);
}

if (DRY_RUN) {
  console.log(`\n✓ Prêt à publier ${tag} sur ${git('rev-parse', '--short', 'HEAD')}.`);
  console.log(`  Archive construite et vérifiée : ${tarball}`);
  console.log('  (--dry-run : ni tag ni release)\n');
  process.exit(0);
}

git('tag', '-a', tag, '-m', `Opale UI ${version}`);
git('push', 'origin', tag);

console.log(`\n✓ ${tag} publié sur ${git('rev-parse', '--short', 'HEAD')}.`);

/* 8. La release : la seule étape qui a besoin du tag. Un échec ici ne retire
      pas le tag (il a peut-être déjà été installé) ; l'archive et les notes
      restent sur le disque, donc la reprise n'a plus qu'à les envoyer. */
try {
  run(
    'gh',
    'release',
    'create',
    tag,
    tarball,
    '--title',
    `Opale UI ${version}`,
    '--notes-file',
    notesFile,
    '--verify-tag',
  );
} catch (error) {
  fail(
    `Le tag ${tag} est publié, mais la release et son archive ne le sont pas :\n  ${error.message}\n\n` +
      `  Ne supprimez pas le tag. Corrigez la cause (réseau, droits gh), puis rejouez :\n` +
      `  gh release create ${tag} "${tarball}" --title "Opale UI ${version}" --notes-file "${notesFile}" --verify-tag\n\n` +
      `  Si la release existe déjà sans archive, attachez-la seulement :\n` +
      `  gh release upload ${tag} "${tarball}"`,
  );
}

console.log(`✓ Release ${tag} créée avec ${asset}.`);
console.log(`  npm i ${releaseAssetUrl(tag, version)}`);
console.log(`  npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#${tag}"\n`);
