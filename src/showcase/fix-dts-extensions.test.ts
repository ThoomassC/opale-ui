import { describe, expect, it } from 'vitest';

import { addJsExtensions } from '../../scripts/fix-dts-extensions.mjs';

/* UN CONSOMMATEUR EN `nodenext` EXIGE L'EXTENSION. Les `.d.ts` publiés
   recopiaient `from './components'` : TS2834, puis « no exported member
   Button ». Le build les complète désormais. */
describe('les déclarations publiées', () => {
  const kinds: Record<string, 'file' | 'dir'> = {
    './opale': 'file',
    './components': 'dir',
    '../glass/Glass': 'file',
  };
  const kindOf = (specifier: string) => kinds[specifier] ?? null;

  it('complète un fichier par .js et un dossier par /index.js', () => {
    expect(addJsExtensions("export * from './components';", kindOf)).toBe(
      "export * from './components/index.js';",
    );
    expect(addJsExtensions("import { Button } from './opale';", kindOf)).toBe(
      "import { Button } from './opale.js';",
    );
    expect(addJsExtensions('type G = import("../glass/Glass").GlassProps;', kindOf)).toBe(
      'type G = import("../glass/Glass.js").GlassProps;',
    );
  });

  it('laisse intacts les paquets, les extensions déjà là et ce qu’il ne reconnaît pas', () => {
    const untouched = [
      "import type { ReactNode } from 'react';",
      "export * from './opale.js';",
      "import './styles.css';",
      "export * from './inconnu';",
    ];
    for (const line of untouched) expect(addJsExtensions(line, kindOf)).toBe(line);
  });
});
