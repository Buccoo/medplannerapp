import { useEffect } from "react";

/**
 * Fix for the Radix UI bug where `pointer-events: none` stays stuck on
 * <body> after a Dialog/Sheet/Select/AlertDialog closes, making the whole
 * app (navbar, buttons) unclickable on touch devices until a re-render.
 *
 * Watches the DOM and, whenever the body is locked but NO Radix overlay is
 * actually open, clears the stray inline style. Never clears while a real
 * modal is open, so intended background-blocking is preserved.
 */
export function usePointerEventsFix() {
  useEffect(() => {
    const body = document.body;

    const hasOpenLayer = () =>
      document.querySelector(
        '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"], [data-radix-popper-content-wrapper]'
      );

    let frame = 0;
    const check = () => {
      frame = 0;
      if (body.style.pointerEvents === "none" && !hasOpenLayer()) {
        body.style.pointerEvents = "";
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(body, {
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}
