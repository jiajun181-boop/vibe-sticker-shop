import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const configPath = path.resolve(process.cwd(), "docs", "catalog-config-v1.json");
if (!fs.existsSync(configPath)) {
  console.error(`Missing config file: ${configPath}`);
  process.exit(1);
}

const nextConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

async function main() {
  const existing = await prisma.setting.findUnique({
    where: { key: "catalog.config" },
  });

  const oldCategories = existing?.value?.homepageCategories || [];
  const newCategories = nextConfig?.homepageCategories || [];

  console.log("Catalog config preview:");
  console.log(`- old homepage categories: ${oldCategories.length}`);
  console.log(`- new homepage categories: ${newCategories.length}`);
  console.log(`- new categories: ${newCategories.join(", ")}`);

  if (!APPLY) {
    console.log("");
    console.log("Dry run only. Re-run with --apply to write setting.");
    return;
  }

  await prisma.setting.upsert({
    where: { key: "catalog.config" },
    create: {
      key: "catalog.config",
      value: nextConfig,
    },
    update: {
      value: nextConfig,
    },
  });

  console.log("Applied docs/catalog-config-v1.json to setting key catalog.config");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
