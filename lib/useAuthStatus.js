"use client";

import { useEffect, useState } from "react";

/**
 * Lightweight client-side auth check via /api/auth/me.
 * Returns { isLoggedIn, isLoading }.
 *
 * - Fetches once on mount, caches result for component lifetime.
 * - On network/API failure, defaults to isLoggedIn=false (guest).
 * - Does NOT replace or modify the auth system — read-only check.
 */
export function useAuthStatus() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setIsLoggedIn(!!data.user);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoggedIn(false);
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return { isLoggedIn, isLoading };
}
