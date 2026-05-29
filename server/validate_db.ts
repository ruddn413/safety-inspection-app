import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const eqs = await prisma.equipment.findMany({
    orderBy: { id: 'asc' }
  });
  
  const total = eqs.length;
  console.log(`Total equipment count: ${total}`);

  let missingName = 0;
  let missingCategoryMain = 0;
  let missingCategoryDetail = 0;
  let missingSpec = 0;
  let missingCapacity = 0;
  let missingDates = 0;

  const names = new Set();
  const categories = new Set();
  const anomalies = [];

  for (const eq of eqs) {
    if (!eq.name || eq.name === '미분류 기계') missingName++;
    if (!eq.categoryMain) missingCategoryMain++;
    if (!eq.categoryDetail) missingCategoryDetail++;
    if (!eq.specification) missingSpec++;
    if (!eq.capacity) missingCapacity++;
    if (!eq.lastInspectionDate || !eq.nextInspectionDate) missingDates++;

    if (eq.name) names.add(eq.name);
    if (eq.categoryMain) categories.add(eq.categoryMain);

    // Look for data shift anomalies
    // E.g., Date string in capacity
    if (eq.capacity && eq.capacity.length > 20) {
      anomalies.push(`ID ${eq.id}: Capacity looks weird: ${eq.capacity}`);
    }
    // E.g., numbers in name
    if (eq.name && !isNaN(Number(eq.name))) {
      anomalies.push(`ID ${eq.id}: Name is a number: ${eq.name}`);
    }
  }

  console.log('--- Missing Fields ---');
  console.log(`Missing Name: ${missingName}`);
  console.log(`Missing CategoryMain: ${missingCategoryMain}`);
  console.log(`Missing CategoryDetail (비고): ${missingCategoryDetail}`);
  console.log(`Missing Specification: ${missingSpec}`);
  console.log(`Missing Capacity: ${missingCapacity}`);
  console.log(`Missing Dates: ${missingDates}`);

  console.log('\n--- Distinct Values ---');
  console.log(`Names: ${Array.from(names).join(', ')}`);
  console.log(`Categories: ${Array.from(categories).join(', ')}`);

  console.log('\n--- Anomalies Detected ---');
  if (anomalies.length === 0) console.log('None');
  else anomalies.forEach(a => console.log(a));
  
  // Show any records that STILL have null categoryMain
  const unclassified = eqs.filter(e => !e.categoryMain);
  if (unclassified.length > 0) {
    console.log('\n--- Unclassified CategoryMain ---');
    console.log(unclassified.map(e => `ID ${e.id} | Name: ${e.name} | Spec: ${e.specification} | Detail: ${e.categoryDetail}`).join('\n'));
  }

}

main().finally(() => prisma.$disconnect());
