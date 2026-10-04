#!/usr/bin/env node
/* =============================================================================
   LE PAQUET TEL QU'UNE APPLICATION LE REÇOIT.

   `check:dist` lit `dist/` depuis le dépôt ; il ne voit ni le champ `files`,
   ni les `exports`, ni une résolution de modules différente de la nôtre. Ce
   script emballe le paquet (`npm pack`), l'installe dans une application
   jetable et la compile deux fois : en `moduleResolution` `nodenext`, puis en
   `bundler`. Une déclaration qu'une de ces deux résolutions ne lit pas, un
   fichier oublié par `files`, un export absent : la CI échoue ici.

   4.0.0 — l'application jetable écrit aussi deux usages RETIRÉS (l'export
   `OpaleUI`, la prop `onClose` de `Modal`), chacun sous `@ts-expect-error` :
   si l'un d'eux revenait dans les déclarations livrées, la directive
   deviendrait inutile et `tsc --strict` échouerait. `./tokens.css`, qui n'est
   plus publié, ne doit plus se résoudre.

   LIV-05 — c'est aussi l'archive attachée aux releases GitHub : elle doit
   arriver CONSTRUITE. Emballée et extraite sans aucun script, elle doit déjà
   contenir ses points d'entrée ; sinon l'installation recommandée livrerait
   un paquet vide, exactement le défaut qu'elle corrige.

   Suppose `dist/` construit (`npm run build:lib`).
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { SHEET_VARIANTS } from './css-variants.mjs';
import { packStaged } from './pack.mjs';

const root = resolve(import.meta.dirname, '..');
const work = mkdtempSync(join(tmpdir(), 'opale-consumer-'));

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

try {
  /* L'archive de la release, emballée de la même façon (INT-16). */
  const tarball = packStaged(root, work);

  const app = join(work, 'app');
  const target = join(app, 'node_modules', '@thomascaron', 'opale-ui');
  mkdirSync(target, { recursive: true });
  run('tar', ['-xzf', join(work, tarball), '-C', target, '--strip-components=1'], app);

  /* Aucun script n'a tourné : ce qui manque ici manquera chez le consommateur. */
  const missing = [
    'dist/opale/index.js',
    'dist/opale/index.d.ts',
    'dist/opale/opale.css',
    ...SHEET_VARIANTS.map((variant) => `dist/opale/${variant}`),
    'dist/contract/index.js',
    'CHANGELOG.md',
  ].filter((file) => !existsSync(join(target, file)));
  if (missing.length > 0) {
    throw new Error(`l'archive n'est pas construite, il lui manque : ${missing.join(', ')}`);
  }
  console.log(`✓ ${tarball} arrive construite, sans script d'installation.`);

  /* INT-16 — le manifeste de l'archive est celui d'un paquet, pas du dépôt :
     ni scripts (dont `prepare`), ni dépendances de développement, ni
     `private`. */
  const packed = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
  const leaked = ['scripts', 'devDependencies', 'private'].filter((field) => field in packed);
  if (leaked.length > 0) {
    throw new Error(`le package.json de l'archive porte encore : ${leaked.join(', ')}`);
  }
  console.log("✓ le package.json de l'archive n'a ni scripts, ni devDependencies, ni private.");

  /* React et ses types viennent du dépôt : l'application ne teste que le
     paquet, pas le registre. */
  for (const dependency of ['react', 'react-dom', '@types']) {
    symlinkSync(join(root, 'node_modules', dependency), join(app, 'node_modules', dependency));
  }

  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'app', type: 'module' }));

  /* INT-13 — un outil en résolution CommonJS (Jest par défaut, un script
     `require`) passe par la condition `default` des `exports` : sans elle,
     ERR_PACKAGE_PATH_NOT_EXPORTED. Les deux entrées doivent se résoudre, et le
     contrat, sans dépendance, se charger par `require()`. */
  writeFileSync(
    join(app, 'require.cjs'),
    `const assert = require('node:assert');
for (const specifier of [
  '@thomascaron/opale-ui',
  '@thomascaron/opale-ui/contract',
  ...${JSON.stringify(['opale.css', 'fonts.css', ...SHEET_VARIANTS])}.map(
    (sheet) => '@thomascaron/opale-ui/' + sheet,
  ),
]) {
  require.resolve(specifier);
}
assert.throws(
  () => require.resolve('@thomascaron/opale-ui/tokens.css'),
  { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' },
  './tokens.css ne doit plus être publié.',
);
const { contrastRatio } = require('@thomascaron/opale-ui/contract');
assert.strictEqual(Math.round(contrastRatio('#ffffff', '#000000')), 21);
`,
  );
  run(process.execPath, ['require.cjs'], app);
  console.log('✓ les entrées et les quatre feuilles se résolvent aussi par require() (condition « default »).');
  writeFileSync(
    join(app, 'index.tsx'),
    `import '@thomascaron/opale-ui/opale.css';
import '@thomascaron/opale-ui/opale.layered.css';
import '@thomascaron/opale-ui/opale-nofonts.css';
import '@thomascaron/opale-ui/opale-nofonts.layered.css';
import {
  Button,
  ICON_NAMES,
  Modal,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type ButtonProps,
  type ModalProps,
} from '@thomascaron/opale-ui';
// @ts-expect-error -- OpaleUI a été retiré en 4.0.0 : cet import doit rester une erreur.
import { OpaleUI } from '@thomascaron/opale-ui';
import { contrastRatio } from '@thomascaron/opale-ui/contract';

const props: ButtonProps = { variant: 'primary', size: 'small' };
const modal: Pick<ModalProps, 'open'> = { open: false };
export const view = (
  <>
    <Button {...props}>Valider</Button>
    <Modal open={modal.open} onOpenChange={() => undefined} title="Titre" />
    {/* @ts-expect-error -- onClose a été retiré en 4.0.0 : la prop doit rester refusée. */}
    <Modal open={false} onClose={() => undefined} title="Ancien nom" />
    {/* Les parties nommées, la seule forme qu'un Server Component peut lire. */}
    <Tabs defaultValue="a">
      <TabsList aria-label="Sections">
        <TabsTrigger value="a">A</TabsTrigger>
      </TabsList>
      <TabsContent value="a">{ICON_NAMES.length}</TabsContent>
    </Tabs>
  </>
);
export const ratio: number = contrastRatio('#ffffff', '#000000');
export const removed: unknown = OpaleUI;
`,
  );
  writeFileSync(join(app, 'css.d.ts'), "declare module '*.css';\n");

  const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  for (const [module, resolution] of [
    ['nodenext', 'nodenext'],
    ['esnext', 'bundler'],
  ]) {
    run(
      process.execPath,
      [
        tsc,
        '--noEmit',
        '--strict',
        '--jsx',
        'react-jsx',
        '--module',
        module,
        '--moduleResolution',
        resolution,
        '--target',
        'es2022',
        '--skipLibCheck',
        'false',
        'index.tsx',
        'css.d.ts',
      ],
      app,
    );
    console.log(
      `✓ application consommatrice compilée en moduleResolution ${resolution} (OpaleUI et Modal.onClose refusés).`,
    );
  }
} catch (error) {
  console.error(`\n✗ le paquet emballé ne se compile pas chez un consommateur.\n${error.stdout ?? error.message}`);
  process.exitCode = 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
