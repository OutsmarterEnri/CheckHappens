import { useEffect, useRef } from "react";

/** Edge-only touch navigation; never interprets board or form gestures as Back. */
export function useEdgeBack(onBack: () => void, enabled = true) {
  const callback = useRef(onBack);
  callback.current = onBack;
  useEffect(() => {
    if (!enabled) return;
    let start: { x: number; y: number; at: number; id: number } | null = null;
    const cancel = () => {
      start = null;
    };
    const begin = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target;
      if (
        event.touches.length !== 1 ||
        !touch ||
        touch.clientX > 24 ||
        (target instanceof Element &&
          target.closest(
            "input,select,textarea,[contenteditable],.board,[role=slider]",
          ))
      ) {
        cancel();
        return;
      }
      start = {
        x: touch.clientX,
        y: touch.clientY,
        at: performance.now(),
        id: touch.identifier,
      };
    };
    const move = (event: TouchEvent) => {
      if (!start) return;
      const touch = Array.from(event.touches).find(
        (t) => t.identifier === start!.id,
      );
      if (!touch || event.touches.length !== 1) {
        cancel();
        return;
      }
      const dx = touch.clientX - start.x,
        dy = Math.abs(touch.clientY - start.y);
      if (dy > 40 || dx < -12) {
        cancel();
        return;
      }
      if (dx > 12 && dx > dy * 1.5 && event.cancelable) event.preventDefault();
    };
    const end = (event: TouchEvent) => {
      const origin = start;
      cancel();
      if (!origin) return;
      const touch = Array.from(event.changedTouches).find(
        (t) => t.identifier === origin.id,
      );
      if (!touch) return;
      const dx = touch.clientX - origin.x,
        dy = Math.abs(touch.clientY - origin.y);
      if (
        dx >= 72 &&
        dy <= 40 &&
        dx > dy * 1.5 &&
        performance.now() - origin.at <= 1200
      ) {
        if (event.cancelable) event.preventDefault();
        callback.current();
      }
    };
    document.addEventListener("touchstart", begin, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end, { passive: false });
    document.addEventListener("touchcancel", cancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", begin);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", cancel);
    };
  }, [enabled]);
}
