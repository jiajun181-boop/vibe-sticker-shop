/**
 * Delete the stale "catalog.config" setting from the DB
 * so the app falls back to the updated DEFAULTS in code.
 *
 * Usage: node scripts/reset-catalog-config.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.setting.findUnique({
    where: { key: "catalog.config" },
  });

  if (!existing) {
    console.log("No catalog.config setting found in DB — already using code defaults.");
    return;
  }

  await prisma.setting.delete({ where: { key: "catalog.config" } });
  console.log("Deleted catalog.config from Settings table.");
  console.log("The app will now use the DEFAULTS defined in lib/catalogConfig.js.");
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
