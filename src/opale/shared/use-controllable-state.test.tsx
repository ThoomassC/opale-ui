import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useControllableState } from './use-controllable-state';

describe('useControllableState', () => {
  it('devrait suivre le setter quand la valeur n’est pas contrôlée', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<string>(undefined, 'a', onChange));

    expect(result.current[0]).toBe('a');
    expect(result.current[2]).toBe(false);

    act(() => result.current[1]('b'));

    expect(result.current[0]).toBe('b');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('devrait accepter une valeur initiale paresseuse', () => {
    const init = vi.fn(() => 3);
    const { result, rerender } = renderHook(() => useControllableState<number>(undefined, init));

    rerender();

    expect(result.current[0]).toBe(3);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('devrait garder la valeur de l’appelant et appeler le rappel quand elle est contrôlée', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<string>('a', 'z', onChange));

    expect(result.current[2]).toBe(true);

    act(() => result.current[1]('b'));

    expect(result.current[0]).toBe('a');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('devrait relire la valeur contrôlée à chaque rendu', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string | undefined }) => useControllableState(value, 'z'),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });

    expect(result.current[0]).toBe('b');
  });

  it('devrait traiter null comme une valeur contrôlée', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<string | null>(null, 'a', onChange));

    expect(result.current[0]).toBeNull();
    expect(result.current[2]).toBe(true);

    act(() => result.current[1]('b'));

    expect(result.current[0]).toBeNull();
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('devrait appeler le rappel même quand la valeur ne change pas', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<string>(undefined, 'a', onChange));

    act(() => result.current[1]('a'));
    act(() => result.current[1]('a'));

    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
