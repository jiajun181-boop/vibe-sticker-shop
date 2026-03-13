"use client";

import { useEffect, useState } from "react";
import { hasPermission } from "./admin-permissions";

/**
 * Module-level cache — shared across all hook instances in the same page.
 * Avoids redundant /api/admin/session fetches.
 */
let _cache = null;
let _promise = null;

function fetchSession() {
  if (_promise) return _promise;
  _promise = fetch("/api/admin/session")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      _cache = data?.user || null;
      return _cache;
    })
    .catch(() => {
      _cache = null;
      return null;
    });
  return _promise;
}

/**
 * Get admin session { id, email, name, role } or null.
 * Uses module-level cache to avoid duplicate fetches.
 */
export function useAdminSession() {
  const [session, setSession] = useState(_cache);

  useEffect(() => {
    if (_cache) {
      setSession(_cache);
      return;
    }
    fetchSession().then((s) => setSession(s));
  }, []);

  return session;
}

/**
 * Check if current admin user can perform an action on a module.
 */
export function useAdminCan(module, action = "view") {
  const session = useAdminSession();
  if (!session?.role) return false;
  return hasPermission(session.role, module, action);
}

/**
 * Get current admin role string ("admin" | "cs" | "production" | etc.)
 * Returns null if session not loaded.
 */
export function useAdminRole() {
  const session = useAdminSession();
  return session?.role || null;
}
