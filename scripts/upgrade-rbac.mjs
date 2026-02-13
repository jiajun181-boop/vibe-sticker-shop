/**
 * Script to upgrade all admin API routes from requireAdminAuth to requirePermission.
 *
 * This script:
 * 1. Reads each admin route file
 * 2. Replaces the import
 * 3. Replaces each auth check with the appropriate module/action
 * 4. Writes the file back
 */

import fs from "fs";
import path from "path";

const BASE = "app/api/admin";

// Route → module mapping, with per-method action overrides
// Default: GET=view, POST/PATCH/PUT/DELETE=edit
const ROUTE_MAP = {
  // Analytics
  "analytics/route.ts": { module: "analytics" },
  "analytics/funnel/route.ts": { module: "analytics" },

  // Coupons
  "coupons/route.ts": { module: "coupons" },
  "coupons/[id]/route.ts": { module: "coupons" },

  // Customers
  "customers/route.ts": { module: "customers" },
  "customers/[email]/route.ts": { module: "customers" },

  // Factories
  "factories/route.ts": { module: "factories" },
  "factories/[id]/route.ts": { module: "factories" },

  // Logs
  "logs/route.ts": { module: "logs" },

  // Media (legacy upload route)
  "media/route.ts": { module: "media" },

  // Orders
  "orders/route.ts": { module: "orders" },
  "orders/[id]/route.ts": { module: "orders" },
  "orders/[id]/notes/route.ts": { module: "orders" },
  "orders/[id]/timeline/route.ts": { module: "orders" },
  "orders/bulk-export/route.ts": { module: "orders", allActions: "view" },
  "orders/bulk-update/route.ts": { module: "orders" },

  // Pricing
  "pricing/route.ts": { module: "pricing" },
  "pricing/[id]/route.ts": { module: "pricing" },

  // Production
  "production/route.ts": { module: "production" },
  "production/[id]/route.ts": { module: "production" },
  "production/board/route.ts": { module: "production" },
  "production/bulk-update/route.ts": { module: "production" },
  "production/rules/route.ts": { module: "production" },
  "production/rules/[id]/route.ts": { module: "production" },

  // Products
  "products/route.ts": { module: "products" },
  "products/[id]/route.ts": { module: "products" },
  "products/[id]/images/route.ts": { module: "products" },
  "products/export/route.ts": { module: "products", allActions: "view" },
  "products/import/route.ts": { module: "products" },

  // Reports
  "reports/production/route.ts": { module: "reports" },
  "reports/sales/route.ts": { module: "reports" },

  // Settings
  "settings/route.ts": { module: "settings" },

  // Stats (dashboard)
  "stats/route.ts": { module: "dashboard" },

  // B2B
  "b2b/route.ts": { module: "b2b" },
  "b2b/[id]/route.ts": { module: "b2b" },

  // Assets
  "assets/route.ts": { module: "media" },
  "assets/[id]/route.ts": { module: "media" },
  "assets/[id]/links/route.ts": { module: "media" },
  "assets/check-hash/route.ts": { module: "media" },

  // Catalog
  "catalog/route.js": { module: "catalog" },
};

// Methods that are "read" operations (use "view" action)
const READ_METHODS = new Set(["GET"]);

let updated = 0;
let skipped = 0;
let errors = 0;

for (const [routePath, config] of Object.entries(ROUTE_MAP)) {
  const filePath = path.join(BASE, routePath);

  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${filePath}`);
    skipped++;
    continue;
  }

  let content = fs.readFileSync(filePath, "utf8");

  // Skip if already using requirePermission
  if (content.includes("requirePermission")) {
    console.log(`SKIP (already upgraded): ${filePath}`);
    skipped++;
    continue;
  }

  // Skip if doesn't use requireAdminAuth
  if (!content.includes("requireAdminAuth")) {
    console.log(`SKIP (no auth): ${filePath}`);
    skipped++;
    continue;
  }

  // 1. Replace import
  content = content.replace(
    /import\s*\{[^}]*requireAdminAuth[^}]*\}\s*from\s*["']@\/lib\/admin-auth["'];?/,
    (match) => {
      // Keep other imports from the same line
      return match.replace("requireAdminAuth", "requirePermission");
    }
  );

  // 2. Find each function and determine the method (GET/POST/PATCH/PUT/DELETE)
  // Then replace requireAdminAuth(request) with await requirePermission(request, module, action)

  // Strategy: Find each occurrence of requireAdminAuth and look backwards to find which HTTP method it's in
  const lines = content.split("\n");
  let currentMethod = null;

  for (let i = 0; i < lines.length; i++) {
    // Detect function declaration
    const methodMatch = lines[i].match(/export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\s*\(/);
    if (methodMatch) {
      currentMethod = methodMatch[1];
    }

    // Replace requireAdminAuth call
    if (lines[i].includes("requireAdminAuth(")) {
      const action = config.allActions || (READ_METHODS.has(currentMethod) ? "view" : "edit");
      lines[i] = lines[i].replace(
        /requireAdminAuth\((\w+)\)/,
        `await requirePermission($1, "${config.module}", "${action}")`
      );
    }
  }

  content = lines.join("\n");

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`UPDATED: ${filePath} (module: ${config.module})`);
  updated++;
}

console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
