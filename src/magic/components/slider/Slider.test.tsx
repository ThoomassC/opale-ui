import { fireEvent, render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Slider from './Slider';

/** Une piste de 100 px calée sur l'origine : 1 px = 1 %, donc `clientX` se lit
 *  directement comme un pourcentage dans les attentes. */
const stubTrack = (track: HTMLElement) => {
  vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
    bottom: 6,
    height: 6,
    left: 0,
    right: 100,
    top: 0,
    width: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  /* jsdom n'implémente pas l'API de capture de pointeur. `Slider` s'en protège,
     mais la remplacer ici permet de vérifier qu'elle est bien demandée. */
  track.setPointerCapture = vi.fn();
  track.hasPointerCapture = vi.fn(() => true);
  track.releasePointerCapture = vi.fn();
};

const renderSlider = (props: Partial<ComponentProps<typeof Slider>> = {}) => {
  const { container } = render(<Slider min={0} max={100} step={25} value={50} {...props} />);
  const track = container.querySelector('[class*="sliderTrack"]') as HTMLDivElement;
  const thumb = container.querySelector('[class*="thumb"]') as HTMLDivElement;

  stubTrack(track);

  return { track, thumb };
};

describe('Slider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* CE TEST A CHANGÉ DE CIBLE D'ÉVÉNEMENT, ET C'EST LE SUJET DE LA CORRECTION.
     Il posait ses `pointerDown` / `pointerMove` sur la POIGNÉE, parce que
     c'était le seul élément qui écoutait. Les gestionnaires vivent désormais
     sur la PISTE : les événements de la poignée y remontent, donc le geste
     décrit reste le même du point de vue de l'utilisateur, mais les doublures
     de capture de pointeur doivent être posées sur la piste. Ce que le test
     mesure — la poignée suit le curseur au pixel pendant que `step` arrondit la
     valeur émise — n'a pas bougé d'une attente. */
  it('keeps the handle continuous while step rounds the emitted value', () => {
    const onChange = vi.fn();
    const { track, thumb } = renderSlider({ onChange });

    fireEvent.pointerMove(track, { clientX: 10, pointerId: 1 });
    expect(thumb.style.left).toBe('50%');

    fireEvent.pointerDown(thumb, { clientX: 32, pointerId: 1 });
    expect(thumb.style.left).toBe('32%');
    expect(onChange).toHaveBeenLastCalledWith(25);

    fireEvent.pointerMove(thumb, { clientX: 47, pointerId: 1 });
    expect(thumb.style.left).toBe('47%');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('démarre le geste depuis la piste, là où la poignée n’est pas', () => {
    const onChange = vi.fn();
    const { track, thumb } = renderSlider({ onChange });

    fireEvent.pointerDown(track, { clientX: 80, pointerId: 1 });

    expect(thumb.style.left).toBe('80%');
    expect(onChange).toHaveBeenLastCalledWith(75);
    expect(track.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('continue de suivre le curseur quand il sort de la piste, en bornant à 0 et 100', () => {
    const { track, thumb } = renderSlider();

    fireEvent.pointerDown(track, { clientX: 40, pointerId: 1 });

    fireEvent.pointerMove(track, { clientX: 320, pointerId: 1 });
    expect(thumb.style.left).toBe('100%');

    fireEvent.pointerMove(track, { clientX: -140, pointerId: 1 });
    expect(thumb.style.left).toBe('0%');
  });

  it('rend la poignée à la valeur arrondie une fois le pointeur relâché', () => {
    const { track, thumb } = renderSlider();

    fireEvent.pointerDown(track, { clientX: 47, pointerId: 1 });
    expect(thumb.style.left).toBe('47%');

    fireEvent.pointerUp(track, { clientX: 47, pointerId: 1 });

    /* Le composant est contrôlé et `value` n'a pas bougé : la poignée revient
       donc à la position de la valeur, pas à celle du curseur. C'est la reprise
       en main du parent qui est vérifiée ici, pas un arrondi. */
    expect(thumb.style.left).toBe('50%');
    expect(track.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it('ne réagit à aucun geste lorsqu’il est désactivé', () => {
    const onChange = vi.fn();
    const { track, thumb } = renderSlider({ disabled: true, onChange });

    fireEvent.pointerDown(track, { clientX: 80, pointerId: 1 });
    fireEvent.pointerMove(track, { clientX: 90, pointerId: 1 });

    expect(thumb.style.left).toBe('50%');
    expect(onChange).not.toHaveBeenCalled();
    expect(track.setPointerCapture).not.toHaveBeenCalled();
  });
});
