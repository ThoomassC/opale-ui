/* =============================================================================
   LE JOURNAL DES VERSIONS, ÉCRIT DEPUIS LES NOTES DE LA VITRINE.

   DOCS-03 — `src/showcase/releases.ts` est la seule source des notes : la page
   « Versions » les affiche, ce script les écrit dans `CHANGELOG.md`, qui part
   avec l'archive. Aucun des deux ne s'écrit à la main.

   `node scripts/changelog.mjs` (ou `npm run changelog`) réécrit le fichier ;
   `--check` échoue s'il n'est plus à jour. Le module TypeScript est importé
   tel quel : Node 24 (`.nvmrc`) retire les annotations de type à la volée,
   sans outil de build. `src/changelog.structure.test.ts` fait la même
   comparaison dans la suite, sur toutes les versions de Node.
   ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const HEADER = [
  '# Journal des versions',
  '',
  'Généré par `npm run changelog` depuis `src/showcase/releases.ts` : ne pas modifier à la main.',
  'Les mêmes notes, avec leurs démonstrations, sont sur la page « Versions » de la vitrine.',
];

const fence = (code) => ['```tsx', code, '```'];

/** Une version en Markdown : résumé, changements, migration, retraits. */
function renderRelease(release) {
  const lines = [`## ${release.version} — ${release.dateLabel}`, ''];
  if (release.breaking) lines.push('**Rupture.**', '');
  lines.push(release.summary, '');

  if (release.sections?.length) {
    for (const section of release.sections) {
      lines.push(`### ${section.title}`, '');
      for (const change of section.changes) lines.push(`- **${change.title}** — ${change.detail}`);
      lines.push('');
    }
  } else if (release.changes.length) {
    for (const change of release.changes) lines.push(`- ${change}`);
    lines.push('');
  }

  if (release.migration) {
    lines.push(`### Migrer depuis la ${release.migration.fromVersion}`, '');
    for (const step of release.migration.steps) {
      lines.push(`#### ${step.title}`, '', 'Avant :', '', ...fence(step.before), '');
      lines.push('Après :', '', ...fence(step.after), '');
    }
  }

  if (release.removedComponents?.length) {
    lines.push('### Composants retirés', '');
    for (const entry of release.removedComponents) {
      lines.push(`- ${entry.removed.map((name) => `\`${name}\``).join(', ')} : ${entry.guidance}`);
    }
    lines.push('');
  }
  return lines;
}

/** Le fichier entier, de la plus récente à la plus ancienne version. */
export function renderChangelog(releases) {
  const lines = [...HEADER, ''];
  for (const release of releases) lines.push(...renderRelease(release));
  return `${lines.join('\n').trimEnd()}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(import.meta.dirname, '..');
  const { RELEASES } = await import(pathToFileURL(resolve(root, 'src/showcase/releases.ts')).href);
  const target = resolve(root, 'CHANGELOG.md');
  const content = renderChangelog(RELEASES);

  if (process.argv.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(target, 'utf8');
    } catch {
      /* absent : pas à jour non plus. */
    }
    if (current !== content) {
      console.error('✗ CHANGELOG.md n’est plus à jour des notes : lancez « npm run changelog ».');
      process.exit(1);
    }
    console.log(`✓ CHANGELOG.md à jour (${RELEASES.length} versions).`);
  } else {
    writeFileSync(target, content);
    console.log(`CHANGELOG.md écrit depuis src/showcase/releases.ts (${RELEASES.length} versions).`);
  }
}
