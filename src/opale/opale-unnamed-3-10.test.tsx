import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetDeprecationWarnings } from './deprecations';
import { RadioGroup, Textarea } from './index';

/* LES NOUVEAUX CHAMPS DE LA 2.10 SE SIGNALENT SANS NOM, comme Toggle : une
   zone de texte ou un groupe de boutons radio sans libellé reste muet pour un
   lecteur d'écran. L'avertissement ne part qu'en développement, une fois. */
describe('avertissement de nom manquant (3.10)', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetDeprecationWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('devrait signaler une Textarea sans nom, et se taire avec un libellé', () => {
    render(<Textarea />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Opale] Textarea'));

    warn.mockClear();
    resetDeprecationWarnings();
    render(<Textarea label="Message" />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('devrait signaler un RadioGroup sans nom, et se taire avec un libellé', () => {
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ];
    render(<RadioGroup name="choix" options={options} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Opale] RadioGroup'));

    warn.mockClear();
    resetDeprecationWarnings();
    render(<RadioGroup name="choix2" label="Formule" options={options} />);
    expect(warn).not.toHaveBeenCalled();
  });
});
