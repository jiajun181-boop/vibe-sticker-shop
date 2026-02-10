import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useFocusTrap(containerRef, active) {
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!active) return;

    previousFocus.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    // Focus first focusable element
    const focusable = container.querySelectorAll(FOCUSABLE);
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 50);
    }

    function handleKeyDown(e) {
      if (e.key !== "Tab") return;

      const nodes = container.querySelectorAll(FOCUSABLE);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus.current && typeof previousFocus.current.focus === "function") {
        previousFocus.current.focus();
      }
    };
  }, [active, containerRef]);
}
