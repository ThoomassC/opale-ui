import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dropzone } from './opale';

afterEach(cleanup);

/* ============================================================================
   DROPZONE DANS UN FORMULAIRE NATIF.

   L'`<input type="file">` interne n'avait pas de `name`, était VIDÉ après
   chaque sélection, et les fichiers déposés n'y étaient jamais recopiés : un
   `<form>` soumis par `FormData` ou par une Server Action ne recevait aucun
   fichier (audit DX-08). `multiple` était forcé.

   Désormais, avec `name`, le champ porte les fichiers retenus jusqu'à la
   soumission — choisis ou déposés. Sans `name`, rien ne change : le champ est
   vidé comme avant, pour qu'un même fichier choisi deux fois redéclenche
   `onFiles`.

   jsdom ne sait pas construire de `FileList`, ni en poser une sur un champ :
   la soumission réelle se vérifie au navigateur. Ici, on vérifie ce que le
   composant ÉCRIT sur le champ.
   ========================================================================== */

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('champ de fichier absent');
  return input;
}

/** Espionne les écritures de `value` et de `files` sur le champ. */
function spyWrites(input: HTMLInputElement) {
  const values: string[] = [];
  const files: unknown[] = [];
  Object.defineProperty(input, 'value', {
    configurable: true,
    get: () => '',
    set: (next: string) => void values.push(next),
  });
  Object.defineProperty(input, 'files', {
    configurable: true,
    get: () => null,
    set: (next: unknown) => void files.push(next),
  });
  return { values, files };
}

const pick = (input: HTMLInputElement, list: File[]) =>
  fireEvent.change(input, { target: { files: list } });

describe('Dropzone dans un formulaire', () => {
  it('nomme son champ et reste multiple par défaut', () => {
    const { container } = render(<Dropzone name="pieces" />);
    const input = fileInput(container);
    expect(input).toHaveAttribute('name', 'pieces');
    expect(input.multiple).toBe(true);
  });

  it('respecte multiple={false} et required', () => {
    const { container } = render(<Dropzone name="avatar" multiple={false} required />);
    const input = fileInput(container);
    expect(input.multiple).toBe(false);
    expect(input).toBeRequired();
  });

  it('refuse plusieurs fichiers quand multiple vaut false', () => {
    const onFiles = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <Dropzone name="avatar" multiple={false} onFiles={onFiles} onError={onError} />,
    );
    fireEvent.drop(fileInput(container).closest('label') as HTMLElement, {
      dataTransfer: { files: [new File(['a'], 'a.png'), new File(['b'], 'b.png')] },
    });
    expect(onFiles).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Sélectionnez au maximum 1 fichier.');
  });

  it('garde les fichiers choisis sur le champ quand il porte un name', () => {
    const onFiles = vi.fn();
    const { container } = render(<Dropzone name="pieces" onFiles={onFiles} />);
    const input = fileInput(container);
    pick(input, [new File(['a'], 'a.txt')]);
    const writes = spyWrites(input);
    pick(input, [new File(['b'], 'b.txt')]);

    expect(onFiles).toHaveBeenCalledTimes(2);
    expect(writes.values).toEqual([]);
  });

  it('vide encore le champ sans name, comme en 3.9.1', () => {
    const { container } = render(<Dropzone />);
    const input = fileInput(container);
    const writes = spyWrites(input);
    pick(input, [new File(['a'], 'a.txt')]);
    expect(writes.values).toEqual(['']);
  });

  it('vide le champ nommé quand la sélection est refusée, pour ne rien soumettre de refusé', () => {
    const { container } = render(<Dropzone name="pieces" maxFiles={1} />);
    const input = fileInput(container);
    const writes = spyWrites(input);
    pick(input, [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]);
    expect(writes.values).toEqual(['']);
  });

  it('recopie les fichiers déposés sur le champ nommé', () => {
    const onFiles = vi.fn();
    const { container } = render(<Dropzone name="pieces" onFiles={onFiles} />);
    const input = fileInput(container);
    const writes = spyWrites(input);
    const dropped = [new File(['a'], 'a.txt')];

    fireEvent.drop(input.closest('label') as HTMLElement, { dataTransfer: { files: dropped } });

    expect(onFiles).toHaveBeenCalledWith(dropped);
    expect(writes.files).toEqual([dropped]);
  });

  /* `required` SANS `name` : le champ vidé après chaque choix restait
     invalide, et le formulaire refusait de partir — pour toujours. */
  it('garde les fichiers choisis sur un champ required sans name', () => {
    const { container } = render(<Dropzone required />);
    const input = fileInput(container);
    const writes = spyWrites(input);
    pick(input, [new File(['a'], 'a.txt')]);
    expect(writes.values).toEqual([]);
  });

  it('recopie les fichiers déposés sur un champ required sans name', () => {
    const { container } = render(<Dropzone required />);
    const input = fileInput(container);
    const writes = spyWrites(input);
    const dropped = [new File(['a'], 'a.txt')];
    fireEvent.drop(input.closest('label') as HTMLElement, { dataTransfer: { files: dropped } });
    expect(writes.files).toEqual([dropped]);
  });

  /* UN DÉPÔT REFUSÉ NE LAISSE PAS L'ANCIENNE SÉLECTION PARTIR. L'erreur
     s'affichait, et le formulaire soumettait les fichiers d'avant. */
  it('vide le champ nommé quand un dépôt est refusé', () => {
    const { container } = render(<Dropzone name="pieces" maxFiles={1} />);
    const input = fileInput(container);
    const writes = spyWrites(input);
    fireEvent.drop(input.closest('label') as HTMLElement, {
      dataTransfer: { files: [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')] },
    });
    expect(writes.values).toEqual(['']);
    expect(writes.files).toEqual([]);
  });

  it('ne recopie rien sans name', () => {
    const { container } = render(<Dropzone />);
    const input = fileInput(container);
    const writes = spyWrites(input);
    fireEvent.drop(input.closest('label') as HTMLElement, {
      dataTransfer: { files: [new File(['a'], 'a.txt')] },
    });
    expect(writes.files).toEqual([]);
  });
});
