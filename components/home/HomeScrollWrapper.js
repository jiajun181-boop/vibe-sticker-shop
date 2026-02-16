"use client";

import { useScrollAnimation } from "@/lib/useScrollAnimation";

export default function HomeScrollWrapper({ children }) {
  const ref = useScrollAnimation();
  return <div ref={ref}>{children}</div>;
}
