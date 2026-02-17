/**
 * Create the first admin user.
 * Usage: node scripts/create-admin.mjs <email> <name> <password> [role]
 * Example: node scripts/create-admin.mjs admin@lunarprint.ca "Admin" "SecurePass123" admin
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, name, password, role = "admin"] = process.argv.slice(2);
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !name || !password) {
    console.error("Usage: node scripts/create-admin.mjs <email> <name> <password> [role]");
    console.error("Roles: admin, cs, merch_ops, design, production, sales, finance, qa");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    console.error(`Admin user with email ${normalizedEmail} already exists (id: ${existing.id}, role: ${existing.role}).`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.adminUser.create({
    data: { email: normalizedEmail, name, passwordHash, role },
  });

  console.log(`Created admin user:`);
  console.log(`  ID:    ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Name:  ${user.name}`);
  console.log(`  Role:  ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
