"use client";

import { useEffect } from "react";

export default function QuotePrintClient() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.print();
    }, 200);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}

