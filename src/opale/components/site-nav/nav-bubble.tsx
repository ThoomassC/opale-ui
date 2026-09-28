'use client';

import {
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { LiquidBubble } from './liquid-bubble';
import styles from './site-nav.module.css';
import type { SiteNavItem } from './site-nav';

export type NavBubbleProps = {
  readonly items: readonly SiteNavItem[];
  readonly activeKey?: string;
  readonly onNavigate?: (item: SiteNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
};

const isModifiedClick = (event: MouseEvent<HTMLAnchorElement>): boolean =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

type OptimisticSelection = {
  readonly sourceKey: string | undefined;
  readonly targetKey: string;
};

/** Keeps one liquid surface moving between the navigation's destinations. */
export function NavBubble({ items, activeKey, onNavigate }: NavBubbleProps) {
  const initialKey = activeKey ?? items[0]?.id;
  const [optimisticSelection, setOptimisticSelection] = useState<OptimisticSelection>();
  const [moving, setMoving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<number>();
  const listRef = useRef<HTMLUListElement>(null);
  const movementTimer = useRef<number | null>(null);
  const dragSourceKeyRef = useRef<string | undefined>(undefined);
  const dragTargetKeyRef = useRef<string | undefined>(undefined);
  const dragPointerIdRef = useRef<number | undefined>(undefined);
  const dragPointerOffsetRef = useRef(0);
  const dragCaptureRef = useRef<HTMLAnchorElement | null>(null);
  const hasDraggedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const dragCommitKeyRef = useRef<string | undefined>(undefined);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      if (movementTimer.current !== null) window.clearTimeout(movementTimer.current);
      dragCleanupRef.current?.();
    },
    [],
  );

  /*
   * The optimistic state belongs to the active key it replaced. When the
   * consumer updates `activeKey` after routing, the new prop wins during render
   * and no state-setting effect is needed. That keeps the click animation smooth
   * while avoiding a cascading render after every route change.
   */
  const displayedKey =
    optimisticSelection && optimisticSelection.sourceKey === activeKey
      ? optimisticSelection.targetKey
      : initialKey;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === displayedKey),
  );

  const moveBubbleTo = (targetKey: string) => {
    if (targetKey === displayedKey) return;

    setOptimisticSelection({ sourceKey: activeKey, targetKey });
    setMoving(true);
    if (movementTimer.current !== null) window.clearTimeout(movementTimer.current);
    movementTimer.current = window.setTimeout(() => setMoving(false), 620);
  };

  const itemAtClientX = (clientX: number): SiteNavItem | undefined => {
    const links = listRef.current
      ? [...listRef.current.querySelectorAll<HTMLAnchorElement>('[data-nav]')]
      : [];
    if (links.length === 0) return undefined;

    const hit = links.find((link) => {
      const rect = link.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right;
    });
    const nearest =
      hit ??
      links.reduce((closest, link) => {
        const distance = Math.abs(
          link.getBoundingClientRect().left + link.getBoundingClientRect().width / 2 - clientX,
        );
        const closestDistance = Math.abs(
          closest.getBoundingClientRect().left + closest.getBoundingClientRect().width / 2 - clientX,
        );
        return distance < closestDistance ? link : closest;
      });

    return items.find((item) => item.id === nearest.dataset.nav);
  };

  const handleClick = (item: SiteNavItem, event: MouseEvent<HTMLAnchorElement>) => {
    const isDragCommit = dragCommitKeyRef.current === item.id;
    if (suppressClickRef.current && !isDragCommit) {
      event.preventDefault();
      suppressClickRef.current = false;
      return;
    }
    if (isDragCommit) dragCommitKeyRef.current = undefined;
    if (isModifiedClick(event) || event.currentTarget.target === '_blank') return;
    if (item.id === displayedKey && !isDragCommit) return;

    moveBubbleTo(item.id);

    if (onNavigate) {
      event.preventDefault();
      onNavigate(item, event);
    }
  };

  const finishDrag = (commit: boolean) => {
    const wasDragged = hasDraggedRef.current;
    const sourceKey = dragSourceKeyRef.current;
    const targetKey = dragTargetKeyRef.current;

    if (
      dragCaptureRef.current &&
      dragPointerIdRef.current !== undefined &&
      dragCaptureRef.current.hasPointerCapture(dragPointerIdRef.current)
    ) {
      dragCaptureRef.current.releasePointerCapture(dragPointerIdRef.current);
    }

    setDragging(false);
    setDragPosition(undefined);

    if (commit && wasDragged && sourceKey !== targetKey && targetKey) {
      const targetLink = [
        ...(listRef.current?.querySelectorAll<HTMLAnchorElement>('[data-nav]') ?? []),
      ].find((link) => link.dataset.nav === targetKey);
      if (targetLink) {
        dragCommitKeyRef.current = targetKey;
        targetLink.click();
      }
    }

    suppressClickRef.current = commit && wasDragged;
    dragSourceKeyRef.current = undefined;
    dragTargetKeyRef.current = undefined;
    dragPointerIdRef.current = undefined;
    dragCaptureRef.current = null;
    hasDraggedRef.current = false;
  };

  const handlePointerDown = (item: SiteNavItem, event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || item.id !== displayedKey) return;

    event.preventDefault();
    dragCleanupRef.current?.();
    dragPointerIdRef.current = event.pointerId;
    dragCaptureRef.current = event.currentTarget;
    event.currentTarget.setPointerCapture(event.pointerId);

    const list = listRef.current;
    const bubble = list?.querySelector<HTMLElement>(`.${styles.movingBubble}`);
    const listRect = list?.getBoundingClientRect();
    const bubbleRect = bubble?.getBoundingClientRect();
    if (listRect && bubbleRect) {
      dragPointerOffsetRef.current = event.clientX - bubbleRect.left;
      setDragPosition(bubbleRect.left - listRect.left);
    }

    dragSourceKeyRef.current = item.id;
    dragTargetKeyRef.current = item.id;
    hasDraggedRef.current = false;
    setDragging(true);

    const pointerId = event.pointerId;
    const handleWindowPointerMove = (moveEvent: globalThis.PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;

      hasDraggedRef.current = true;
      moveEvent.preventDefault();
      const target = itemAtClientX(moveEvent.clientX);
      const list = listRef.current;
      const bubble = list?.querySelector<HTMLElement>(`.${styles.movingBubble}`);
      const listRect = list?.getBoundingClientRect();
      const bubbleWidth = bubble?.getBoundingClientRect().width ?? 0;
      if (listRect && bubbleWidth > 0) {
        const minimum = 3;
        const maximum = Math.max(minimum, listRect.width - bubbleWidth - 3);
        const nextPosition = Math.min(
          maximum,
          Math.max(minimum, moveEvent.clientX - listRect.left - dragPointerOffsetRef.current),
        );
        setDragPosition(nextPosition);
      }

      if (!target || target.id === dragTargetKeyRef.current) return;

      dragTargetKeyRef.current = target.id;
      moveBubbleTo(target.id);
    };
    const handleWindowPointerEnd = (endEvent: globalThis.PointerEvent) => {
      if (endEvent.pointerId !== pointerId) return;
      finishDrag(endEvent.type === 'pointerup');
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerEnd);
      window.removeEventListener('pointercancel', handleWindowPointerEnd);
      if (dragCleanupRef.current === cleanup) dragCleanupRef.current = null;
    };

    dragCleanupRef.current = cleanup;
    window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', handleWindowPointerEnd);
    window.addEventListener('pointercancel', handleWindowPointerEnd);
  };

  const handleNativeDragStart = (event: ReactDragEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  };

  return (
    <ul
      ref={listRef}
      className={styles.list}
      data-active-index={activeIndex}
      data-item-count={items.length}
      data-moving={moving ? 'true' : undefined}
      data-dragging={dragging ? 'true' : undefined}
    >
      <LiquidBubble
        className={styles.movingBubble}
        aria-hidden="true"
        style={{ insetInlineStart: dragPosition !== undefined ? `${dragPosition}px` : undefined }}
      />
      {items.map((item) => {
        const current = item.id === displayedKey;
        return (
          <li key={item.id}>
            <a
              className={styles.link}
              data-nav={item.id}
              href={item.href}
              aria-current={current ? 'page' : undefined}
              draggable={false}
              onClick={(event) => handleClick(item, event)}
              onPointerDown={(event) => handlePointerDown(item, event)}
              onDragStart={handleNativeDragStart}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
