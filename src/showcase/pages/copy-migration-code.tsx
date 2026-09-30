import { useState } from 'react';

export function CopyMigrationCode({ code }: { code: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard indisponible');
      await navigator.clipboard.writeText(code);
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  }

  return (
    <button type="button" className="tc-doc-release__copy" onClick={() => void copy()}>
      {status === 'copied'
        ? 'Copié !'
        : status === 'error'
          ? 'Copie impossible'
          : 'Copier le code après'}
    </button>
  );
}
