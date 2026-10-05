import { format as formatMessage } from 'node:util';

import { afterEach, beforeEach, expect } from 'vitest';

/* =============================================================================
   AUCUN TEST N'ÉCRIT DANS LA CONSOLE SANS L'AVOIR DIT.

   `console.warn` et `console.error` sont remplacés avant chaque test par un
   enregistreur (`installConsoleGuard`, appelé par `setup.ts`). Après le test,
   tout message qui n'a pas été déclaré fait échouer le test qui l'a émis :
   un avertissement de développement d'Opale, une erreur de React (`act()`,
   clé manquante, prop inconnue dans le DOM) ou un bruit de jsdom ne passent
   plus en silence.

   UN TEST DÉCLARE CE QU'IL ATTEND :
   - `expectConsole('warn', /motif/)` : le message doit partir, au moins une fois ;
   - `allowConsole('error', /motif/)` : le message peut partir ;
   - `allowConsoleInFile(...)` : la même tolérance pour tous les tests du fichier,
     à réserver au bruit qu'un fichier entier produit par construction.
   Un test qui pose lui-même `vi.spyOn(console, 'warn')` avec une implémentation
   prend la main : les messages qu'il intercepte sont les siens.
   ========================================================================== */

export type ConsoleLevel = 'warn' | 'error';

interface Expectation {
  readonly level: ConsoleLevel;
  readonly pattern: RegExp;
  readonly required: boolean;
}

const LEVELS: readonly ConsoleLevel[] = ['warn', 'error'];

let expectations: Expectation[] = [];
let calls: { level: ConsoleLevel; message: string }[] = [];
const originals = new Map<ConsoleLevel, (...data: unknown[]) => void>();

/* Les messages de React portent des `%s` : ils sont résolus comme la console
   le ferait, pour qu'un motif vise le nom du composant fautif. */
const format = (data: readonly unknown[]): string =>
  formatMessage(...data.map((part) => (part instanceof Error ? part.message : part)));

/** Le message doit partir au moins une fois pendant le test. */
export function expectConsole(level: ConsoleLevel, pattern: RegExp): void {
  expectations.push({ level, pattern, required: true });
}

/** Le message peut partir pendant le test, sans obligation. */
export function allowConsole(level: ConsoleLevel, pattern: RegExp): void {
  expectations.push({ level, pattern, required: false });
}

/** `allowConsole` pour chaque test du fichier appelant. */
export function allowConsoleInFile(level: ConsoleLevel, pattern: RegExp): void {
  beforeEach(() => allowConsole(level, pattern));
}

/**
 * L'avertissement `act()` de React pour UN composant, dans tout le fichier :
 * une mise à jour d'état partie d'une image ou d'une promesse après un rendu
 * synchrone (la fin d'animation de `SplitHeading`, la mesure du carrousel).
 * Bruit de l'environnement de test, toléré nommément, jamais en bloc.
 */
export function allowActWarningInFile(component: string): void {
  allowConsoleInFile('error', actWarning(component));
}

/** Le motif de l'avertissement `act()` de React pour un composant. */
export function actWarning(component: string): RegExp {
  return new RegExp(`^An update to ${component} inside a test was not wrapped in act`);
}

/** Les messages enregistrés pendant le test en cours, déclarés ou non. */
export function consoleCalls(level: ConsoleLevel): readonly string[] {
  return calls.filter((call) => call.level === level).map((call) => call.message);
}

export function installConsoleGuard(): void {
  beforeEach(() => {
    expectations = [];
    calls = [];
    for (const level of LEVELS) {
      originals.set(level, console[level]);
      console[level] = (...data: unknown[]) => {
        calls.push({ level, message: format(data) });
      };
    }
  });

  afterEach(() => {
    for (const level of LEVELS) {
      const original = originals.get(level);
      if (original) console[level] = original;
    }
    const matches = (call: { level: ConsoleLevel; message: string }) => (rule: Expectation) =>
      rule.level === call.level && rule.pattern.test(call.message);
    const unexpected = calls
      .filter((call) => !expectations.some(matches(call)))
      .map((call) => `console.${call.level} : ${call.message.split('\n')[0]}`);
    const missing = expectations
      .filter((rule) => rule.required)
      .filter((rule) => !calls.some((call) => matches(call)(rule)))
      .map((rule) => `console.${rule.level} attendu, jamais émis : ${String(rule.pattern)}`);
    expectations = [];
    calls = [];
    expect(
      [...unexpected, ...missing],
      'La console a reçu un message que le test n’a pas déclaré (voir src/test/console-guard.ts).',
    ).toEqual([]);
  });
}
