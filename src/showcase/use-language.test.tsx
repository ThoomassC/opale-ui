import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLanguage } from './use-language';

describe('useLanguage', () => {
  it('utilise le français par défaut et synchronise la langue du document', () => {
    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe('FR');
    expect(document.documentElement).toHaveAttribute('lang', 'fr');
  });

  it('restaure une langue valide mémorisée', () => {
    localStorage.setItem('tc-language', 'EN');

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe('EN');
    expect(document.documentElement).toHaveAttribute('lang', 'en');
  });

  it('mémorise le passage à l’espagnol', () => {
    const { result } = renderHook(() => useLanguage());

    act(() => result.current.setLanguage('ES'));

    expect(result.current.language).toBe('ES');
    expect(localStorage.getItem('tc-language')).toBe('ES');
    expect(document.documentElement).toHaveAttribute('lang', 'es');
  });

  it('ignore une valeur mémorisée inconnue', () => {
    localStorage.setItem('tc-language', 'DE');

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe('FR');
    expect(document.documentElement).toHaveAttribute('lang', 'fr');
  });
});
