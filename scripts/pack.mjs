/* =============================================================================
   L'ARCHIVE S'EMBALLE DEPUIS UN DOSSIER DE PRÉPARATION.

   INT-16 — `npm pack` à la racine du dépôt livrait le `package.json` du
   dépôt : scripts (dont `prepare`), dépendances de développement,
   `private: true`. Rien de cela ne sert à qui installe l'archive, et
   `prepare` y invite même un gestionnaire à recompiler un paquet déjà
   construit.

   L'archive est donc emballée depuis un dossier de préparation qui ne
   contient que ce que `files` publie, et un manifeste réduit à une liste
   blanche. L'installation par tag Git n'est pas concernée : elle lit le vrai
   `package.json`, et a besoin de `prepare`.

   `src/package-pack.structure.test.ts` exige que chaque champ du manifeste
   soit classé ici, publié ou retiré.
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Ce qu'un consommateur, ou son gestionnaire de paquets, lit. */
export const PUBLISHED_FIELDS = [
  'name',
  'version',
  'description',
  'author',
  'license',
  'repository',
  'homepage',
  'bugs',
  'type',
  'engines',
  'sideEffects',
  'files',
  'exports',
  'peerDependencies',
  'peerDependenciesMeta',
  'dependencies',
];

/** Ce qui ne sert qu'au dépôt. */
export const DROPPED_FIELDS = ['private', 'scripts', 'devDependencies'];

/** Le manifeste de l'archive : la liste blanche, dans son ordre. */
export function packManifest(manifest) {
  return Object.fromEntries(
    PUBLISHED_FIELDS.filter((field) => field in manifest).map((field) => [field, manifest[field]]),
  );
}

/**
 * Emballe le paquet de `root` dans `destination` et rend le nom de l'archive.
 * Suppose `dist/` construit : aucun script ne tourne.
 */
export function packStaged(root, destination) {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const stage = mkdtempSync(join(tmpdir(), 'opale-pack-'));
  try {
    for (const entry of manifest.files) {
      if (!existsSync(join(root, entry))) throw new Error(`« ${entry} », listé dans files, est absent.`);
      cpSync(join(root, entry), join(stage, entry), { recursive: true });
    }
    writeFileSync(join(stage, 'package.json'), `${JSON.stringify(packManifest(manifest), null, 2)}\n`);
    return execFileSync(
      'npm',
      ['pack', '--silent', '--ignore-scripts', '--pack-destination', destination],
      { cwd: stage, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
    )
      .trim()
      .split('\n')
      .at(-1);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}
