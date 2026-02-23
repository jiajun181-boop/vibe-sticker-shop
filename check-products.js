const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const slugsToCheck = [
    // Section 1 - Yard & Event
    'yard-sign', 'real-estate-sign', 'election-signs', 'open-house-signs',
    'a-frame-sign-stand', 'h-stakes', 'real-estate-frame',
    // Section 2 - Event & Retail
    'selfie-frame-board', 'tri-fold-presentation-board', 'welcome-sign-board',
    'graduation-checks', 'giant-checks', 'presentation-checks',
    'life-size-cutouts',
    'wedding-seating-charts', 'seating-chart-boards',
    'welcome-sign-boards',
    // Section 3 - Business & Property
    'parking-signs', 'parking-property-signs',
    'business-hours-signs',
    'construction-site-signs',
    'wayfinding-signs', 'directional-signs',
    'ada-braille-signs',
    // Section 4 - Custom Boards by Material
    'coroplast-signs', 'coroplast-board-prints',
    'foam-board-prints', 'foamboard-sheet',
    'pvc-sintra-prints', 'pvc-sintra-signs', 'pvc-board-signs',
    'acm-dibond-signs', 'aluminum-composite',
    'acrylic-signs',
  ];
  
  const existing = await prisma.product.findMany({
    where: { slug: { in: slugsToCheck }, isActive: true },
    select: { slug: true, name: true, displayFromPrice: true, minPrice: true, basePrice: true }
  });
  
  const existingSet = new Set(existing.map(p => p.slug));
  
  console.log('=== EXISTING ===');
  existing.forEach(p => console.log(p.slug, '|', p.name, '| display:', p.displayFromPrice, '| min:', p.minPrice));
  
  console.log('\n=== NOT FOUND ===');
  slugsToCheck.filter(s => !existingSet.has(s)).forEach(s => console.log(s));
  
  await prisma.$disconnect();
}
main();
