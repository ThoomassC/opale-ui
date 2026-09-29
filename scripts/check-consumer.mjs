#!/usr/bin/env node
/* =============================================================================
   LE PAQUET TEL QU'UNE APPLICATION LE REÇOIT.

   `check:dist` lit `dist/` depuis le dépôt ; il ne voit ni le champ `files`,
   ni les `exports`, ni une résolution de modules différente de la nôtre. Ce
   script emballe le paquet (`npm pack`), l'installe dans une application
   jetable et la compile deux fois : en `moduleResolution` `nodenext`, puis en
   `bundler`. Une déclaration qu'une de ces deux résolutions ne lit pas, un
   fichier oublié par `files`, un export absent : la CI échoue ici.

   Suppose `dist/` construit (`npm run build:lib`).
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const work = mkdtempSync(join(tmpdir(), 'opale-consumer-'));

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

try {
  const tarball = run('npm', ['pack', '--silent', '--ignore-scripts', '--pack-destination', work], root)
    .trim()
    .split('\n')
    .at(-1);

  const app = join(work, 'app');
  const target = join(app, 'node_modules', '@thomascaron', 'opale-ui');
  mkdirSync(target, { recursive: true });
  run('tar', ['-xzf', join(work, tarball), '-C', target, '--strip-components=1'], app);

  /* React et ses types viennent du dépôt : l'application ne teste que le
     paquet, pas le registre. */
  for (const dependency of ['react', 'react-dom', '@types']) {
    symlinkSync(join(root, 'node_modules', dependency), join(app, 'node_modules', dependency));
  }

  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'app', type: 'module' }));
  writeFileSync(
    join(app, 'index.tsx'),
    `import '@thomascaron/opale-ui/opale.css';
import { Button, Modal, type ButtonProps, type ModalProps } from '@thomascaron/opale-ui';
import { contrastRatio } from '@thomascaron/opale-ui/contract';

const props: ButtonProps = { variant: 'primary', size: 'small' };
const modal: Pick<ModalProps, 'open'> = { open: false };
export const view = (
  <>
    <Button {...props}>Valider</Button>
    <Modal open={modal.open} onOpenChange={() => undefined} title="Titre" />
  </>
);
export const ratio: number = contrastRatio('#ffffff', '#000000');
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
    console.log(`✓ application consommatrice compilée en moduleResolution ${resolution}.`);
  }
} catch (error) {
  console.error(`\n✗ le paquet emballé ne se compile pas chez un consommateur.\n${error.stdout ?? error.message}`);
  process.exitCode = 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
