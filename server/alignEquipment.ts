import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Find "Y동 1층" floor plan
  const plan = await prisma.floorPlan.findFirst({
    where: { name: { contains: 'Y동 1층' } }
  });

  if (!plan) {
    console.log("Could not find floor plan containing 'Y동 1층'");
    return;
  }

  // 2. Get all equipment placed on this plan
  const equipment = await prisma.equipment.findMany({
    where: { 
      floorPlanId: plan.id,
      locationX: { not: null },
      locationY: { not: null }
    }
  });

  if (equipment.length === 0) {
    console.log(`No equipment placed on ${plan.name}.`);
    return;
  }

  // 3. Find the average X coordinate
  const avgX = equipment.reduce((sum, eq) => sum + (eq.locationX || 0), 0) / equipment.length;
  console.log(`Found ${equipment.length} items. Aligning to X = ${avgX}`);

  // 4. Update all equipment to use the same X coordinate
  for (const eq of equipment) {
    await prisma.equipment.update({
      where: { id: eq.id },
      data: { locationX: avgX }
    });
  }

  console.log(`Successfully aligned ${equipment.length} equipment on ${plan.name} vertically.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
