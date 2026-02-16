"use client";

import { useEffect, useRef } from "react";

/**
 * IntersectionObserver hook for scroll-triggered animations.
 * Adds `.is-visible` to elements with `.animate-on-scroll`, `.animate-slide-left`, or `.animate-scale-in`.
 * @param {object} options
 * @param {number} [options.threshold=0.15] — visibility threshold
 * @param {string} [options.rootMargin="0px 0px -40px 0px"]
 */
export function useScrollAnimation({ threshold = 0.15, rootMargin = "0px 0px -40px 0px" } = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current || document;
    const targets = root.querySelectorAll(
      ".animate-on-scroll, .animate-slide-left, .animate-scale-in"
    );

    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return containerRef;
}
