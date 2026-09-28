import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SiteNav, type SiteNavItem } from './site-nav';

const items: readonly SiteNavItem[] = [
  { id: 'map', href: '/map', label: 'Map' },
  { id: 'countries', href: '/countries', label: 'Countries' },
  { id: 'cities', href: '/cities', label: 'Cities' },
  { id: 'about', href: '/about', label: 'About' },
];

const renderNav = (props?: Partial<React.ComponentProps<typeof SiteNav>>) =>
  render(
    <SiteNav
      brand={<a href="/">Travels in World</a>}
      items={items}
      activeItem="map"
      navLabel="Main navigation"
      onNavigate={() => undefined}
      {...props}
    />,
  );

describe('SiteNav', () => {
  it('renders only the brand and four destinations', () => {
    renderNav();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Travels in World' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(5);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('uses Carte, Pays, Villes and À propos when items are omitted', () => {
    renderNav({ items: undefined });

    expect(screen.getByRole('link', { name: 'Carte' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pays' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Villes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'À propos' })).toBeInTheDocument();
  });

  it('lets the active bubble be dragged to another tab while holding the pointer', () => {
    renderNav();

    const map = screen.getByRole('link', { name: 'Map' });
    const countries = screen.getByRole('link', { name: 'Countries' });
    const list = screen.getByRole('list');
    const bubble = list.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(bubble).not.toBeNull();

    vi.spyOn(map, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 50,
      width: 50,
      top: 0,
      bottom: 44,
      height: 44,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(countries, 'getBoundingClientRect').mockReturnValue({
      left: 50,
      right: 100,
      width: 50,
      top: 0,
      bottom: 44,
      height: 44,
      x: 50,
      y: 0,
      toJSON: () => ({}),
    });
    map.setPointerCapture = vi.fn();
    map.hasPointerCapture = vi.fn(() => true);
    map.releasePointerCapture = vi.fn();
    vi.spyOn(list, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 100,
      width: 100,
      top: 0,
      bottom: 44,
      height: 44,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(bubble!, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 50,
      width: 50,
      top: 0,
      bottom: 44,
      height: 44,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(map, { button: 0, clientX: 25, pointerId: 1 });
    fireEvent.pointerMove(map, { clientX: 75, pointerId: 1 });

    expect(list).toHaveAttribute('data-dragging', 'true');
    expect(list).toHaveAttribute('data-active-index', '1');
    expect(countries).toHaveAttribute('aria-current', 'page');
    const dragPosition = Number.parseFloat(bubble?.style.insetInlineStart ?? '0');
    expect(dragPosition).toBeGreaterThan(3);
    expect(dragPosition).toBeLessThan(100);

    fireEvent.pointerUp(map, { clientX: 75, pointerId: 1 });
    expect(list).not.toHaveAttribute('data-dragging');
  });

  it('moves one active bubble on click, without reacting to hover', () => {
    renderNav();

    const list = screen.getByRole('list');
    const countries = screen.getByRole('link', { name: 'Countries' });

    expect(list).toHaveAttribute('data-active-index', '0');
    fireEvent.mouseEnter(countries);
    expect(list).toHaveAttribute('data-active-index', '0');

    fireEvent.click(countries);
    expect(list).toHaveAttribute('data-active-index', '1');
    expect(countries).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Map' })).not.toHaveAttribute('aria-current');
    expect(list).toHaveAttribute('data-moving', 'true');
  });

  it('delegates client-side navigation while preserving the clicked state', () => {
    const onNavigate = vi.fn();
    renderNav({ onNavigate });

    const countries = screen.getByRole('link', { name: 'Countries' });
    const event = fireEvent.click(countries);

    expect(event).toBe(false);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(items[1], expect.any(Object));
    expect(screen.getByRole('list')).toHaveAttribute('data-active-index', '1');
  });
});
