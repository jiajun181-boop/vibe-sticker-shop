import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const images = await prisma.productImage.findMany({
  select: { id: true, url: true, productId: true, alt: true },
  orderBy: { createdAt: 'asc' }
});
console.log('Total product images:', images.length);

// Check for OpenAI/DALL-E URLs
const oai = images.filter(i => i.url && (i.url.includes('openai') || i.url.includes('oaidalleapi') || i.url.includes('dalle')));
console.log('OpenAI/DALL-E images:', oai.length);

// Check for empty/null URLs
const empty = images.filter(i => !i.url || i.url.trim() === '');
console.log('Empty URL images:', empty.length);

// Check for non-UploadThing URLs
const nonUT = images.filter(i => i.url && !i.url.includes('utfs.io') && !i.url.includes('ufs.sh') && !i.url.includes('uploadthing'));
console.log('Non-UploadThing images:', nonUT.length);

if (nonUT.length > 0) {
  console.log('\nNon-UploadThing URLs:');
  nonUT.forEach(i => console.log(`  ${i.id} | ${i.url?.substring(0, 100)}`));
}
if (empty.length > 0) {
  console.log('\nEmpty URLs:');
  empty.forEach(i => console.log(`  ${i.id} | url=${JSON.stringify(i.url)}`));
}

// Show all broken (non-UT + empty)
const brokenIds = [...nonUT, ...empty].map(i => i.id);
console.log(`\nTotal broken images to clean: ${brokenIds.length}`);
if (brokenIds.length > 0) {
  console.log('IDs:', JSON.stringify(brokenIds));
}

await prisma.$disconnect();
