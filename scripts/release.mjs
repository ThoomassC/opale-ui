#!/usr/bin/env node
/* =============================================================================
   LA LIVRAISON POSE LE TAG, PARCE QU'UN HUMAIN L'A OUBLIÉ QUATRE FOIS.

   LE DÉFAUT RÉEL, RELEVÉ LE 21 SEPTEMBRE 2026 : `package.json` annonçait 3.0.0,
   la vitrine affichait « v3.0.0 », et le dépôt distant ne portait que deux
   tags — v0.1.0 et v0.2.0. Les archives figées allaient pourtant jusqu'à
   v2.1.0. Conséquence : la commande d'installation affichée sur la page
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
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const DRY_RUN = process.argv.includes('--dry-run');

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
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

/* 4. Un tag ne se réécrit pas. Celui qui existe a peut-être déjà été installé
      par quelqu'un ; le déplacer changerait le code sous ses pieds. */
const existing = git('tag', '--list', tag);

if (existing) {
  fail(`Le tag ${tag} existe déjà. Montez la version plutôt que de réécrire une publication.`);
}

if (DRY_RUN) {
  console.log(`\n✓ Prêt à publier ${tag} sur ${git('rev-parse', '--short', 'HEAD')}.`);
  console.log('  (--dry-run : rien n’a été écrit)\n');
  process.exit(0);
}

git('tag', '-a', tag, '-m', `Opale UI ${version}`);
git('push', 'origin', tag);

console.log(`\n✓ ${tag} publié sur ${git('rev-parse', '--short', 'HEAD')}.`);
console.log(`  npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#${tag}"\n`);
