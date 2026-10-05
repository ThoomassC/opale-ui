import { describe, expect, it, vi } from 'vitest';

import { actWarning, allowConsole, consoleCalls, expectConsole } from './console-guard';

/* Le garde global de `setup.ts`, vu de l'intérieur. `it.fails` prouve qu'un
   message non déclaré, ou déclaré attendu mais jamais émis, fait bien échouer
   le test — c'est l'`afterEach` du garde qui lève. */
describe('le garde de la console', () => {
  it('enregistre un message déclaré attendu, sans échouer', () => {
    expectConsole('warn', /^\[Opale\] essai/);
    console.warn('[Opale] essai');
    expect(consoleCalls('warn')).toEqual(['[Opale] essai']);
  });

  it('tolère un message permis, résolu comme le ferait la console', () => {
    allowConsole('error', actWarning('Essai'));
    console.error('An update to %s inside a test was not wrapped in act(...).', 'Essai');
    expect(consoleCalls('error')).toEqual([
      'An update to Essai inside a test was not wrapped in act(...).',
    ]);
  });

  it('laisse la main au test qui espionne lui-même la console', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    console.warn('intercepté');
    expect(warn).toHaveBeenCalledWith('intercepté');
    warn.mockRestore();
  });

  it.fails('fait échouer un avertissement non déclaré', () => {
    console.warn('surprise');
  });

  it.fails('fait échouer une erreur non déclarée', () => {
    console.error('surprise');
  });

  it.fails('fait échouer un message attendu qui ne part pas', () => {
    expectConsole('warn', /jamais/);
  });
});
