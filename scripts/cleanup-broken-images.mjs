import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
  const images = await prisma.productImage.findMany({
    select: { id: true, url: true, productId: true },
  });

  const broken = images.filter(i =>
    !i.url ||
    i.url.trim() === '' ||
    (!i.url.includes('utfs.io') && !i.url.includes('ufs.sh') && !i.url.includes('uploadthing'))
  );

  const valid = images.length - broken.length;

  console.log(`Total ProductImage records: ${images.length}`);
  console.log(`Broken (non-UploadThing): ${broken.length}`);
  console.log(`Valid (UploadThing): ${valid}`);
  console.log('');

  if (broken.length === 0) {
    console.log('Nothing to clean up.');
  } else {
    // Log a sample of what's being deleted
    console.log('Sample broken URLs:');
    broken.slice(0, 5).forEach(i => console.log(`  - [${i.id}] ${i.url}`));
    if (broken.length > 5) console.log(`  ... and ${broken.length - 5} more`);
    console.log('');

    const ids = broken.map(i => i.id);
    const result = await prisma.productImage.deleteMany({
      where: { id: { in: ids } },
    });

    console.log(`Deleted ${result.count} broken ProductImage records.`);
  }
} finally {
  await prisma.$disconnect();
}
