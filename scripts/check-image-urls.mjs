import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const imgs = await p.productImage.findMany({
  take: 20,
  orderBy: { id: "asc" },
  select: { url: true, alt: true },
});
console.log("--- Sample image URLs (first 20) ---");
imgs.forEach((i) => console.log("  " + i.url));

const all = await p.productImage.findMany({ select: { url: true } });

// Classify by URL pattern
const patterns = { local: 0, unsplash: 0, pexels: 0, uploadthing: 0, placeholder: 0, other: 0 };
all.forEach((i) => {
  const u = i.url;
  if (u.startsWith("/")) patterns.local++;
  else if (u.includes("unsplash.com")) patterns.unsplash++;
  else if (u.includes("pexels.com")) patterns.pexels++;
  else if (u.includes("uploadthing") || u.includes("utfs.io") || u.includes("ufs.sh")) patterns.uploadthing++;
  else if (u.includes("placeholder") || u.includes("picsum")) patterns.placeholder++;
  else patterns.other++;
});

console.log("\n--- URL type distribution ---");
for (const [type, count] of Object.entries(patterns)) {
  if (count > 0) console.log("  " + type + ": " + count);
}

// Show some "other" URLs
const others = all.filter(
  (i) =>
    !i.url.startsWith("/") &&
    !i.url.includes("unsplash") &&
    !i.url.includes("pexels") &&
    !i.url.includes("uploadthing") &&
    !i.url.includes("utfs.io") &&
    !i.url.includes("ufs.sh") &&
    !i.url.includes("placeholder") &&
    !i.url.includes("picsum")
);
if (others.length > 0) {
  console.log("\n--- Sample 'other' URLs ---");
  others.slice(0, 10).forEach((i) => console.log("  " + i.url));
}

await p.$disconnect();
